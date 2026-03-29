import { useState } from 'react';
import { Plus, ArrowLeftRight, Search, Trash2, ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { TransactionForm } from '../../components/forms/TransactionForm';
import { EmptyState } from '../../components/shared/EmptyState';
import { useTransactionsByMonth, createTransaction, deleteTransaction } from '../../hooks/useTransactions';
import { useAccounts } from '../../hooks/useAccounts';
import { useCategories } from '../../hooks/useCategories';
import { useAppStore } from '../../stores/useAppStore';
import { formatNOK } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import type { Transaction } from '../../db/schema';

export default function TransactionsPage() {
  const { selectedYear, selectedMonth } = useAppStore();
  const transactions = useTransactionsByMonth(selectedYear, selectedMonth);
  const accounts = useAccounts();
  const categories = useCategories();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [search, setSearch] = useState('');

  const accountMap = Object.fromEntries(accounts.map(a => [a.id!, a]));
  const categoryMap = Object.fromEntries(categories.map(c => [c.id!, c]));

  const filtered = transactions.filter(tx =>
    !search || tx.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleAdd = () => {
    setAmount(0);
    setOpen(true);
  };

  const handleSubmit = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createTransaction(data);
    setOpen(false);
  };

  const handleDelete = async (id: number) => {
    await deleteTransaction(id);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transaksjoner</h1>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Ny transaksjon
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDown className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400 font-medium">Inntekter</span>
            </div>
            <p className="text-xl font-bold text-green-700 dark:text-green-400">{formatNOK(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUp className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">Utgifter</span>
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatNOK(totalExpenses)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Søk i transaksjoner..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Ingen transaksjoner"
          description="Ingen transaksjoner funnet for denne måneden. Legg til din første transaksjon."
          actionLabel="Legg til transaksjon"
          onAction={handleAdd}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(tx => {
            const account = accountMap[tx.accountId];
            const category = categoryMap[tx.categoryId];
            return (
              <Card key={tx.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-base"
                      style={{ backgroundColor: (category?.color ?? '#94a3b8') + '20' }}
                    >
                      {category?.icon ?? '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(tx.date)}</span>
                        {category && <Badge variant="secondary" className="text-xs py-0">{category.name}</Badge>}
                        {account && <span className="text-xs text-gray-400">{account.name}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-semibold ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatNOK(tx.amount)}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Slett transaksjon</AlertDialogTitle>
                          <AlertDialogDescription>
                            Slette "{tx.description}"? Kontosaldo vil bli reversert.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction onClick={() => tx.id && handleDelete(tx.id)}>Slett</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
            <DialogTitle>Ny transaksjon</DialogTitle>
          </DialogHeader>
          <TransactionForm
            amount={amount}
            onAmountChange={setAmount}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
