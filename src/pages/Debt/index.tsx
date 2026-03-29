import { useState } from 'react';
import { Plus, CreditCard, Pencil, Trash2 } from 'lucide-react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AmountInput } from '../../components/shared/AmountInput';
import { EmptyState } from '../../components/shared/EmptyState';
import { useDebts, useDebtStats, createDebt, updateDebt, deleteDebt } from '../../hooks/useDebts';
import { formatNOK } from '../../utils/currency';
import { formatDateISO } from '../../utils/dates';
import { calculatePayoffMonths } from '../../utils/calculations';
import type { Debt } from '../../db/schema';

const typeLabels: Record<string, string> = {
  mortgage: 'Boliglån', car_loan: 'Billån', student_loan: 'Studielån',
  credit_card: 'Kredittkort', personal_loan: 'Forbrukslån', other: 'Annet',
};

const schema = z.object({
  name: z.string().min(1),
  type: z.enum(['mortgage', 'car_loan', 'student_loan', 'credit_card', 'personal_loan', 'other']),
  interestRate: z.coerce.number().min(0).max(100),
  paymentDueDay: z.coerce.number().min(1).max(31),
  startDate: z.string(),
  institution: z.string(),
  notes: z.string(),
});
type FormValues = z.infer<typeof schema>;

export default function DebtPage() {
  const debts = useDebts('active');
  const stats = useDebtStats();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [originalAmount, setOriginalAmount] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [minimumPayment, setMinimumPayment] = useState(0);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { name: '', type: 'personal_loan', interestRate: 0, paymentDueDay: 1, startDate: formatDateISO(new Date()), institution: '', notes: '' },
  });

  const handleAdd = () => {
    setEditing(null);
    setOriginalAmount(0);
    setCurrentBalance(0);
    setMinimumPayment(0);
    reset({ name: '', type: 'personal_loan', interestRate: 0, paymentDueDay: 1, startDate: formatDateISO(new Date()), institution: '', notes: '' });
    setOpen(true);
  };

  const handleEdit = (debt: Debt) => {
    setEditing(debt);
    setOriginalAmount(debt.originalAmount);
    setCurrentBalance(debt.currentBalance);
    setMinimumPayment(debt.minimumPayment);
    reset({ name: debt.name, type: debt.type, interestRate: debt.interestRate, paymentDueDay: debt.paymentDueDay, startDate: formatDateISO(debt.startDate), institution: debt.institution, notes: debt.notes });
    setOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    const payload = { ...data, originalAmount, currentBalance, minimumPayment, startDate: new Date(data.startDate), status: 'active' as const };
    if (editing?.id) await updateDebt(editing.id, payload);
    else await createDebt(payload);
    setOpen(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gjeld</h1>
          <p className="text-sm text-gray-500">
            Total gjeld: <span className="font-semibold text-red-500">{formatNOK(stats.totalBalance)}</span>
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Nytt lån
        </Button>
      </div>

      {stats.count > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total gjeld</p>
                <p className="text-2xl font-bold text-red-500">{formatNOK(stats.totalBalance)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Månedlig minimumsavdrag</p>
                <p className="text-2xl font-bold">{formatNOK(stats.totalMinPayment)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {debts.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Ingen aktiv gjeld"
          description="Legg til lån og annen gjeld for å spore nedbetalingsplan og total rente."
          actionLabel="Legg til lån"
          onAction={handleAdd}
        />
      ) : (
        <div className="space-y-3">
          {debts.map(debt => {
            const payoffMonths = calculatePayoffMonths(debt.currentBalance, debt.interestRate, debt.minimumPayment);
            const paidPct = debt.originalAmount > 0
              ? Math.round(((debt.originalAmount - debt.currentBalance) / debt.originalAmount) * 100)
              : 0;
            return (
              <Card key={debt.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                      <CreditCard className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{debt.name}</p>
                          <Badge variant="secondary">{typeLabels[debt.type]}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(debt)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Slett lån</AlertDialogTitle>
                                <AlertDialogDescription>Slette "{debt.name}"?</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction onClick={() => debt.id && deleteDebt(debt.id)}>Slett</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                        <div>
                          <p className="text-gray-500">Restgjeld</p>
                          <p className="font-semibold text-red-500">{formatNOK(debt.currentBalance)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Rente (p.a.)</p>
                          <p className="font-semibold">{debt.interestRate.toFixed(2)} %</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Min. avdrag</p>
                          <p className="font-semibold">{formatNOK(debt.minimumPayment)}</p>
                        </div>
                      </div>
                      {debt.institution && <p className="text-xs text-gray-400 mt-1">{debt.institution}</p>}
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Nedbetalt {paidPct} %</span>
                          {payoffMonths && <span>~{payoffMonths} måneder igjen</span>}
                        </div>
                        <Progress value={paidPct} className="h-2" indicatorClassName="bg-green-500" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger lån' : 'Nytt lån'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Navn *</Label>
                <Input placeholder="f.eks. Boliglån DNB" {...register('name')} />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select defaultValue={editing?.type ?? 'personal_loan'} onValueChange={v => setValue('type', v as Debt['type'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Opprinnelig beløp</Label>
                <AmountInput value={originalAmount} onChange={setOriginalAmount} />
              </div>
              <div className="space-y-1.5">
                <Label>Nåværende restgjeld</Label>
                <AmountInput value={currentBalance} onChange={setCurrentBalance} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Rente % (p.a.)</Label>
                <Input type="number" step="0.01" placeholder="5,00" {...register('interestRate')} />
              </div>
              <div className="space-y-1.5">
                <Label>Min. avdrag</Label>
                <AmountInput value={minimumPayment} onChange={setMinimumPayment} />
              </div>
              <div className="space-y-1.5">
                <Label>Betalingsdag</Label>
                <Input type="number" min="1" max="31" {...register('paymentDueDay')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Startet</Label>
                <Input type="date" {...register('startDate')} />
              </div>
              <div className="space-y-1.5">
                <Label>Bank</Label>
                <Input placeholder="f.eks. DNB" {...register('institution')} />
              </div>
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
