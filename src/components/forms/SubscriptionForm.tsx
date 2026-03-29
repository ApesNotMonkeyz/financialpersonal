import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AmountInput } from '../shared/AmountInput';
import { useCategories } from '../../hooks/useCategories';
import { formatDateISO } from '../../utils/dates';
import type { Subscription } from '../../db/schema';

const schema = z.object({
  name: z.string().min(1, 'Navn er påkrevd'),
  categoryId: z.coerce.number().min(1, 'Velg kategori'),
  billingCycle: z.enum(['monthly', 'yearly']),
  nextBillingDate: z.string().min(1),
  provider: z.string(),
  status: z.enum(['active', 'trial', 'paused', 'cancelled']),
  websiteUrl: z.string(),
  notes: z.string(),
  color: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface SubscriptionFormProps {
  initial?: Partial<Subscription>;
  onSubmit: (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function SubscriptionForm({ initial, onSubmit, onCancel }: SubscriptionFormProps) {
  const categories = useCategories('expense');
  const [amount, setAmount] = useState(initial?.amount ?? 0);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      name: initial?.name ?? '',
      categoryId: initial?.categoryId ?? 0,
      billingCycle: initial?.billingCycle ?? 'monthly',
      nextBillingDate: initial?.nextBillingDate ? formatDateISO(initial.nextBillingDate) : formatDateISO(new Date()),
      provider: initial?.provider ?? '',
      status: initial?.status ?? 'active',
      websiteUrl: initial?.websiteUrl ?? '',
      notes: initial?.notes ?? '',
      color: initial?.color ?? '#06b6d4',
    },
  });

  const handleFormSubmit = (data: FormValues) => {
    onSubmit({
      ...data,
      amount,
      currency: 'NOK',
      nextBillingDate: new Date(data.nextBillingDate),
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Navn *</Label>
        <Input id="name" placeholder="f.eks. Netflix" {...register('name')} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Beløp *</Label>
          <AmountInput value={amount} onChange={setAmount} />
        </div>
        <div className="space-y-1.5">
          <Label>Syklus</Label>
          <Select defaultValue={initial?.billingCycle ?? 'monthly'} onValueChange={v => setValue('billingCycle', v as Subscription['billingCycle'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Månedlig</SelectItem>
              <SelectItem value="yearly">Årlig</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Kategori *</Label>
          <Select defaultValue={String(initial?.categoryId ?? '')} onValueChange={v => setValue('categoryId', parseInt(v))}>
            <SelectTrigger><SelectValue placeholder="Velg" /></SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.icon} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nextBillingDate">Neste faktura</Label>
          <Input type="date" id="nextBillingDate" {...register('nextBillingDate')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select defaultValue={initial?.status ?? 'active'} onValueChange={v => setValue('status', v as Subscription['status'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="trial">Prøveperiode</SelectItem>
              <SelectItem value="paused">Pauset</SelectItem>
              <SelectItem value="cancelled">Avsluttet</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="provider">Leverandør</Label>
          <Input id="provider" {...register('provider')} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Avbryt</Button>
        <Button type="submit">Lagre</Button>
      </div>
    </form>
  );
}
