import { useState } from 'react';
import { Plus, Wallet, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { AccountForm } from '../../components/forms/AccountForm';
import { EmptyState } from '../../components/shared/EmptyState';
import { useAccounts, createAccount, updateAccount, deleteAccount } from '../../hooks/useAccounts';
import { formatNOK } from '../../utils/currency';
import type { Account } from '../../db/schema';

const typeLabels: Record<string, string> = {
  checking: 'Brukskonto',
  savings: 'Sparekonto',
  cash: 'Kontanter',
  credit: 'Kredittkort',
  investment: 'Investeringskonto',
  loan: 'Lånekonto',
};

export default function AccountsPage() {
  const accounts = useAccounts();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [balance, setBalance] = useState(0);

  const totalBalance = accounts
    .filter(a => a.type !== 'credit' && a.type !== 'loan')
    .reduce((s, a) => s + a.balance, 0);

  const handleAdd = () => {
    setEditing(null);
    setBalance(0);
    setOpen(true);
  };

  const handleEdit = (account: Account) => {
    setEditing(account);
    setBalance(account.balance);
    setOpen(true);
  };

  const handleSubmit = async (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    const payload = { ...data, balance };
    if (editing?.id) {
      await updateAccount(editing.id, payload);
    } else {
      await createAccount(payload);
    }
    setOpen(false);
  };

  const handleDelete = async (id: number) => {
    await deleteAccount(id);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Kontoer</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total saldo: <span className="font-semibold text-gray-900 dark:text-gray-100">{formatNOK(totalBalance)}</span>
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Ny konto
        </Button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Ingen kontoer ennå"
          description="Legg til bankkontoer, sparekonto, kredittkort og andre kontoer for å komme i gang."
          actionLabel="Legg til konto"
          onAction={handleAdd}
        />
      ) : (
        <div className="space-y-3">
          {accounts.map(account => (
            <Card key={account.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: account.color + '20', color: account.color }}
                  >
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{account.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {typeLabels[account.type] ?? account.type}
                      </Badge>
                    </div>
                    {account.institution && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{account.institution}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-lg ${account.balance >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-500'}`}>
                      {formatNOK(account.balance)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
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
                          <AlertDialogTitle>Slett konto</AlertDialogTitle>
                          <AlertDialogDescription>
                            Er du sikker på at du vil slette "{account.name}"? Dette kan ikke angres.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction onClick={() => account.id && handleDelete(account.id)}>
                            Slett
                          </AlertDialogAction>
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
            <DialogTitle>{editing ? 'Rediger konto' : 'Ny konto'}</DialogTitle>
          </DialogHeader>
          <AccountForm
            initial={editing ?? undefined}
            balance={balance}
            onBalanceChange={setBalance}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
