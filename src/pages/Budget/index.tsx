import { useState } from 'react';
import { PiggyBank, Pencil } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AmountInput } from '../../components/shared/AmountInput';
import { EmptyState } from '../../components/shared/EmptyState';
import { useAppStore } from '../../stores/useAppStore';
import { useBudgetsByMonth, useMonthlySpending, upsertBudget } from '../../hooks/useBudgets';
import { useCategories } from '../../hooks/useCategories';
import { formatNOK, formatNOKCompact } from '../../utils/currency';
import { budgetProgress } from '../../utils/calculations';
import { cn } from '../../utils/cn';

export default function BudgetPage() {
  const { selectedYear, selectedMonth } = useAppStore();
  const budgets = useBudgetsByMonth(selectedYear, selectedMonth);
  const spending = useMonthlySpending(selectedYear, selectedMonth);
  const categories = useCategories('expense');

  const [open, setOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const [budgetAmount, setBudgetAmount] = useState(0);

  const budgetMap = Object.fromEntries(budgets.map(b => [b.categoryId, b]));

  const categoriesWithData = categories.map(cat => {
    const budget = budgetMap[cat.id!];
    const spent = spending[cat.id!] ?? 0;
    const budgeted = budget?.amount ?? 0;
    const pct = budgeted > 0 ? budgetProgress(spent, budgeted) : 0;
    return { category: cat, budget, spent, budgeted, pct };
  }).filter(item => item.spent > 0 || item.budgeted > 0);

  const totalBudgeted = categoriesWithData.reduce((s, i) => s + i.budgeted, 0);
  const totalSpent = categoriesWithData.reduce((s, i) => s + i.spent, 0);

  const handleEditBudget = (categoryId: number) => {
    const existing = budgetMap[categoryId];
    setSelectedCategoryId(categoryId);
    setBudgetAmount(existing?.amount ?? 0);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!selectedCategoryId) return;
    await upsertBudget({
      categoryId: selectedCategoryId,
      amount: budgetAmount,
      period: 'monthly',
      year: selectedYear,
      month: selectedMonth,
      rollover: false,
      notes: '',
    });
    setOpen(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Budsjett</h1>
        <Button onClick={() => { setSelectedCategoryId(0); setBudgetAmount(0); setOpen(true); }}>
          <Pencil className="h-4 w-4 mr-2" />
          Sett budsjett
        </Button>
      </div>

      {totalBudgeted > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Totalt brukt</span>
              <span className="font-semibold">{formatNOKCompact(totalSpent)} / {formatNOKCompact(totalBudgeted)}</span>
            </div>
            <Progress
              value={Math.min(100, budgetProgress(totalSpent, totalBudgeted))}
              className="h-3"
              indicatorClassName={
                totalSpent > totalBudgeted ? 'bg-red-500' :
                totalSpent > totalBudgeted * 0.8 ? 'bg-yellow-500' : 'bg-green-500'
              }
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatNOK(Math.max(0, totalBudgeted - totalSpent))} igjen av budsjett
            </p>
          </CardContent>
        </Card>
      )}

      {categoriesWithData.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="Ingen budsjettdata"
          description="Sett budsjetter for kategoriene dine, og logg transaksjoner for å se fremgang."
          actionLabel="Sett budsjett"
          onAction={() => { setSelectedCategoryId(0); setBudgetAmount(0); setOpen(true); }}
        />
      ) : (
        <div className="space-y-3">
          {categoriesWithData
            .sort((a, b) => b.spent - a.spent)
            .map(({ category, spent, budgeted, pct }) => (
              <Card key={category.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{category.icon}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatNOKCompact(spent)}{budgeted > 0 ? ` / ${formatNOKCompact(budgeted)}` : ''}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => category.id && handleEditBudget(category.id)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {budgeted > 0 && (
                    <>
                      <Progress
                        value={Math.min(100, pct)}
                        className="h-2"
                        indicatorClassName={cn(
                          pct > 100 ? 'bg-red-500' :
                          pct > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        )}
                      />
                      <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                        {pct > 100
                          ? `${formatNOK(spent - budgeted)} over budsjett`
                          : `${formatNOK(budgeted - spent)} igjen`
                        }
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sett budsjett</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select
                value={String(selectedCategoryId)}
                onValueChange={v => {
                  const id = parseInt(v);
                  setSelectedCategoryId(id);
                  const existing = budgetMap[id];
                  setBudgetAmount(existing?.amount ?? 0);
                }}
              >
                <SelectTrigger><SelectValue placeholder="Velg kategori" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Budsjettbeløp per måned</Label>
              <AmountInput value={budgetAmount} onChange={setBudgetAmount} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
              <Button onClick={handleSave} disabled={!selectedCategoryId}>Lagre</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
