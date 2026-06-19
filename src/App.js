import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Shell from './components/Shell';
import QuickAdd from './components/QuickAdd';
import { seedIfEmpty } from './lib/seed';

import Dashboard from './pages/Dashboard';
import Milling from './pages/Milling';
import Sales from './pages/Sales';
import Buyers from './pages/Buyers';
import Bardana from './pages/Bardana';
import Godown from './pages/Godown';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Workers from './pages/Workers';
import Expenses from './pages/Expenses';
import More from './pages/More';
import Stock from './pages/Stock';
import PurchaseTracker from './pages/PurchaseTracker';
import DamageTracker from './pages/DamageTracker';
import Hamali from './pages/Hamali';
import Transport from './pages/Transport';
import DO from './pages/DO';
import Machinery from './pages/Machinery';
import BagCut from './pages/BagCut';

export default function App() {
  const [quickOpen, setQuickOpen] = useState(false);
  useEffect(() => { seedIfEmpty(); }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <Shell onQuickAdd={() => setQuickOpen(true)}>
            <Routes>
              <Route index element={<Dashboard />} />
            </Routes>
          </Shell>
        } />
        <Route path="/dashboard" element={
          <Shell onQuickAdd={() => setQuickOpen(true)}>
            <Routes>
              <Route index element={<Dashboard />} />
            </Routes>
          </Shell>
        } />
        <Route path="/*" element={
          <Shell onQuickAdd={() => setQuickOpen(true)}>
            <Routes>
              <Route path="/milling"          element={<Milling />} />
              <Route path="/sales"            element={<Sales />} />
              <Route path="/customers"        element={<Buyers />} />
              <Route path="/bardana"          element={<Bardana />} />
              <Route path="/godown"           element={<Godown />} />
              <Route path="/payments"         element={<Payments />} />
              <Route path="/workers"          element={<Workers />} />
              <Route path="/expenses"         element={<Expenses />} />
              <Route path="/reports"          element={<Reports />} />
              <Route path="/more"             element={<More />} />
              <Route path="/stock"            element={<Stock />} />
              <Route path="/purchase-tracker" element={<PurchaseTracker />} />
              <Route path="/damage"           element={<DamageTracker />} />
              <Route path="/hamali"           element={<Hamali />} />
              <Route path="/transport"        element={<Transport />} />
              <Route path="/do"               element={<DO />} />
              <Route path="/machinery"        element={<Machinery />} />
              <Route path="/bag-cut"          element={<BagCut />} />
              <Route path="*"                 element={<Dashboard />} />
            </Routes>
          </Shell>
        } />
      </Routes>
      {quickOpen && <QuickAdd onClose={() => setQuickOpen(false)} />}
    </BrowserRouter>
  );
}
