import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AmountInput } from '../shared/AmountInput';
import { useAccounts } from '../../hooks/useAccounts';
import { useCategories } from '../../hooks/useCategories';
import { formatDateISO } from '../../utils/dates';
import type { Transaction } from '../../db/schema';

const schema = z.object({
  description: z.string().min(1, 'Beskrivelse er påkrevd'),
  date: z.string().min(1, 'Dato er påkrevd'),
  accountId: z.coerce.number().min(1, 'Velg konto'),
  categoryId: z.coerce.number().min(1, 'Velg kategori'),
  type: z.enum(['expense', 'income', 'transfer']),
  notes: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface TransactionFormProps {
  initial?: Partial<Transaction>;
  amount?: number;
  onAmountChange?: (oere: number) => void;
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function TransactionForm({ initial, amount = 0, onAmountChange, onSubmit, onCancel }: TransactionFormProps) {
  const accounts = useAccounts();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      description: initial?.description ?? '',
      date: initial?.date ? formatDateISO(initial.date) : formatDateISO(new Date()),
      accountId: initial?.accountId ?? 0,
      categoryId: initial?.categoryId ?? 0,
      type: initial?.type ?? 'expense',
      notes: initial?.notes ?? '',
    },
  });

  const txType = watch('type');
  const expenseCategories = useCategories('expense');
  const incomeCategories = useCategories('income');
  const categories = txType === 'income' ? incomeCategories : expenseCategories;

  const handleFormSubmit = (data: FormValues) => {
    onSubmit({
      accountId: data.accountId,
      categoryId: data.categoryId,
      amount,
      date: new Date(data.date),
      description: data.description,
      type: data.type,
      notes: data.notes,
      tags: [],
      isRecurring: false,
      isReconciled: false,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Type</Label>
        <div className="flex gap-2">
          {(['expense', 'income', 'transfer'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setValue('type', t)}
              className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                txType === t
                  ? t === 'expense' ? 'bg-red-50 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400'
                  : t === 'income' ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400'
                  : 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400'
              }`}
            >
              {t === 'expense' ? 'Utgift' : t === 'income' ? 'Inntekt' : 'Overføring'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Beløp *</Label>
        <AmountInput value={amount} onChange={onAmountChange ?? (() => {})} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Beskrivelse *</Label>
        <Input id="description" placeholder="f.eks. Dagligvarer Rema" {...register('description')} />
        {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="date">Dato *</Label>
          <Input type="date" id="date" {...register('date')} />
          {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Konto *</Label>
          <Select onValueChange={v => setValue('accountId', parseInt(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Velg konto" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(a => (
                <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.accountId && <p className="text-xs text-red-500">{errors.accountId.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Kategori *</Label>
        <Select onValueChange={v => setValue('categoryId', parseInt(v))}>
          <SelectTrigger>
            <SelectValue placeholder="Velg kategori" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.icon} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notater</Label>
        <Input id="notes" placeholder="Valgfri merknad" {...register('notes')} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Avbryt</Button>
        <Button type="submit">Lagre</Button>
      </div>
    </form>
  );
}
