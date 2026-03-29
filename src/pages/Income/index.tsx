import { useState } from 'react';
import { Plus, TrendingUp, Pencil, Trash2 } from 'lucide-react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AmountInput } from '../../components/shared/AmountInput';
import { EmptyState } from '../../components/shared/EmptyState';
import { useIncomeSources, createIncomeSource, updateIncomeSource, deleteIncomeSource } from '../../hooks/useIncomeSources';
import { useAccounts } from '../../hooks/useAccounts';
import { formatNOK } from '../../utils/currency';
import type { IncomeSource } from '../../db/schema';

const typeLabels: Record<string, string> = {
  salary: 'Lønn', freelance: 'Freelance', passive: 'Passiv', investment: 'Investering', other: 'Annet',
};
const freqLabels: Record<string, string> = {
  weekly: 'Ukentlig', biweekly: 'Annenhver uke', monthly: 'Månedlig',
  quarterly: 'Kvartalsvis', yearly: 'Årlig', irregular: 'Uregelmessig',
};

const schema = z.object({
  name: z.string().min(1),
  type: z.enum(['salary', 'freelance', 'passive', 'investment', 'other']),
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'irregular']),
  accountId: z.coerce.number().min(1),
  notes: z.string(),
});
type FormValues = z.infer<typeof schema>;

export default function IncomePage() {
  const sources = useIncomeSources();
  const accounts = useAccounts();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeSource | null>(null);
  const [amount, setAmount] = useState(0);

  const totalMonthly = sources
    .filter(s => s.isActive && s.frequency === 'monthly')
    .reduce((sum, s) => sum + s.amount, 0);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { name: '', type: 'salary', frequency: 'monthly', accountId: 0, notes: '' },
  });

  const handleAdd = () => {
    setEditing(null);
    setAmount(0);
    reset({ name: '', type: 'salary', frequency: 'monthly', accountId: 0, notes: '' });
    setOpen(true);
  };

  const handleEdit = (src: IncomeSource) => {
    setEditing(src);
    setAmount(src.amount);
    reset({ name: src.name, type: src.type, frequency: src.frequency, accountId: src.accountId, notes: src.notes });
    setOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    const payload = { ...data, amount, isActive: true, taxRate: undefined };
    if (editing?.id) await updateIncomeSource(editing.id, payload);
    else await createIncomeSource(payload);
    setOpen(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inntekter</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Estimert månedlig: <span className="font-semibold text-green-600">{formatNOK(totalMonthly)}</span>
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Ny inntektskilde
        </Button>
      </div>

      {sources.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Ingen inntektskilder"
          description="Legg til inntektskilder som lønn, freelance-inntekter og passive inntekter."
          actionLabel="Legg til inntektskilde"
          onAction={handleAdd}
        />
      ) : (
        <div className="space-y-3">
          {sources.map(src => {
            const account = accounts.find(a => a.id === src.accountId);
            return (
              <Card key={src.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{src.name}</p>
                        <Badge variant="secondary">{typeLabels[src.type]}</Badge>
                        <Badge variant="secondary">{freqLabels[src.frequency]}</Badge>
                      </div>
                      {account && <p className="text-sm text-gray-500 mt-0.5">{account.name}</p>}
                    </div>
                    <p className="font-bold text-lg text-green-600 dark:text-green-400 shrink-0">{formatNOK(src.amount)}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(src)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Slett inntektskilde</AlertDialogTitle>
                            <AlertDialogDescription>Slette "{src.name}"?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction onClick={() => src.id && deleteIncomeSource(src.id)}>Slett</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger inntektskilde' : 'Ny inntektskilde'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Navn *</Label>
              <Input id="name" placeholder="f.eks. Månedlig lønn" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select defaultValue={editing?.type ?? 'salary'} onValueChange={v => setValue('type', v as IncomeSource['type'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Frekvens</Label>
                <Select defaultValue={editing?.frequency ?? 'monthly'} onValueChange={v => setValue('frequency', v as IncomeSource['frequency'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(freqLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Beløp</Label>
              <AmountInput value={amount} onChange={setAmount} />
            </div>
            <div className="space-y-1.5">
              <Label>Konto</Label>
              <Select defaultValue={String(editing?.accountId ?? '')} onValueChange={v => setValue('accountId', parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Velg konto" /></SelectTrigger>
                <SelectContent>
                  {accounts.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
              <Button type="submit">Lagre</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
