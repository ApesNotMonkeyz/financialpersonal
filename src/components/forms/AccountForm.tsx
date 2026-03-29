import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AmountInput } from '../shared/AmountInput';
import type { Account } from '../../db/schema';

const schema = z.object({
  name: z.string().min(1, 'Navn er påkrevd'),
  type: z.enum(['checking', 'savings', 'cash', 'credit', 'investment', 'loan']),
  institution: z.string(),
  notes: z.string(),
  color: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface AccountFormProps {
  initial?: Partial<Account>;
  onSubmit: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  balance?: number;
  onBalanceChange?: (oere: number) => void;
}

const accountTypeLabels: Record<string, string> = {
  checking: 'Brukskonto',
  savings: 'Sparekonto',
  cash: 'Kontanter',
  credit: 'Kredittkort',
  investment: 'Investeringskonto',
  loan: 'Lånekonto',
};

export function AccountForm({ initial, onSubmit, onCancel, balance = 0, onBalanceChange }: AccountFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      type: initial?.type ?? 'checking',
      institution: initial?.institution ?? '',
      notes: initial?.notes ?? '',
      color: initial?.color ?? '#3b82f6',
    },
  });

  const handleFormSubmit = (data: FormValues) => {
    onSubmit({
      ...data,
      currency: 'NOK',
      balance,
      isActive: true,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Kontonavn *</Label>
        <Input id="name" placeholder="f.eks. DNB Brukskonto" {...register('name')} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Kontotype *</Label>
        <Select defaultValue={initial?.type ?? 'checking'} onValueChange={v => setValue('type', v as Account['type'])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(accountTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Nåværende saldo</Label>
        <AmountInput value={balance} onChange={onBalanceChange ?? (() => {})} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="institution">Bank / institusjon</Label>
        <Input id="institution" placeholder="f.eks. DNB, Nordea" {...register('institution')} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="color">Farge</Label>
        <div className="flex items-center gap-2">
          <input type="color" id="color" {...register('color')} className="h-10 w-12 rounded cursor-pointer border border-gray-200" />
          <span className="text-sm text-gray-500">{watch('color')}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notater</Label>
        <Input id="notes" placeholder="Valgfri beskrivelse" {...register('notes')} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Avbryt</Button>
        <Button type="submit">Lagre</Button>
      </div>
    </form>
  );
}
