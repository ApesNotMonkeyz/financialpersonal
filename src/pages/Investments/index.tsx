import { useState } from 'react';
import { Plus, BarChart3, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
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
import { useInvestments, useInvestmentStats, createInvestment, updateInvestment, deleteInvestment } from '../../hooks/useInvestments';
import { useAccounts } from '../../hooks/useAccounts';
import { formatNOK, formatPercent } from '../../utils/currency';
import { formatDateISO } from '../../utils/dates';
import type { Investment } from '../../db/schema';

const typeLabels: Record<string, string> = {
  stock: 'Aksje', fund: 'Fond', etf: 'ETF', crypto: 'Krypto',
  savings_account: 'BSU/Sparekonto', bonds: 'Obligasjon', other: 'Annet',
};

const schema = z.object({
  name: z.string().min(1),
  type: z.enum(['stock', 'fund', 'etf', 'crypto', 'savings_account', 'bonds', 'other']),
  accountId: z.coerce.number().min(1),
  ticker: z.string(),
  quantity: z.coerce.number().min(0),
  purchaseDate: z.string(),
  institution: z.string(),
  currency: z.string(),
  notes: z.string(),
});
type FormValues = z.infer<typeof schema>;

export default function InvestmentsPage() {
  const investments = useInvestments();
  const stats = useInvestmentStats();
  const accounts = useAccounts();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { name: '', type: 'fund', accountId: 0, ticker: '', quantity: 1, purchaseDate: formatDateISO(new Date()), institution: '', currency: 'NOK', notes: '' },
  });

  const handleAdd = () => {
    setEditing(null);
    setPurchasePrice(0);
    setCurrentPrice(0);
    reset({ name: '', type: 'fund', accountId: 0, ticker: '', quantity: 1, purchaseDate: formatDateISO(new Date()), institution: '', currency: 'NOK', notes: '' });
    setOpen(true);
  };

  const handleEdit = (inv: Investment) => {
    setEditing(inv);
    setPurchasePrice(inv.purchasePrice);
    setCurrentPrice(inv.currentPrice);
    reset({ name: inv.name, type: inv.type, accountId: inv.accountId, ticker: inv.ticker ?? '', quantity: inv.quantity, purchaseDate: formatDateISO(inv.purchaseDate), institution: inv.institution, currency: inv.currency, notes: inv.notes });
    setOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    const payload = { ...data, purchasePrice, currentPrice, purchaseDate: new Date(data.purchaseDate) };
    if (editing?.id) await updateInvestment(editing.id, payload);
    else await createInvestment(payload);
    setOpen(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Investeringer</h1>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Ny investering
        </Button>
      </div>

      {stats.count > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 font-medium">Totalverdi</p>
              <p className="text-xl font-bold mt-1">{formatNOK(stats.totalValue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 font-medium">Gevinst/tap</p>
              <p className={`text-xl font-bold mt-1 ${stats.gainLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {stats.gainLoss >= 0 ? '+' : ''}{formatNOK(stats.gainLoss)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 font-medium">Avkastning</p>
              <p className={`text-xl font-bold mt-1 ${stats.gainLossPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {formatPercent(stats.gainLossPct)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {investments.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Ingen investeringer"
          description="Legg til aksjer, fond, krypto og andre investeringer for å spore porteføljens verdi."
          actionLabel="Legg til investering"
          onAction={handleAdd}
        />
      ) : (
        <div className="space-y-3">
          {investments.map(inv => {
            const totalValue = inv.currentPrice * inv.quantity;
            const totalCost = inv.purchasePrice * inv.quantity;
            const gain = totalValue - totalCost;
            const gainPct = totalCost > 0 ? (gain / totalCost) * 100 : 0;
            return (
              <Card key={inv.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                      {gain >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{inv.name}</p>
                        <Badge variant="secondary">{typeLabels[inv.type]}</Badge>
                        {inv.ticker && <span className="text-xs text-gray-400 font-mono">{inv.ticker}</span>}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {inv.quantity} enheter · Kjøpspris: {formatNOK(inv.purchasePrice)}/enhet
                      </p>
                      <p className={`text-xs font-medium mt-0.5 ${gain >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {gain >= 0 ? '+' : ''}{formatNOK(gain)} ({formatPercent(gainPct)})
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-lg">{formatNOK(totalValue)}</p>
                      <p className="text-xs text-gray-500">{formatNOK(inv.currentPrice)}/enhet</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(inv)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Slett investering</AlertDialogTitle>
                            <AlertDialogDescription>Slette "{inv.name}"?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction onClick={() => inv.id && deleteInvestment(inv.id)}>Slett</AlertDialogAction>
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
            <DialogTitle>{editing ? 'Rediger investering' : 'Ny investering'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Navn *</Label>
                <Input placeholder="f.eks. DNB Global Indeks" {...register('name')} />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select defaultValue={editing?.type ?? 'fund'} onValueChange={v => setValue('type', v as Investment['type'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ticker/Symbol</Label>
                <Input placeholder="f.eks. AAPL" {...register('ticker')} />
              </div>
              <div className="space-y-1.5">
                <Label>Antall enheter</Label>
                <Input type="number" step="any" {...register('quantity')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Kjøpspris per enhet</Label>
                <AmountInput value={purchasePrice} onChange={setPurchasePrice} />
              </div>
              <div className="space-y-1.5">
                <Label>Nåværende kurs</Label>
                <AmountInput value={currentPrice} onChange={setCurrentPrice} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Kjøpsdato</Label>
                <Input type="date" {...register('purchaseDate')} />
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
            </div>
            <div className="space-y-1.5">
              <Label>Institusjon</Label>
              <Input placeholder="f.eks. Nordnet, DNB" {...register('institution')} />
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
