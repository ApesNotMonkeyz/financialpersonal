import { useState } from 'react';
import { Plus, Repeat, CheckCircle, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { SubscriptionForm } from '../../components/forms/SubscriptionForm';
import { EmptyState } from '../../components/shared/EmptyState';
import { useSubscriptions, useSubscriptionStats, createSubscription, updateSubscription, deleteSubscription, markSubscriptionAsPaid } from '../../hooks/useSubscriptions';
import { useAccounts } from '../../hooks/useAccounts';
import { formatNOK } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import { toMonthlyCost, toAnnualCost } from '../../utils/calculations';
import type { Subscription } from '../../db/schema';

const statusLabels: Record<string, string> = {
  active: 'Aktiv', trial: 'Prøveperiode', paused: 'Pauset', cancelled: 'Avsluttet',
};
const statusVariant: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  active: 'success', trial: 'warning', paused: 'secondary', cancelled: 'destructive',
};

export default function SubscriptionsPage() {
  const subscriptions = useSubscriptions();
  const stats = useSubscriptionStats();
  const accounts = useAccounts();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [payingSub, setPayingSub] = useState<Subscription | null>(null);
  const [payAccountId, setPayAccountId] = useState('');

  const handleAdd = () => { setEditing(null); setOpen(true); };
  const handleEdit = (sub: Subscription) => { setEditing(sub); setOpen(true); };

  const handleSubmit = async (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editing?.id) await updateSubscription(editing.id, data);
    else await createSubscription(data);
    setOpen(false);
  };

  const handlePay = async () => {
    if (!payingSub?.id || !payAccountId) return;
    await markSubscriptionAsPaid(payingSub.id, parseInt(payAccountId));
    setPayingSub(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Abonnementer</h1>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Nytt abonnement
        </Button>
      </div>

      {stats.count > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Per måned</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatNOK(stats.monthlyTotal)}</p>
              <p className="text-xs text-blue-500 mt-1">{stats.count} aktive abonnementer</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Per år</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatNOK(stats.annualTotal)}</p>
              <p className="text-xs text-purple-500 mt-1">Totalt årsbeløp</p>
            </CardContent>
          </Card>
        </div>
      )}

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Ingen abonnementer"
          description="Legg til abonnementer som Netflix, Spotify og andre tjenester du betaler regelmessig."
          actionLabel="Legg til abonnement"
          onAction={handleAdd}
        />
      ) : (
        <div className="space-y-3">
          {subscriptions.map(sub => (
            <Card key={sub.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ backgroundColor: sub.color + '20', color: sub.color }}
                  >
                    {sub.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{sub.name}</p>
                      <Badge variant={statusVariant[sub.status] ?? 'secondary'}>
                        {statusLabels[sub.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {sub.billingCycle === 'monthly' ? 'Månedlig' : 'Årlig'} ·{' '}
                      Neste faktura: {formatDate(sub.nextBillingDate)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatNOK(toMonthlyCost(sub.amount, sub.billingCycle))}/mnd · {formatNOK(toAnnualCost(sub.amount, sub.billingCycle))}/år
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{formatNOK(sub.amount)}</p>
                    <p className="text-xs text-gray-500">{sub.billingCycle === 'monthly' ? '/mnd' : '/år'}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {sub.status === 'active' && (
                      <Button variant="ghost" size="icon" onClick={() => { setPayingSub(sub); setPayAccountId(''); }}>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(sub)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Slett abonnement</AlertDialogTitle>
                          <AlertDialogDescription>Slette "{sub.name}"?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction onClick={() => sub.id && deleteSubscription(sub.id)}>Slett</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger abonnement' : 'Nytt abonnement'}</DialogTitle>
          </DialogHeader>
          <SubscriptionForm
            initial={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!payingSub} onOpenChange={() => setPayingSub(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Betal: {payingSub?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Beløp: <span className="font-semibold">{payingSub ? formatNOK(payingSub.amount) : ''}</span>
            </p>
            <Select value={payAccountId} onValueChange={setPayAccountId}>
              <SelectTrigger><SelectValue placeholder="Velg trekkonto" /></SelectTrigger>
              <SelectContent>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPayingSub(null)}>Avbryt</Button>
              <Button onClick={handlePay} disabled={!payAccountId}>Bekreft</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
