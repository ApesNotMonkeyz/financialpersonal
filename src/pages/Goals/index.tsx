import { useState } from 'react';
import { Plus, Target, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
import { useGoals, createGoal, updateGoal, deleteGoal } from '../../hooks/useGoals';
import { formatNOK } from '../../utils/currency';
import { formatDate, formatDateISO } from '../../utils/dates';
import type { Goal } from '../../db/schema';

const typeLabels: Record<string, string> = {
  savings: 'Sparing', debt_payoff: 'Nedbetaling av gjeld', investment: 'Investering', other: 'Annet',
};

const schema = z.object({
  name: z.string().min(1),
  type: z.enum(['savings', 'debt_payoff', 'investment', 'other']),
  targetDate: z.string(),
  notes: z.string(),
  color: z.string(),
});
type FormValues = z.infer<typeof schema>;

export default function GoalsPage() {
  const goals = useGoals();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [targetAmount, setTargetAmount] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);

  const { register, handleSubmit, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', type: 'savings', targetDate: '', notes: '', color: '#22c55e' },
  });

  const handleAdd = () => {
    setEditing(null);
    setTargetAmount(0);
    setCurrentAmount(0);
    reset({ name: '', type: 'savings', targetDate: '', notes: '', color: '#22c55e' });
    setOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    setEditing(goal);
    setTargetAmount(goal.targetAmount);
    setCurrentAmount(goal.currentAmount);
    reset({ name: goal.name, type: goal.type, targetDate: goal.targetDate ? formatDateISO(goal.targetDate) : '', notes: goal.notes, color: goal.color });
    setOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    const payload = { ...data, targetAmount, currentAmount, targetDate: data.targetDate ? new Date(data.targetDate) : undefined, isActive: true };
    if (editing?.id) await updateGoal(editing.id, payload);
    else await createGoal(payload);
    setOpen(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sparemål</h1>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Nytt mål
        </Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Ingen sparemål"
          description="Sett konkrete mål for sparing, nedbetaling av gjeld eller investeringer."
          actionLabel="Opprett mål"
          onAction={handleAdd}
        />
      ) : (
        <div className="space-y-3">
          {goals.map(goal => {
            const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
            return (
              <Card key={goal.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: goal.color + '20', color: goal.color }}>
                      <Target className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{goal.name}</p>
                          <Badge variant="secondary">{typeLabels[goal.type]}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(goal)}><Pencil className="h-4 w-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Slett mål</AlertDialogTitle>
                                <AlertDialogDescription>Slette "{goal.name}"?</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction onClick={() => goal.id && deleteGoal(goal.id)}>Slett</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">{formatNOK(goal.currentAmount)} av {formatNOK(goal.targetAmount)}</span>
                          <span className="font-semibold">{pct} %</span>
                        </div>
                        <Progress value={pct} className="h-3" indicatorClassName="bg-green-500" style={{ '--indicator-color': goal.color } as React.CSSProperties} />
                      </div>
                      {goal.targetDate && (
                        <p className="text-xs text-gray-500 mt-1">Frist: {formatDate(goal.targetDate)}</p>
                      )}
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
            <DialogTitle>{editing ? 'Rediger mål' : 'Nytt sparemål'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Navn *</Label>
              <Input placeholder="f.eks. Nødfond" {...register('name')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select defaultValue={editing?.type ?? 'savings'} onValueChange={v => setValue('type', v as Goal['type'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Frist (valgfritt)</Label>
                <Input type="date" {...register('targetDate')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Målbeløp</Label>
                <AmountInput value={targetAmount} onChange={setTargetAmount} />
              </div>
              <div className="space-y-1.5">
                <Label>Nåværende beløp</Label>
                <AmountInput value={currentAmount} onChange={setCurrentAmount} />
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
