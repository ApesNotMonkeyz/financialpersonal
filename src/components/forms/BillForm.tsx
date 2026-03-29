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
import type { Bill } from '../../db/schema';

const schema = z.object({
  name: z.string().min(1, 'Navn er påkrevd'),
  categoryId: z.coerce.number().min(1, 'Velg kategori'),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly', 'once']),
  dueDay: z.coerce.number().min(1).max(31),
  nextDueDate: z.string().min(1),
  provider: z.string(),
  autopay: z.boolean(),
  status: z.enum(['active', 'paused', 'cancelled']),
  notes: z.string(),
  color: z.string(),
  reminderDays: z.coerce.number().min(0).max(30),
});

type FormValues = z.infer<typeof schema>;

const frequencyLabels: Record<string, string> = {
  weekly: 'Ukentlig',
  monthly: 'Månedlig',
  quarterly: 'Kvartalsvis',
  yearly: 'Årlig',
  once: 'Engangs',
};

interface BillFormProps {
  initial?: Partial<Bill>;
  amount?: number;
  onAmountChange?: (oere: number) => void;
  onSubmit: (data: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function BillForm({ initial, amount = 0, onAmountChange, onSubmit, onCancel }: BillFormProps) {
  const categories = useCategories('expense');
  const [localAmount, setLocalAmount] = useState(amount);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      name: initial?.name ?? '',
      categoryId: initial?.categoryId ?? 0,
      frequency: initial?.frequency ?? 'monthly',
      dueDay: initial?.dueDay ?? 1,
      nextDueDate: initial?.nextDueDate ? formatDateISO(initial.nextDueDate) : formatDateISO(new Date()),
      provider: initial?.provider ?? '',
      autopay: initial?.autopay ?? false,
      status: initial?.status ?? 'active',
      notes: initial?.notes ?? '',
      color: initial?.color ?? '#3b82f6',
      reminderDays: initial?.reminderDays ?? 3,
    },
  });

  const handleFormSubmit = (data: FormValues) => {
    onSubmit({
      ...data,
      amount: onAmountChange ? amount : localAmount,
      currency: 'NOK',
      nextDueDate: new Date(data.nextDueDate),
    });
  };

  const handleAmountChange = (oere: number) => {
    setLocalAmount(oere);
    onAmountChange?.(oere);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Navn *</Label>
        <Input id="name" placeholder="f.eks. Husleie" {...register('name')} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Beløp *</Label>
          <AmountInput value={onAmountChange ? amount : localAmount} onChange={handleAmountChange} />
        </div>

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
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Frekvens</Label>
          <Select defaultValue={initial?.frequency ?? 'monthly'} onValueChange={v => setValue('frequency', v as Bill['frequency'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(frequencyLabels).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nextDueDate">Neste forfall</Label>
          <Input type="date" id="nextDueDate" {...register('nextDueDate')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="provider">Leverandør</Label>
          <Input id="provider" placeholder="f.eks. Hafslund" {...register('provider')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reminderDays">Påminnelse (dager før)</Label>
          <Input type="number" id="reminderDays" min="0" max="30" {...register('reminderDays')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notater</Label>
        <Input id="notes" {...register('notes')} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Avbryt</Button>
        <Button type="submit">Lagre</Button>
      </div>
    </form>
  );
}
