import { useState } from 'react';
import { Plus, FileText, CheckCircle, Pencil, Trash2, AlertCircle, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { BillForm } from '../../components/forms/BillForm';
import { EmptyState } from '../../components/shared/EmptyState';
import { useBills, createBill, updateBill, deleteBill, markBillAsPaid } from '../../hooks/useBills';
import { useAccounts } from '../../hooks/useAccounts';
import { formatNOK } from '../../utils/currency';
import { formatDate, daysUntil, isOverdue } from '../../utils/dates';
import type { Bill } from '../../db/schema';

const frequencyLabels: Record<string, string> = {
  weekly: 'Ukentlig', monthly: 'Månedlig', quarterly: 'Kvartalsvis', yearly: 'Årlig', once: 'Engangs',
};

export default function BillsPage() {
  const bills = useBills();
  const accounts = useAccounts();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [amount, setAmount] = useState(0);
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [payAccountId, setPayAccountId] = useState<string>('');

  const activeBills = bills.filter(b => b.status === 'active');
  const totalMonthly = activeBills.reduce((s, b) => s + b.amount, 0);

  const handleAdd = () => { setEditing(null); setAmount(0); setOpen(true); };
  const handleEdit = (bill: Bill) => { setEditing(bill); setAmount(bill.amount); setOpen(true); };

  const handleSubmit = async (data: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => {
    const payload = { ...data, amount };
    if (editing?.id) await updateBill(editing.id, payload);
    else await createBill(payload);
    setOpen(false);
  };

  const handlePay = async () => {
    if (!payingBill?.id || !payAccountId) return;
    await markBillAsPaid(payingBill.id, parseInt(payAccountId));
    setPayingBill(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Regninger</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeBills.length} aktive · {formatNOK(totalMonthly)} per måned
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Ny regning
        </Button>
      </div>

      {bills.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Ingen regninger"
          description="Legg til faste regninger som husleie, strøm og forsikring for å holde oversikt over forfall."
          actionLabel="Legg til regning"
          onAction={handleAdd}
        />
      ) : (
        <div className="space-y-3">
          {bills.map(bill => {
            const days = daysUntil(bill.nextDueDate);
            const overdue = isOverdue(bill.nextDueDate);
            return (
              <Card key={bill.id} className={overdue && bill.status === 'active' ? 'border-red-300 dark:border-red-800' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: bill.color + '20', color: bill.color }}
                    >
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{bill.name}</p>
                        <Badge variant="secondary">{frequencyLabels[bill.frequency]}</Badge>
                        {bill.status !== 'active' && (
                          <Badge variant={bill.status === 'paused' ? 'warning' : 'secondary'}>
                            {bill.status === 'paused' ? 'Pauset' : 'Avsluttet'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-sm">
                        {overdue ? (
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        ) : days <= 7 ? (
                          <Clock className="h-3.5 w-3.5 text-yellow-500" />
                        ) : null}
                        <span className={overdue ? 'text-red-500' : days <= 7 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}>
                          {overdue ? `Forfalt ${formatDate(bill.nextDueDate)}` : `Forfall ${formatDate(bill.nextDueDate)}`}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{formatNOK(bill.amount)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {bill.status === 'active' && (
                        <Button variant="ghost" size="icon" onClick={() => { setPayingBill(bill); setPayAccountId(''); }} title="Marker som betalt">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(bill)}>
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
                            <AlertDialogTitle>Slett regning</AlertDialogTitle>
                            <AlertDialogDescription>Slette "{bill.name}"?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction onClick={() => bill.id && deleteBill(bill.id)}>Slett</AlertDialogAction>
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
            <DialogTitle>{editing ? 'Rediger regning' : 'Ny regning'}</DialogTitle>
          </DialogHeader>
          <BillForm
            initial={editing ?? undefined}
            amount={amount}
            onAmountChange={setAmount}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Betalingsdialog */}
      <Dialog open={!!payingBill} onOpenChange={() => setPayingBill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Betal regning: {payingBill?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Beløp: <span className="font-semibold">{payingBill ? formatNOK(payingBill.amount) : ''}</span>
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Trekkonto</label>
              <Select value={payAccountId} onValueChange={setPayAccountId}>
                <SelectTrigger><SelectValue placeholder="Velg konto" /></SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPayingBill(null)}>Avbryt</Button>
              <Button onClick={handlePay} disabled={!payAccountId}>Bekreft betaling</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
