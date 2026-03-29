import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import DashboardPage from './pages/Dashboard';
import TransactionsPage from './pages/Transactions';
import BudgetPage from './pages/Budget';
import BillsPage from './pages/Bills';
import SubscriptionsPage from './pages/Subscriptions';
import IncomePage from './pages/Income';
import InvestmentsPage from './pages/Investments';
import DebtPage from './pages/Debt';
import AccountsPage from './pages/Accounts';
import GoalsPage from './pages/Goals';
import ReportsPage from './pages/Reports';
import SettingsPage from './pages/Settings';
import { seedDatabase } from './db/seeds';

function App() {
  useEffect(() => {
    seedDatabase().catch(console.error);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/bills" element={<BillsPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/income" element={<IncomePage />} />
          <Route path="/investments" element={<InvestmentsPage />} />
          <Route path="/debt" element={<DebtPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
