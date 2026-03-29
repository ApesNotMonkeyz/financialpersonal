import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { db } from '../../db';
import { formatNOK, formatNOKCompact } from '../../utils/currency';
import { formatMonthShort } from '../../utils/dates';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#14b8a6'];

export default function ReportsPage() {
  const [from, setFrom] = useState(() => {
    const d = subMonths(new Date(), 5);
    return startOfMonth(d).toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => endOfMonth(new Date()).toISOString().split('T')[0]);

  const chartData = useLiveQuery(async () => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const transactions = await db.transactions
      .where('date').between(fromDate, toDate, true, true)
      .toArray();

    // Gruppér per måned
    const byMonth: Record<string, { income: number; expenses: number }> = {};
    for (const tx of transactions) {
      const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { income: 0, expenses: 0 };
      if (tx.type === 'income') byMonth[key].income += tx.amount;
      else if (tx.type === 'expense') byMonth[key].expenses += tx.amount;
    }

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => {
        const [y, m] = key.split('-').map(Number);
        return { month: formatMonthShort(y, m), income: val.income / 100, expenses: val.expenses / 100 };
      });
  }, [from, to]) ?? [];

  const categoryData = useLiveQuery(async () => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const transactions = await db.transactions
      .where('date').between(fromDate, toDate, true, true)
      .filter(t => t.type === 'expense')
      .toArray();

    const categories = await db.categories.toArray();
    const catMap = Object.fromEntries(categories.map(c => [c.id!, c]));

    const byCat: Record<number, number> = {};
    for (const tx of transactions) {
      byCat[tx.categoryId] = (byCat[tx.categoryId] ?? 0) + tx.amount;
    }

    return Object.entries(byCat)
      .map(([id, amount]) => ({
        name: catMap[Number(id)]?.name ?? 'Ukjent',
        value: amount / 100,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [from, to]) ?? [];

  const totalIncome = chartData.reduce((s, d) => s + d.income, 0);
  const totalExpenses = chartData.reduce((s, d) => s + d.expenses, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rapporter</h1>
        <Button variant="outline" onClick={() => window.print()}>Skriv ut / PDF</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-end gap-4">
            <div className="space-y-1.5">
              <Label>Fra</Label>
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1.5">
              <Label>Til</Label>
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40" />
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-gray-500">Totale inntekter</p>
                <p className="font-bold text-green-600 text-lg">{formatNOKCompact(totalIncome * 100)}</p>
              </div>
              <div>
                <p className="text-gray-500">Totale utgifter</p>
                <p className="font-bold text-red-500 text-lg">{formatNOKCompact(totalExpenses * 100)}</p>
              </div>
              <div>
                <p className="text-gray-500">Netto</p>
                <p className={`font-bold text-lg ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {formatNOKCompact((totalIncome - totalExpenses) * 100)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inntekter vs. utgifter per måned</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Ingen data i valgt periode</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => formatNOKCompact(v * 100)} tick={{ fontSize: 11 }} width={75} />
                <Tooltip formatter={(value) => formatNOK((value as number) * 100)} />
                <Legend />
                <Bar dataKey="income" name="Inntekter" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" name="Utgifter" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Utgifter per kategori</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Ingen data i valgt periode</p>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                    {categoryData.map((_entry: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNOK((value as number) * 100)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 min-w-[200px]">
                {categoryData.map((item: { name: string; value: number }, i: number) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="font-medium">{formatNOKCompact(item.value * 100)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
