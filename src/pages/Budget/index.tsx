import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Copy, PiggyBank, Check, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { AmountInput } from '../../components/shared/AmountInput';
import { useAppStore } from '../../stores/useAppStore';
import { useBudgetsByMonth, useMonthlySpending, upsertBudget, deleteBudget } from '../../hooks/useBudgets';
import { useCategories, createCategory, updateCategory, deleteCategory } from '../../hooks/useCategories';
import { formatNOK, formatNOKCompact } from '../../utils/currency';
import { formatMonth, nextMonth, prevMonth } from '../../utils/dates';
import { budgetProgress } from '../../utils/calculations';
import { cn } from '../../utils/cn';
import { db } from '../../db';
import type { Category } from '../../db/schema';

// ──────────────────────────────────────────────
// Inline amount editor component
// ──────────────────────────────────────────────
function InlineBudgetInput({
  value,
  onSave,
  onCancel,
}: {
  value: number;
  onSave: (val: number) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onCancel();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onCancel]);

  return (
    <div ref={ref} className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <AmountInput value={amount} onChange={setAmount} className="w-36 h-7 text-sm" />
      <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => onSave(amount)}>
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400" onClick={onCancel}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Category editor dialog
// ──────────────────────────────────────────────
const PRESET_COLORS = [
  '#ef4444','#f97316','#f59e0b','#84cc16','#22c55e',
  '#14b8a6','#06b6d4','#3b82f6','#8b5cf6','#ec4899',
  '#94a3b8','#64748b',
];
const PRESET_ICONS = ['🛒','🚗','🏠','💊','🎭','✈️','🍽️','📱','👕','🎓','💪','🐾','🎮','📦','💰','🏦','🛠️','🌿','🎁','📚'];

function CategoryDialog({
  open,
  onOpenChange,
  editing,
  defaultType,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Category | null;
  defaultType: 'expense' | 'income';
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>(defaultType);
  const [color, setColor] = useState('#94a3b8');
  const [icon, setIcon] = useState('📦');

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '');
      setType(editing?.type ?? defaultType);
      setColor(editing?.color ?? '#94a3b8');
      setIcon(editing?.icon ?? '📦');
    }
  }, [open, editing, defaultType]);

  const handleSave = async () => {
    if (!name.trim()) return;
    const data = { name: name.trim(), type, color, icon, isDefault: false };
    if (editing?.id) await updateCategory(editing.id, data);
    else await createCategory(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? 'Rediger kategori' : 'Ny kategori'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Navn *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Kategorinavn" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={v => setType(v as 'expense' | 'income')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Utgift</SelectItem>
                <SelectItem value="income">Inntekt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Ikon</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ICONS.map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={cn(
                    'w-8 h-8 text-base rounded border transition-colors',
                    icon === i ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700'
                  )}
                >
                  {i}
                </button>
              ))}
              <Input
                value={icon}
                onChange={e => setIcon(e.target.value)}
                maxLength={2}
                className="w-8 h-8 p-0 text-center text-base border-dashed"
                title="Skriv inn valgfritt emoji"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Farge</Label>
            <div className="flex flex-wrap gap-1.5 items-center">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-transform',
                    color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-6 h-6 rounded-full cursor-pointer border border-gray-200"
                title="Velg egendefinert farge"
              />
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-base ml-1"
                style={{ backgroundColor: color + '30' }}
              >
                {icon}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
            <Button onClick={handleSave} disabled={!name.trim()}>Lagre</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Main Budget page
// ──────────────────────────────────────────────
export default function BudgetPage() {
  const { selectedYear, selectedMonth, setSelectedMonth } = useAppStore();
  const budgets = useBudgetsByMonth(selectedYear, selectedMonth);
  const spending = useMonthlySpending(selectedYear, selectedMonth);
  const categories = useCategories('expense');

  // Inline editing state
  const [editingBudgetCatId, setEditingBudgetCatId] = useState<number | null>(null);

  // Category dialog state
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  // Section toggle
  const [showCatSection, setShowCatSection] = useState(false);

  // Copy status
  const [copyStatus, setCopyStatus] = useState('');

  const budgetMap = Object.fromEntries(budgets.map(b => [b.categoryId, b]));

  // All categories with computed data
  const rows = categories.map(cat => {
    const budget = budgetMap[cat.id!];
    const spent = spending[cat.id!] ?? 0;
    const budgeted = budget?.amount ?? 0;
    const pct = budgeted > 0 ? budgetProgress(spent, budgeted) : 0;
    return { cat, budget, spent, budgeted, pct };
  });

  const totalBudgeted = rows.reduce((s, r) => s + r.budgeted, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const totalPct = totalBudgeted > 0 ? budgetProgress(totalSpent, totalBudgeted) : 0;

  // Month navigation
  const goNext = () => { const { year, month } = nextMonth(selectedYear, selectedMonth); setSelectedMonth(year, month); };
  const goPrev = () => { const { year, month } = prevMonth(selectedYear, selectedMonth); setSelectedMonth(year, month); };

  // Save inline budget
  const handleSaveBudget = async (categoryId: number, amount: number) => {
    const budget = budgetMap[categoryId];
    if (amount === 0 && budget?.id) {
      await deleteBudget(budget.id);
    } else if (amount > 0) {
      await upsertBudget({
        categoryId,
        amount,
        period: 'monthly',
        year: selectedYear,
        month: selectedMonth,
        rollover: budget?.rollover ?? false,
        notes: budget?.notes ?? '',
      });
    }
    setEditingBudgetCatId(null);
  };

  // Copy budgets from previous month
  const handleCopyFromPrev = async () => {
    const { year: py, month: pm } = prevMonth(selectedYear, selectedMonth);
    const prevBudgets = await db.budgets.filter(b => b.year === py && b.month === pm).toArray();
    if (prevBudgets.length === 0) { setCopyStatus('Ingen budsjetter i forrige måned'); setTimeout(() => setCopyStatus(''), 3000); return; }
    for (const pb of prevBudgets) {
      const existing = budgetMap[pb.categoryId];
      if (!existing) {
        await upsertBudget({
          categoryId: pb.categoryId,
          amount: pb.amount,
          period: 'monthly',
          year: selectedYear,
          month: selectedMonth,
          rollover: pb.rollover,
          notes: pb.notes,
        });
      }
    }
    setCopyStatus(`Kopierte ${prevBudgets.length} budsjetter`);
    setTimeout(() => setCopyStatus(''), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Budsjett</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleCopyFromPrev} title="Kopier fra forrige måned">
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Kopier fra forrige
          </Button>
          <Button
            variant={showCatSection ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowCatSection(v => !v)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Kategorier
          </Button>
        </div>
      </div>

      {copyStatus && (
        <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
          {copyStatus}
        </div>
      )}

      {/* ── Month navigator ── */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" size="icon" onClick={goPrev}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="text-base font-semibold min-w-[140px] text-center">
          {formatMonth(selectedYear, selectedMonth)}
        </span>
        <Button variant="ghost" size="icon" onClick={goNext}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      {/* ── Category management section ── */}
      {showCatSection && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Administrer kategorier</CardTitle>
              <Button size="sm" onClick={() => { setEditingCat(null); setCatDialogOpen(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Ny kategori
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {categories.length === 0 && (
              <p className="text-sm text-gray-500 px-4 py-3">Ingen kategorier ennå.</p>
            )}
            {categories.map(cat => (
              <div
                key={cat.id}
                className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 first:border-0"
              >
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: cat.color + '20' }}
                >
                  {cat.icon}
                </div>
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="flex-1 text-sm font-medium">{cat.name}</span>
                {cat.isDefault && <Badge variant="secondary" className="text-xs">Standard</Badge>}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => { setEditingCat(cat); setCatDialogOpen(true); }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {!cat.isDefault && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Slett kategori</AlertDialogTitle>
                        <AlertDialogDescription>
                          Slette "{cat.name}"? Transaksjoner og regninger vil bli flyttet til "Diverse utgifter".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction onClick={() => cat.id && deleteCategory(cat.id)}>Slett</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Summary card ── */}
      {totalBudgeted > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-3 mb-3 text-center">
              <div>
                <p className="text-xs text-gray-500">Budsjettert</p>
                <p className="font-bold text-gray-900 dark:text-gray-100">{formatNOKCompact(totalBudgeted)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Brukt</p>
                <p className={cn('font-bold', totalSpent > totalBudgeted ? 'text-red-500' : 'text-gray-900 dark:text-gray-100')}>
                  {formatNOKCompact(totalSpent)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Igjen</p>
                <p className={cn('font-bold', totalSpent > totalBudgeted ? 'text-red-500' : 'text-green-600')}>
                  {formatNOKCompact(Math.max(0, totalBudgeted - totalSpent))}
                </p>
              </div>
            </div>
            <Progress
              value={Math.min(100, totalPct)}
              className="h-2.5"
              indicatorClassName={
                totalPct > 100 ? 'bg-red-500' :
                totalPct > 80 ? 'bg-yellow-500' : 'bg-green-500'
              }
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(totalPct)} % av totalbudsjett brukt</p>
          </CardContent>
        </Card>
      )}

      {/* ── Budget rows ── */}
      {rows.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <PiggyBank className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Ingen utgiftskategorier</p>
          <p className="text-sm mt-1">Legg til kategorier via "Kategorier"-knappen over.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows
            .sort((a, b) => {
              // Sort: categories with budget first, then by amount spent desc
              if (a.budgeted > 0 && b.budgeted === 0) return -1;
              if (a.budgeted === 0 && b.budgeted > 0) return 1;
              return b.spent - a.spent;
            })
            .map(({ cat, spent, budgeted, pct }) => (
              <Card key={cat.id} className={cn(pct > 100 ? 'border-red-200 dark:border-red-900' : '')}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                      style={{ backgroundColor: cat.color + '20' }}
                    >
                      {cat.icon}
                    </div>

                    {/* Name + progress */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{cat.name}</span>
                        <span className="text-xs text-gray-500 shrink-0">
                          {formatNOKCompact(spent)}
                          {budgeted > 0 && <> / {formatNOKCompact(budgeted)}</>}
                        </span>
                      </div>
                      {budgeted > 0 && (
                        <div className="mt-1.5">
                          <Progress
                            value={Math.min(100, pct)}
                            className="h-1.5"
                            indicatorClassName={cn(
                              pct > 100 ? 'bg-red-500' :
                              pct > 80 ? 'bg-yellow-500' : 'bg-green-500'
                            )}
                          />
                          <p className="text-xs mt-0.5 text-gray-400">
                            {pct > 100
                              ? `${formatNOK(spent - budgeted)} over budsjett`
                              : `${formatNOK(budgeted - spent)} igjen`
                            }
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Inline budget editor or edit button */}
                    <div className="shrink-0">
                      {editingBudgetCatId === cat.id ? (
                        <InlineBudgetInput
                          value={budgeted}
                          onSave={(val) => cat.id && handleSaveBudget(cat.id, val)}
                          onCancel={() => setEditingBudgetCatId(null)}
                        />
                      ) : (
                        <button
                          onClick={() => setEditingBudgetCatId(cat.id!)}
                          className={cn(
                            'text-xs px-2 py-1 rounded border transition-colors',
                            budgeted > 0
                              ? 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                              : 'border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:text-blue-600 hover:border-blue-300'
                          )}
                          title="Klikk for å sette budsjett"
                        >
                          {budgeted > 0 ? formatNOKCompact(budgeted) : '+ Sett budsjett'}
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Category dialog */}
      <CategoryDialog
        open={catDialogOpen}
        onOpenChange={setCatDialogOpen}
        editing={editingCat}
        defaultType="expense"
      />
    </div>
  );
}
