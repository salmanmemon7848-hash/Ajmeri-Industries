import React, { useMemo, useRef, useState } from 'react';
import Masthead, { SectionHead } from '../components/Masthead';
import { useCollection } from '../hooks/useStore';
import { EXPENSE_CATEGORIES, fmtINR, fmtQtl, fmtDate, todayISO } from '../data/constants';
import { IcDownload } from '../components/Icons';
import { generateSlipPDF } from '../lib/pdf';

/* ─── helpers ─────────────────────────────────────── */
const firstDayOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function triggerCSVDownload(csvStr, filename) {
  const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toCSV(headers, rows) {
  const escape = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
}

const REPORT_TYPES = [
  { id: 'overview',       label: 'Overview Report' },
  { id: 'daily_sale',     label: 'Daily Sale Report' },
  { id: 'monthly_stock',  label: 'Monthly Stock Report' },
  { id: 'outstanding',    label: 'Outstanding Analysis' },
  { id: 'purchase_sum',   label: 'Purchase Summary' },
  { id: 'damage_report',  label: 'Damage Report' },
  { id: 'milling_eff',    label: 'Milling Efficiency Report' },
];

/* ════════════════════════════════════════════════════
   REPORTS PAGE
════════════════════════════════════════════════════ */
export default function Reports() {
  /* ─── existing collections ───────────────────────── */
  const { items: purchases }      = useCollection('purchases');
  const { items: sales }          = useCollection('sales');
  const { items: milling }        = useCollection('milling');
  const { items: expenses }       = useCollection('expenses');
  const { items: workers }        = useCollection('workers');
  const { items: workerPayments } = useCollection('workerPayments');

  /* ─── new collections ────────────────────────────── */
  const { items: buyers }        = useCollection('buyers');
  const { items: payments }      = useCollection('payments');
  const { items: damageRecords } = useCollection('damageRecords');
  const { items: hrrRecords }    = useCollection('hrrTracking');

  /* ─── shared date range (overview) ──────────────── */
  const [from, setFrom] = useState(firstDayOfMonth());
  const [to,   setTo]   = useState(todayISO());

  /* ─── report type selector ───────────────────────── */
  const [reportType, setReportType] = useState('overview');

  /* ─── per-report filter state ────────────────────── */
  const [dailyDate,       setDailyDate]       = useState(todayISO());
  const [monthlyStockMon, setMonthlyStockMon] = useState(currentMonth());
  const [purchaseSumMon,  setPurchaseSumMon]  = useState(currentMonth());
  const [damageMon,       setDamageMon]       = useState(currentMonth());
  const [millingMon,      setMillingMon]       = useState(currentMonth());

  const reportRef = useRef(null);

  /* ═══════════════════════════════════════════════════
     ── OVERVIEW (original) ──
  ═══════════════════════════════════════════════════ */
  const filteredPurchases = useMemo(() => purchases.filter(p => p.date >= from && p.date <= to), [purchases, from, to]);
  const filteredSales     = useMemo(() => sales.filter(s => s.date >= from && s.date <= to),     [sales, from, to]);
  const filteredMilling   = useMemo(() => milling.filter(m => m.date >= from && m.date <= to),   [milling, from, to]);
  const filteredExpenses  = useMemo(() => expenses.filter(e => e.date >= from && e.date <= to),  [expenses, from, to]);
  const filteredWP        = useMemo(() => workerPayments.filter(p => p.date >= from && p.date <= to), [workerPayments, from, to]);

  const totalPurchase = filteredPurchases.reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalSales    = filteredSales.reduce((s, x) => s + Number(x.amount || 0), 0);
  const totalPaddyIn  = filteredPurchases.reduce((s, p) => s + Number(p.qtl || 0), 0);
  const totalRiceOut  = filteredMilling.reduce((s, m) => s + Number(m.riceQtl || 0), 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalWages    = filteredWP.reduce((s, p) => s + Number(p.amount || 0), 0);
  const netProfit     = totalSales - totalPurchase - totalExpenses - totalWages;

  const avgYield = filteredMilling.length
    ? filteredMilling.reduce((s, m) => s + (Number(m.yieldPct) || 0), 0) / filteredMilling.length
    : 0;

  const expenseByCategory = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: filteredExpenses.filter(e => e.category === cat.id).reduce((s, e) => s + Number(e.amount || 0), 0),
  }));

  const workerSummary = workers.map(w => {
    const wPay   = filteredWP.filter(p => p.workerId === w.id);
    const advances = wPay.filter(p => p.kind === 'advance').reduce((s, p) => s + Number(p.amount || 0), 0);
    const salary   = wPay.filter(p => p.kind === 'salary').reduce((s, p)  => s + Number(p.amount || 0), 0);
    return { ...w, advances, salary, total: advances + salary };
  }).filter(w => w.total > 0);

  const monthly = useMemo(() => {
    const map = new Map();
    const get = (iso) => {
      const d = new Date(iso);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map.has(k)) map.set(k, { k, pur: 0, sal: 0, paddyQtl: 0, riceQtl: 0, exp: 0 });
      return map.get(k);
    };
    filteredPurchases.forEach(p => { const m = get(p.date); m.pur += Number(p.amount) || 0; m.paddyQtl += Number(p.qtl) || 0; });
    filteredSales.forEach(s => { const m = get(s.date); m.sal += Number(s.amount) || 0; });
    filteredMilling.forEach(b => { const m = get(b.date); m.riceQtl += Number(b.riceQtl) || 0; });
    filteredExpenses.forEach(e => { const m = get(e.date); m.exp += Number(e.amount) || 0; });
    return Array.from(map.values()).sort((a, b) => a.k.localeCompare(b.k));
  }, [filteredPurchases, filteredSales, filteredMilling, filteredExpenses]);

  /* ═══════════════════════════════════════════════════
     ── DAILY SALE ──
  ═══════════════════════════════════════════════════ */
  const dailySales = useMemo(() =>
    sales.filter(s => s.date === dailyDate),
    [sales, dailyDate]
  );
  const dailyTotalQty    = dailySales.reduce((s, x) => s + (x.unit === 'bag' ? Number(x.qty || 0) * 0.5 : Number(x.qty || 0)), 0);
  const dailyTotalAmount = dailySales.reduce((s, x) => s + Number(x.amount || 0), 0);

  /* ═══════════════════════════════════════════════════
     ── MONTHLY STOCK ──
  ═══════════════════════════════════════════════════ */
  const stockForMonth = useMemo(() => {
    const monthEnd = monthlyStockMon + '-31';
    const purch = purchases.filter(p => p.date <= monthEnd);
    const mill  = milling.filter(m => m.date <= monthEnd);
    const sls   = sales.filter(s => s.date <= monthEnd);
    const sold  = (pid) => sls.filter(s => s.product === pid)
      .reduce((sm, s) => sm + (s.unit === 'bag' ? Number(s.qty || 0) * 0.5 : Number(s.qty || 0)), 0);
    const paddyPurch  = purch.reduce((s, p) => s + (Number(p.qtl) || 0), 0);
    const paddyMilled = mill.reduce((s, m)  => s + (Number(m.paddyQtl) || 0), 0);
    return [
      { label: 'Paddy',        qtl: Math.max(0, paddyPurch - paddyMilled) },
      { label: 'Rice',         qtl: Math.max(0, mill.reduce((s, m) => s + (Number(m.riceQtl)   || 0), 0) - sold('rice'))   },
      { label: 'Broken Rice',  qtl: Math.max(0, mill.reduce((s, m) => s + (Number(m.brokenQtl) || 0), 0) - sold('broken')) },
      { label: 'Rafi',         qtl: Math.max(0, mill.reduce((s, m) => s + (Number(m.rafiQtl)   || 0), 0) - sold('rafi'))   },
      { label: 'Rice Bran',    qtl: Math.max(0, mill.reduce((s, m) => s + (Number(m.branQtl)   || 0), 0) - sold('bran'))   },
      { label: 'Husk',         qtl: Math.max(0, mill.reduce((s, m) => s + (Number(m.huskQtl)   || 0), 0) - sold('husk'))   },
    ];
  }, [purchases, milling, sales, monthlyStockMon]);

  /* ═══════════════════════════════════════════════════
     ── OUTSTANDING ANALYSIS ──
  ═══════════════════════════════════════════════════ */
  const outstandingRows = useMemo(() => {
    const buyerMap = {};
    buyers.forEach(b => {
      buyerMap[b.id] = { name: b.name, totalSales: 0, totalPaid: 0 };
    });
    // Also pick up buyers referenced in sales but not in buyers collection
    sales.forEach(s => {
      const key = s.buyerId || s.buyerName || 'Unknown';
      if (!buyerMap[key]) buyerMap[key] = { name: s.buyerName || s.buyerId || 'Unknown', totalSales: 0, totalPaid: 0 };
      buyerMap[key].totalSales += Number(s.amount || 0);
    });
    payments.forEach(p => {
      if (p.kind === 'receipt' || p.type === 'receipt') {
        const key = p.buyerId || p.partyId;
        if (buyerMap[key]) buyerMap[key].totalPaid += Number(p.amount || 0);
      }
    });
    return Object.entries(buyerMap)
      .map(([id, v]) => ({ id, ...v, outstanding: v.totalSales - v.totalPaid }))
      .filter(r => r.totalSales > 0)
      .sort((a, b) => b.outstanding - a.outstanding);
  }, [buyers, sales, payments]);

  /* ═══════════════════════════════════════════════════
     ── PURCHASE SUMMARY ──
  ═══════════════════════════════════════════════════ */
  const purchaseSummaryRows = useMemo(() => {
    const farmerMap = {};
    purchases
      .filter(p => p.date && p.date.slice(0, 7) === purchaseSumMon)
      .forEach(p => {
        const name = p.farmerName || p.farmer || 'Unknown';
        if (!farmerMap[name]) farmerMap[name] = { name, totalQtl: 0, totalAmount: 0, count: 0, rates: [] };
        farmerMap[name].totalQtl    += Number(p.qtl || 0);
        farmerMap[name].totalAmount += Number(p.amount || 0);
        farmerMap[name].count++;
        if (p.rate) farmerMap[name].rates.push(Number(p.rate));
      });
    return Object.values(farmerMap).map(r => ({
      ...r,
      avgRate: r.rates.length ? r.rates.reduce((a, b) => a + b, 0) / r.rates.length : 0,
    }));
  }, [purchases, purchaseSumMon]);

  /* ═══════════════════════════════════════════════════
     ── DAMAGE REPORT ──
  ═══════════════════════════════════════════════════ */
  const damageRows = useMemo(() => {
    const monthDmg = damageRecords.filter(r => r.date && r.date.slice(0, 7) === damageMon);
    const totalQtl = monthDmg.reduce((s, r) => s + (Number(r.quantityQtl) || 0), 0);
    const typeMap  = {};
    monthDmg.forEach(r => {
      if (!typeMap[r.damageType]) typeMap[r.damageType] = 0;
      typeMap[r.damageType] += Number(r.quantityQtl) || 0;
    });
    return { rows: Object.entries(typeMap).map(([type, qty]) => ({ type, qty, pct: totalQtl > 0 ? (qty / totalQtl) * 100 : 0 })), totalQtl };
  }, [damageRecords, damageMon]);

  /* ═══════════════════════════════════════════════════
     ── MILLING EFFICIENCY ──
  ═══════════════════════════════════════════════════ */
  const millingEffRows = useMemo(() =>
    hrrRecords.filter(r => r.date && r.date.slice(0, 7) === millingMon),
    [hrrRecords, millingMon]
  );

  /* ─── PDF export ─────────────────────────────────── */
  const handleExport = async () => {
    if (!reportRef.current) return;
    await generateSlipPDF(reportRef.current, `Ajmeri-${reportType}-${todayISO()}.pdf`);
  };

  /* ─── CSV exports per report ─────────────────────── */
  const handleCSV = () => {
    let csv = '';
    let fname = `Ajmeri-${reportType}-${todayISO()}.csv`;
    switch (reportType) {
      case 'daily_sale':
        csv = toCSV(
          ['Date', 'Buyer', 'Product', 'Qty (qtl)', 'Rate', 'Amount', 'Broker'],
          dailySales.map(s => [s.date, s.buyerName || s.buyerId || '—', s.product, s.unit === 'bag' ? Number(s.qty) * 0.5 : s.qty, s.rate || '—', s.amount, s.broker || '—'])
        );
        break;
      case 'monthly_stock':
        csv = toCSV(
          ['Product', 'Stock (qtl)'],
          stockForMonth.map(r => [r.label, r.qtl.toFixed(2)])
        );
        break;
      case 'outstanding':
        csv = toCSV(
          ['Buyer', 'Total Sales', 'Total Paid', 'Outstanding'],
          outstandingRows.map(r => [r.name, r.totalSales, r.totalPaid, r.outstanding])
        );
        break;
      case 'purchase_sum':
        csv = toCSV(
          ['Farmer', 'Total Qtl', 'Avg Rate', 'Total Amount', 'Entries'],
          purchaseSummaryRows.map(r => [r.name, r.totalQtl, r.avgRate.toFixed(2), r.totalAmount, r.count])
        );
        break;
      case 'damage_report':
        csv = toCSV(
          ['Damage Type', 'Qty (qtl)', '% of Total'],
          damageRows.rows.map(r => [r.type, r.qty.toFixed(2), r.pct.toFixed(2)])
        );
        break;
      case 'milling_eff':
        csv = toCSV(
          ['Date', 'Paddy In', 'Head Rice', 'HRR %', 'Variance', 'Status'],
          millingEffRows.map(r => [r.date, r.paddyInput, r.headRiceOutput, (r.hrrPercent || 0).toFixed(2), (r.variance || 0).toFixed(2), Number(r.hrrPercent) >= 63 && Number(r.hrrPercent) <= 67 ? 'Good' : 'Off-target'])
        );
        break;
      default:
        csv = toCSV(
          ['Month', 'Paddy (qtl)', 'Rice (qtl)', 'Purchase', 'Sales', 'Expenses'],
          monthly.map(m => [m.k, m.paddyQtl.toFixed(2), m.riceQtl.toFixed(2), m.pur, m.sal, m.exp])
        );
    }
    triggerCSVDownload(csv, fname);
  };

  return (
    <div className="page-enter">
      <Masthead title="Reports" subtitle="Date-filtered insights and exports" />

      {/* Report type selector */}
      <div className="card tight mb-5">
        <div className="row between wrap" style={{ gap: 12 }}>
          <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 220 }}>
            <label className="field-label">Report Type</label>
            <select
              className="input select"
              value={reportType}
              onChange={e => setReportType(e.target.value)}
            >
              {REPORT_TYPES.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="row gap-3" style={{ alignSelf: 'flex-end' }}>
            <button className="btn btn-soft" onClick={handleExport}>
              <IcDownload style={{ width: 16, height: 16 }} /> PDF
            </button>
            <button className="btn btn-soft" onClick={handleCSV}>
              <IcDownload style={{ width: 16, height: 16 }} /> CSV
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          OVERVIEW (original)
      ══════════════════════════════════════════════ */}
      {reportType === 'overview' && (
        <>
          {/* Date range filter */}
          <div className="card tight mb-5">
            <div className="row gap-4 wrap" style={{ gap: 16 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">From</label>
                <input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 160 }} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">To</label>
                <input className="input" type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: 160 }} />
              </div>
            </div>
            <div className="text-faint mt-3" style={{ fontSize: 12 }}>Showing data from {from} to {to}</div>
          </div>

          <div ref={reportRef} style={{ background: '#fff' }}>
            <div className="grid grid-3">
              <div className="stat">
                <div className="stat-label">Purchase</div>
                <div className="stat-value">₹{fmtINR(totalPurchase, { short: true }).replace('₹', '')}</div>
                <div className="stat-foot">{filteredPurchases.length} entries · {fmtQtl(totalPaddyIn)} qtl paddy</div>
              </div>
              <div className="stat gold">
                <div className="stat-label">Sales</div>
                <div className="stat-value">₹{fmtINR(totalSales, { short: true }).replace('₹', '')}</div>
                <div className="stat-foot">{filteredSales.length} invoices · {fmtQtl(totalRiceOut)} qtl rice</div>
              </div>
              <div className="stat gold">
                <div className="stat-label">Net (excl. expenses)</div>
                <div className="stat-value" style={{ color: totalSales - totalPurchase >= 0 ? 'var(--husk)' : 'var(--rust-soft)' }}>
                  ₹{fmtINR(Math.abs(totalSales - totalPurchase), { short: true }).replace('₹', '')}
                </div>
                <div className="stat-foot">{totalSales - totalPurchase >= 0 ? 'Surplus' : 'Deficit'}</div>
              </div>
            </div>

            <div className="grid grid-3 mt-4">
              <div className="stat">
                <div className="stat-label">Expenses</div>
                <div className="stat-value" style={{ color: 'var(--rust)' }}>₹{fmtINR(totalExpenses, { short: true }).replace('₹', '')}</div>
                <div className="stat-foot">{filteredExpenses.length} entries</div>
              </div>
              <div className="stat">
                <div className="stat-label">Wages paid</div>
                <div className="stat-value" style={{ color: 'var(--rust)' }}>₹{fmtINR(totalWages, { short: true }).replace('₹', '')}</div>
                <div className="stat-foot">{filteredWP.length} payments</div>
              </div>
              <div className="stat" style={{ borderTop: `3px solid ${netProfit >= 0 ? 'var(--accent)' : 'var(--rust)'}` }}>
                <div className="stat-label">Net profit estimate</div>
                <div className="stat-value" style={{ color: netProfit >= 0 ? 'var(--accent)' : 'var(--rust)' }}>
                  ₹{fmtINR(Math.abs(netProfit), { short: true }).replace('₹', '')}
                </div>
                <div className="stat-foot">{netProfit >= 0 ? 'Profit' : 'Loss'} · after all costs</div>
              </div>
            </div>

            {filteredMilling.length > 0 && (
              <>
                <SectionHead label="Milling summary" meta={`${filteredMilling.length} batches`} />
                <div className="card tight">
                  <div className="row gap-5" style={{ fontSize: 14 }}>
                    <div><span className="text-soft">Batches</span> <span className="mono" style={{ marginLeft: 8, fontWeight: 600 }}>{filteredMilling.length}</span></div>
                    <div><span className="text-soft">Avg yield</span> <span className="mono" style={{ marginLeft: 8, fontWeight: 600 }}>{avgYield.toFixed(1)}%</span></div>
                    <div><span className="text-soft">Rice out</span> <span className="mono" style={{ marginLeft: 8, fontWeight: 600 }}>{fmtQtl(totalRiceOut)} qtl</span></div>
                  </div>
                </div>
              </>
            )}

            {filteredExpenses.length > 0 && (
              <>
                <SectionHead label="Expenses by category" />
                <div className="card">
                  {expenseByCategory.filter(c => c.total > 0).map(cat => (
                    <div className="stock-row" key={cat.id}>
                      <div className="lbl">{cat.name}</div>
                      <div className="meter">
                        <span style={{ width: `${Math.max(4, (cat.total / totalExpenses) * 100)}%` }} />
                      </div>
                      <div className="val">{fmtINR(cat.total)}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {workerSummary.length > 0 && (
              <>
                <SectionHead label="Worker salary report" />
                <div className="card flush ledger-wrap">
                  <table className="ledger">
                    <thead>
                      <tr><th>Worker</th><th>Daily rate</th><th>Advances</th><th>Salary paid</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                      {workerSummary.map(w => (
                        <tr key={w.id}>
                          <td style={{ fontWeight: 600 }}>{w.name}</td>
                          <td className="num-cell">{fmtINR(w.dailyRate)}/day</td>
                          <td className="num-cell">{fmtINR(w.advances)}</td>
                          <td className="num-cell">{fmtINR(w.salary)}</td>
                          <td className="num-cell" style={{ fontWeight: 700 }}>{fmtINR(w.total)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={4} style={{ fontWeight: 600, textAlign: 'right', borderTop: '1px solid var(--line)' }}>Total wages</td>
                        <td className="num-cell" style={{ fontWeight: 700, borderTop: '1px solid var(--line)' }}>{fmtINR(totalWages)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <SectionHead label="Month over month" meta="For selected range" />
            <div className="card flush ledger-wrap">
              <table className="ledger">
                <thead>
                  <tr><th>Month</th><th>Paddy (qtl)</th><th>Rice (qtl)</th><th>Purchase</th><th>Sales</th><th>Expenses</th></tr>
                </thead>
                <tbody>
                  {monthly.length === 0 && (
                    <tr><td colSpan={6} className="text-soft" style={{ textAlign: 'center', padding: 'var(--s-6)' }}>No data for selected range.</td></tr>
                  )}
                  {monthly.map(m => (
                    <tr key={m.k}>
                      <td style={{ fontWeight: 600 }}>{m.k}</td>
                      <td className="num-cell">{fmtQtl(m.paddyQtl)}</td>
                      <td className="num-cell">{fmtQtl(m.riceQtl)}</td>
                      <td className="num-cell">{fmtINR(m.pur)}</td>
                      <td className="num-cell" style={{ fontWeight: 700 }}>{fmtINR(m.sal)}</td>
                      <td className="num-cell" style={{ color: 'var(--rust)' }}>{fmtINR(m.exp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════
          DAILY SALE REPORT
      ══════════════════════════════════════════════ */}
      {reportType === 'daily_sale' && (
        <>
          <div className="card tight mb-4">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Select Date</label>
              <input className="input" type="date" value={dailyDate} onChange={e => setDailyDate(e.target.value)} style={{ width: 200 }} />
            </div>
          </div>
          <div ref={reportRef} style={{ background: '#fff' }}>
            <div className="grid grid-3 mb-4">
              <div className="stat gold">
                <div className="stat-label">Total Qty</div>
                <div className="stat-value">{fmtQtl(dailyTotalQty)}<span className="unit"> qtl</span></div>
                <div className="stat-foot">{dailySales.length} invoices</div>
              </div>
              <div className="stat">
                <div className="stat-label">Total Amount</div>
                <div className="stat-value">{fmtINR(dailyTotalAmount, { short: true })}</div>
                <div className="stat-foot">{dailyDate}</div>
              </div>
            </div>
            <SectionHead label="Sales for the day" meta={dailyDate} />
            <div className="card flush ledger-wrap">
              <table className="ledger">
                <thead>
                  <tr><th>Buyer</th><th>Product</th><th>Qty (qtl)</th><th>Rate</th><th>Amount</th><th>Broker</th></tr>
                </thead>
                <tbody>
                  {dailySales.length === 0 && (
                    <tr><td colSpan={6} className="text-soft" style={{ textAlign: 'center', padding: 'var(--s-6)' }}>No sales on {dailyDate}.</td></tr>
                  )}
                  {dailySales.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.buyerName || s.buyerId || '—'}</td>
                      <td>{s.product}</td>
                      <td className="num-cell">{s.unit === 'bag' ? fmtQtl(Number(s.qty) * 0.5) : fmtQtl(s.qty)}</td>
                      <td className="num-cell">{fmtINR(s.rate)}</td>
                      <td className="num-cell" style={{ fontWeight: 700 }}>{fmtINR(s.amount)}</td>
                      <td className="text-soft">{s.broker || '—'}</td>
                    </tr>
                  ))}
                  {dailySales.length > 0 && (
                    <tr style={{ borderTop: '2px solid var(--line)', fontWeight: 700 }}>
                      <td colSpan={2}>Totals</td>
                      <td className="num-cell">{fmtQtl(dailyTotalQty)}</td>
                      <td />
                      <td className="num-cell">{fmtINR(dailyTotalAmount)}</td>
                      <td />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════
          MONTHLY STOCK REPORT
      ══════════════════════════════════════════════ */}
      {reportType === 'monthly_stock' && (
        <>
          <div className="card tight mb-4">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Select Month</label>
              <input className="input" type="month" value={monthlyStockMon} onChange={e => setMonthlyStockMon(e.target.value)} style={{ width: 200 }} />
            </div>
          </div>
          <div ref={reportRef} style={{ background: '#fff' }}>
            <SectionHead label="Stock at month end" meta={monthlyStockMon} />
            <div className="card flush ledger-wrap">
              <table className="ledger">
                <thead>
                  <tr><th>Product</th><th>Stock (qtl)</th></tr>
                </thead>
                <tbody>
                  {stockForMonth.map(r => (
                    <tr key={r.label}>
                      <td style={{ fontWeight: 600 }}>{r.label}</td>
                      <td className="num-cell mono" style={{ fontWeight: 700 }}>{fmtQtl(r.qtl)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════
          OUTSTANDING ANALYSIS
      ══════════════════════════════════════════════ */}
      {reportType === 'outstanding' && (
        <>
          <div ref={reportRef} style={{ background: '#fff' }}>
            <SectionHead label="Outstanding by buyer" meta="Sorted by outstanding desc" />
            <div className="card flush ledger-wrap">
              <table className="ledger">
                <thead>
                  <tr><th>Buyer</th><th>Total Sales</th><th>Total Paid</th><th>Outstanding</th></tr>
                </thead>
                <tbody>
                  {outstandingRows.length === 0 && (
                    <tr><td colSpan={4} className="text-soft" style={{ textAlign: 'center', padding: 'var(--s-6)' }}>No data.</td></tr>
                  )}
                  {outstandingRows.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td className="num-cell">{fmtINR(r.totalSales)}</td>
                      <td className="num-cell">{fmtINR(r.totalPaid)}</td>
                      <td className="num-cell">
                        <span className={r.outstanding > 0 ? 'badge rust' : 'badge paddy'} style={{ fontWeight: 700 }}>
                          {fmtINR(r.outstanding)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════
          PURCHASE SUMMARY
      ══════════════════════════════════════════════ */}
      {reportType === 'purchase_sum' && (
        <>
          <div className="card tight mb-4">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Select Month</label>
              <input className="input" type="month" value={purchaseSumMon} onChange={e => setPurchaseSumMon(e.target.value)} style={{ width: 200 }} />
            </div>
          </div>
          <div ref={reportRef} style={{ background: '#fff' }}>
            <SectionHead label="Purchase by farmer" meta={purchaseSumMon} />
            <div className="card flush ledger-wrap">
              <table className="ledger">
                <thead>
                  <tr><th>Farmer</th><th>Total Qtl</th><th>Avg Rate (₹)</th><th>Total Amount</th><th>Entries</th></tr>
                </thead>
                <tbody>
                  {purchaseSummaryRows.length === 0 && (
                    <tr><td colSpan={5} className="text-soft" style={{ textAlign: 'center', padding: 'var(--s-6)' }}>No purchases for {purchaseSumMon}.</td></tr>
                  )}
                  {purchaseSummaryRows.map(r => (
                    <tr key={r.name}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td className="num-cell">{fmtQtl(r.totalQtl)}</td>
                      <td className="num-cell">{fmtINR(r.avgRate)}</td>
                      <td className="num-cell" style={{ fontWeight: 700 }}>{fmtINR(r.totalAmount)}</td>
                      <td className="num-cell">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════
          DAMAGE REPORT
      ══════════════════════════════════════════════ */}
      {reportType === 'damage_report' && (
        <>
          <div className="card tight mb-4">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Select Month</label>
              <input className="input" type="month" value={damageMon} onChange={e => setDamageMon(e.target.value)} style={{ width: 200 }} />
            </div>
          </div>
          <div ref={reportRef} style={{ background: '#fff' }}>
            <div className="grid grid-3 mb-4">
              <div className="stat">
                <div className="stat-label">Total Damaged</div>
                <div className="stat-value">{fmtQtl(damageRows.totalQtl)}<span className="unit"> qtl</span></div>
                <div className="stat-foot">{damageMon}</div>
              </div>
            </div>
            <SectionHead label="Damage by type" meta={damageMon} />
            <div className="card flush ledger-wrap">
              <table className="ledger">
                <thead>
                  <tr><th>Damage Type</th><th>Qty (qtl)</th><th>% of Total</th></tr>
                </thead>
                <tbody>
                  {damageRows.rows.length === 0 && (
                    <tr><td colSpan={3} className="text-soft" style={{ textAlign: 'center', padding: 'var(--s-6)' }}>No damage records for {damageMon}.</td></tr>
                  )}
                  {damageRows.rows.map(r => (
                    <tr key={r.type}>
                      <td style={{ fontWeight: 600 }}>{r.type}</td>
                      <td className="num-cell">{fmtQtl(r.qty)}</td>
                      <td className="num-cell">
                        <span className={r.pct > 4 ? 'badge rust' : r.pct >= 2 ? 'badge gold' : 'badge paddy'}>
                          {r.pct.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════
          MILLING EFFICIENCY REPORT
      ══════════════════════════════════════════════ */}
      {reportType === 'milling_eff' && (
        <>
          <div className="card tight mb-4">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Select Month</label>
              <input className="input" type="month" value={millingMon} onChange={e => setMillingMon(e.target.value)} style={{ width: 200 }} />
            </div>
          </div>
          <div ref={reportRef} style={{ background: '#fff' }}>
            <SectionHead label="Milling efficiency (HRR)" meta={`Target: 65% | Good: 63–67%`} />
            <div className="card flush ledger-wrap">
              <table className="ledger">
                <thead>
                  <tr><th>Date</th><th>Paddy In</th><th>Head Rice</th><th>HRR %</th><th>Variance</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {millingEffRows.length === 0 && (
                    <tr><td colSpan={6} className="text-soft" style={{ textAlign: 'center', padding: 'var(--s-6)' }}>No HRR data for {millingMon}.</td></tr>
                  )}
                  {millingEffRows.map(r => {
                    const hrr = Number(r.hrrPercent) || 0;
                    const variance = Number(r.variance) || 0;
                    const isGood = hrr >= 63 && hrr <= 67;
                    return (
                      <tr key={r.id}>
                        <td>{fmtDate(r.date)}</td>
                        <td className="num-cell">{fmtQtl(r.paddyInput)}</td>
                        <td className="num-cell">{fmtQtl(r.headRiceOutput)}</td>
                        <td className="num-cell mono" style={{ fontWeight: 700 }}>{hrr.toFixed(2)}%</td>
                        <td className="num-cell" style={{ color: variance >= 0 ? 'var(--accent)' : 'var(--rust)', fontWeight: 600 }}>
                          {variance >= 0 ? '+' : ''}{variance.toFixed(2)}%
                        </td>
                        <td>
                          <span className={isGood ? 'badge paddy' : 'badge rust'}>
                            {isGood ? 'Good' : 'Off-target'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
