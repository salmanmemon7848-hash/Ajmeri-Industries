import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Masthead, { SectionHead } from '../components/Masthead';
import { useCollection } from '../hooks/useStore';
import { fmtINR, fmtQtl, todayISO, BY_PRODUCTS, fmtDate } from '../data/constants';
import {
  IcBell, IcMill, IcCoin, IcGodown, IcArrowUp, IcArrowDown,
  IcSack, IcGrain, IcHardHat
} from '../components/Icons';

/* ─── helpers ───────────────────────────────────────── */
const inRange = (iso, range) => {
  if (!iso) return false;
  if (range === 'today') {
    return iso === todayISO();
  }
  if (range === 'week') {
    const d = new Date(iso);
    const now = new Date();
    const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 6);
    return d >= weekAgo && d <= now;
  }
  if (range === 'month') {
    return iso.startsWith(todayISO().slice(0, 7));
  }
  if (range === 'year') {
    return iso.startsWith(todayISO().slice(0, 4));
  }
  return true;
};

/* Yield arc (mini) */
function YieldArc({ pct = 66, size = 140 }) {
  const r = size * 0.4;
  const c = 2 * Math.PI * r;
  const filled = c * (pct / 100);
  const gradId = `arcGrad-${size}`;
  return (
    <div className="yield-arc" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--surface-3)" strokeWidth="12" fill="none"/>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--green)"/>
            <stop offset="55%" stopColor="var(--accent)"/>
            <stop offset="100%" stopColor="var(--info)"/>
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r}
          stroke={`url(#${gradId})`} strokeWidth="12" fill="none"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
          transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      <div className="value">
        <div className="pct">{pct ? pct.toFixed(1) : '0.0'}<span className="unit">%</span></div>
        <div className="label">Avg yield</div>
      </div>
    </div>
  );
}

/* Small chart bars */
function Sparkline({ values, color = 'var(--accent)', height = 36 }) {
  if (!values || values.length === 0) return <div style={{ height, color: 'var(--text-faint)', fontSize: 12 }}>No data</div>;
  const max = Math.max(1, ...values);
  const w = 100 / values.length;
  const gradId = `sparkGrad-${height}-${values.length}`;
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--info)"/>
          <stop offset="100%" stopColor={color}/>
        </linearGradient>
      </defs>
      {values.map((v, i) => {
        const h = (v / max) * (height - 4);
        return (
          <rect key={i}
            x={i * w + w * 0.15} y={height - h}
            width={w * 0.7} height={h}
            fill={`url(#${gradId})`} rx="1.5"
          />
        );
      })}
    </svg>
  );
}

/* Time-range toggle */
function RangeToggle({ value, onChange }) {
  return (
    <div className="segment">
      {['today','week','month','year'].map(r => (
        <button key={r}
          type="button"
          className={value === r ? 'on' : ''}
          onClick={() => onChange(r)}>
          {r.charAt(0).toUpperCase() + r.slice(1)}
        </button>
      ))}
    </div>
  );
}

function MiniMeterRow({ label, value, max = 1, meta, tone = 'accent' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="mini-meter-row">
      <div className="row between">
        <span>{label}</span>
        <strong className="mono">{value}</strong>
      </div>
      <div className="mini-meter-track">
        <span className={tone} style={{ width: `${Math.max(5, pct)}%` }} />
      </div>
      {meta && <div className="text-faint" style={{ fontSize: 11 }}>{meta}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   DASHBOARD
   ════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState('today');

  /* ─── collections ─────────────────────────────────── */
  const { items: sales }      = useCollection('sales');
  const { items: purchases }  = useCollection('purchases');
  const { items: milling }    = useCollection('milling');
  const { items: buyers }     = useCollection('buyers');
  const { items: cheques }    = useCollection('cheques');
  const { items: expenses }   = useCollection('expenses');
  const { items: workerPayments } = useCollection('workerPayments');
  const { items: godowns }    = useCollection('godowns');
  const { items: additions }  = useCollection('stockAdditions');
  const { items: machinery }  = useCollection('machinery');
  const { items: purchaseTracker } = useCollection('purchaseTracker');
  const { items: payments } = useCollection('payments');
  const { items: bagCuts } = useCollection('bagCuts');

  /* ═══ HERO 1: Today's snapshot ═════════════════════ */
  const todayOps = useMemo(() => {
    const paddyIn  = milling.filter(m => m.date === todayISO()).reduce((s, m) => s + (Number(m.paddyQtl) || 0), 0);
    const riceOut  = milling.filter(m => m.date === todayISO()).reduce((s, m) => s + (Number(m.riceQtl) || 0), 0);
    const cashIn   = sales.filter(s => s.date === todayISO()).reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const salesQtl = sales.filter(s => s.date === todayISO()).reduce((s, x) => {
      const q = Number(x.qty || 0);
      return s + (x.unit === 'qtl' ? q : q * 0.5);
    }, 0);
    return { paddyIn, riceOut, cashIn, salesQtl };
  }, [milling, sales]);

  /* ═══ HERO 2: This month revenue + profit ══════════ */
  const monthFinance = useMemo(() => {
    const ym = todayISO().slice(0, 7);
    const revenue = sales.filter(s => s.date.startsWith(ym)).reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const expense = expenses.filter(e => e.date.startsWith(ym)).reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const labour  = workerPayments.filter(w => (w.date || '').startsWith(ym)).reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const profit  = revenue - expense - labour;
    return { revenue, expense, labour, profit };
  }, [sales, expenses, workerPayments]);

  /* ═══ HERO 3: Stock value ═════════════════════════ */
  const stockValue = useMemo(() => {
    // Indicative rates (₹/qtl) for valuation — user can adjust later
    const RATES = { paddy: 2200, rice: 4200, broken: 2400, rafi: 2000, bran: 1500, husk: 600 };
    const addQty = (id) => additions.filter(a => a.product === id).reduce((s, a) => s + (Number(a.qty) || 0), 0);
    const produced = (id) => milling.reduce((s, m) => s + (Number(m[`${id}Qtl`]) || 0), 0);
    const sold = (id) => sales.filter(s => s.product === id).reduce((sum, s) => {
      const q = Number(s.qty || 0);
      return sum + (s.unit === 'qtl' ? q : q * 0.5);
    }, 0);

    const paddyStock  = Math.max(0, (purchases.reduce((s, p) => s + (Number(p.qtl) || 0), 0) + addQty('paddy')) - produced('paddy'));
    const products = BY_PRODUCTS.map(bp => {
      const qtl = Math.max(0, produced(bp.id) + addQty(bp.id) - sold(bp.id));
      const value = qtl * (RATES[bp.id] || 0);
      return { ...bp, qtl, value, rate: RATES[bp.id] || 0 };
    });
    const paddyValue = paddyStock * RATES.paddy;
    const total = paddyValue + products.reduce((s, p) => s + p.value, 0);
    return { paddyStock, paddyValue, products, total };
  }, [purchases, milling, sales, additions]);

  /* ═══ CASH FLOW ════════════════════════════════════ */
  const cashflow = useMemo(() => {
    const inRangeLocal = (iso) => inRange(iso, range);
    const inflow  = sales.filter(s => inRangeLocal(s.date)).reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const outflow =
      expenses.filter(e => inRangeLocal(e.date)).reduce((s, x) => s + (Number(x.amount) || 0), 0)
      + workerPayments.filter(w => inRangeLocal(w.date)).reduce((s, x) => s + (Number(x.amount) || 0), 0);
    return { inflow, outflow, net: inflow - outflow };
  }, [range, sales, expenses, workerPayments]);

  /* ═══ PURCHASES vs SALES — 7-day mini chart ════════ */
  const last7 = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const purchaseAmt = purchases.filter(p => p.date === iso).reduce((s, x) => s + (Number(x.amount) || 0), 0);
      const salesAmt    = sales.filter(s => s.date === iso).reduce((s, x) => s + (Number(x.amount) || 0), 0);
      const qtl = (items) => items.filter(x => x.date === iso).reduce((sum, x) => {
        const q = Number(x.qty || 0);
        return sum + (x.unit === 'qtl' ? q : q * 0.5);
      }, 0);
      days.push({
        iso,
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2),
        purchase: purchaseAmt,
        sales: salesAmt,
        purchaseQtl: qtl(purchases),
        salesQtl: qtl(sales),
      });
    }
    return days;
  }, [purchases, sales]);
  const chartMax = Math.max(1, ...last7.map(d => Math.max(d.purchase, d.sales)));

  /* ═══ GODOWN OVERVIEW ═════════════════════════════ */
  const godownOverview = useMemo(() => {
    // current stock = total purchased (all godowns get distributed by share)
    const totalPaddyIn = purchases.reduce((s, p) => s + (Number(p.qtl) || 0), 0)
      + additions.filter(a => a.product === 'paddy').reduce((s, a) => s + (Number(a.qty) || 0), 0);
    return godowns.map(g => {
      const paddyInThis = purchases.filter(p => p.godownId === g.id).reduce((s, p) => s + (Number(p.qtl) || 0), 0);
      const share = totalPaddyIn > 0 ? paddyInThis / totalPaddyIn : 0;
      const approxStock = totalPaddyIn * share;
      const cap = Number(g.capacityQtl ?? 0);
      const used = cap > 0 ? Math.min(100, (approxStock / cap) * 100) : 0;
      return { ...g, paddyInThis, approxStock, capacityQtl: cap, usedPct: used };
    });
  }, [godowns, purchases, additions]);

  /* ═══ Yield + Milling trend ═══════════════════════ */
  const recentMilling = milling.slice(0, 7);
  const avgYield = recentMilling.length ? recentMilling.reduce((s, m) => s + (Number(m.yieldPct) || 0), 0) / recentMilling.length : 0;
  const bestYield = recentMilling.length ? Math.max(...recentMilling.map(m => Number(m.yieldPct) || 0)) : 0;

  const controlTower = useMemo(() => {
    const stageLabels = {
      estimate: 'Estimate',
      lifting: 'Lifting',
      gate_in: 'Gate In',
      completed: 'Completed',
    };
    const stages = ['estimate', 'lifting', 'gate_in', 'completed'].map(id => ({
      id,
      label: stageLabels[id],
      count: purchaseTracker.filter(r => r.stage === id).length,
      qtl: purchaseTracker
        .filter(r => r.stage === id)
        .reduce((sum, r) => sum + Number(r.actualQtl || r.estimatedQtl || 0), 0),
    }));
    const maxStageCount = Math.max(1, ...stages.map(s => s.count));
    const completedValue = purchaseTracker
      .filter(r => r.stage === 'completed')
      .reduce((sum, r) => {
        const qtl = Number(r.actualQtl || r.estimatedQtl || 0);
        const rate = Number(r.actualRate || r.estimatedRate || 0);
        return sum + (qtl * rate);
      }, 0);
    const supplierPaid = payments
      .filter(p => ['supplier', 'farmer'].includes(p.partyKind) || p.kind === 'supplier_payment')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const supplierDue = Math.max(0, completedValue - supplierPaid);
    const todayBagCuts = bagCuts.filter(row => row.date === todayISO()).length;
    const netBags = bagCuts.reduce((sum, row) => sum + (Number(row.netBags) || 0), 0);
    const cutLossQtl = bagCuts.reduce((sum, row) => sum + (Number(row.lossQtl) || 0), 0);
    const dispatchBags = bagCuts
      .filter(row => row.operation === 'dispatch')
      .reduce((sum, row) => sum + (Number(row.netBags) || 0), 0);
    const yieldValues = recentMilling.slice().reverse().map(m => Number(m.yieldPct) || 0);
    return {
      stages,
      maxStageCount,
      completedValue,
      supplierPaid,
      supplierDue,
      todayBagCuts,
      netBags,
      cutLossQtl,
      dispatchBags,
      yieldValues,
    };
  }, [purchaseTracker, payments, bagCuts, recentMilling]);

  /* ═══ Alerts ═══════════════════════════════════════ */
  const pendingCheques = cheques.filter(c => c.status === 'pending');
  const lowStockCount  = stockValue.products.filter(p => p.qtl < 5).length;
  const earliestCheque = pendingCheques
    .filter(c => c.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
  const machineryAlerts = machinery.filter(m => {
    if (m.status === 'stopped' || m.status === 'service_due') return true;
    if (!m.amcEnd) return false;
    const days = Math.ceil((new Date(m.amcEnd) - new Date(todayISO())) / 86400000);
    return days <= 30;
  });

  /* ─── top buyers (recent sales) ──────────────────── */
  const topBuyers = useMemo(() => {
    const byBuyer = {};
    sales.forEach(s => {
      if (!s.buyerId) return;
      byBuyer[s.buyerId] = (byBuyer[s.buyerId] || 0) + (Number(s.amount) || 0);
    });
    return Object.entries(byBuyer)
      .map(([id, amt]) => ({ id, amt, name: buyers.find(b => b.id === id)?.name || 'Unknown' }))
      .sort((a, b) => b.amt - a.amt)
      .slice(0, 5);
  }, [sales, buyers]);

  /* ═══ Render ═══════════════════════════════════════ */
  return (
    <div className="page-enter">
      <Masthead
        title="Dashboard"
        subtitle={`${fmtDate(todayISO())} - your mill at a glance`}
        right={<RangeToggle value={range} onChange={setRange} />}
      />

      {/* ═══ HERO TRIO ═══════════════════════════════ */}
      <div className="grid grid-3 mb-5">
        {/* Hero 1 — Today's snapshot */}
        <div className="stat snapshot-hero" style={{ minHeight: 170 }}>
          <div className="stat-label">Today's Snapshot</div>
          <div className="stat-value">
            {fmtQtl(todayOps.riceOut)}<span className="unit">qtl</span>
          </div>
          <div className="stat-foot" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="row gap-3" style={{ fontSize: 12.5, alignItems: 'center' }}>
              <IcArrowDown style={{ width: 14, height: 14, color: 'var(--accent)' }} />
              <span>Paddy in:</span>
              <strong className="mono">{fmtQtl(todayOps.paddyIn)} qtl</strong>
            </div>
            <div className="row gap-3" style={{ fontSize: 12.5, alignItems: 'center' }}>
              <IcArrowUp style={{ width: 14, height: 14, color: 'var(--green)' }} />
              <span>Sales:</span>
              <strong className="mono">{fmtINR(todayOps.cashIn, { short: true })}</strong>
            </div>
          </div>
        </div>

        {/* Hero 2 — This month revenue & profit */}
        <div className="stat gold" style={{ minHeight: 170 }}>
          <span className="stat-corner">This month</span>
          <div className="stat-label">Revenue &amp; profit</div>
          <div className="stat-value">
            {fmtINR(monthFinance.revenue, { short: true })}
          </div>
          <div className="stat-foot" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="row between" style={{ fontSize: 12 }}>
              <span className="text-soft">Profit</span>
              <span className="mono" style={{ fontWeight: 700, color: monthFinance.profit >= 0 ? 'var(--accent)' : 'var(--rust)' }}>
                {fmtINR(monthFinance.profit, { short: true })}
              </span>
            </div>
            <div className="row between" style={{ fontSize: 12 }}>
              <span className="text-soft">Expenses</span>
              <span className="mono">{fmtINR(monthFinance.expense, { short: true })}</span>
            </div>
            <div className="row between" style={{ fontSize: 12 }}>
              <span className="text-soft">Labour</span>
              <span className="mono">{fmtINR(monthFinance.labour, { short: true })}</span>
            </div>
          </div>
        </div>

        {/* Hero 3 — Stock value */}
        <div className="stat" style={{ minHeight: 170 }}>
          <span className="stat-corner">Live</span>
          <div className="stat-label">Stock value (₹)</div>
          <div className="stat-value">
            {fmtINR(stockValue.total, { short: true })}
          </div>
          <div className="stat-foot" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="row between" style={{ fontSize: 12 }}>
              <span className="text-soft">Paddy</span>
              <span className="mono">{fmtINR(stockValue.paddyValue, { short: true })}</span>
            </div>
            <div className="row between" style={{ fontSize: 12 }}>
              <span className="text-soft">Rice + by-products</span>
              <span className="mono">{fmtINR(stockValue.products.reduce((s, p) => s + p.value, 0), { short: true })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ STOCK BREAKDOWN ══════════════════════════ */}
      <SectionHead label="Operations control tower" meta="Procurement, bags, payables, yield" />
      <div className="ops-control-grid mb-5">
        <div className="card">
          <div className="row between mb-3">
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Procurement pipeline</div>
              <div className="text-faint" style={{ fontSize: 12 }}>Lot stages from purchase tracker</div>
            </div>
            <span className="badge paddy">{purchaseTracker.length} lots</span>
          </div>
          {controlTower.stages.map(stage => (
            <MiniMeterRow
              key={stage.id}
              label={stage.label}
              value={stage.count}
              max={controlTower.maxStageCount}
              meta={`${fmtQtl(stage.qtl, 1)} qtl in this stage`}
              tone={stage.id === 'completed' ? 'green' : stage.id === 'gate_in' ? 'gold' : 'accent'}
            />
          ))}
        </div>

        <div className="card">
          <div className="row between mb-3">
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Supplier payables</div>
              <div className="text-faint" style={{ fontSize: 12 }}>Estimated from completed purchase lots</div>
            </div>
            <IcCoin style={{ width: 22, height: 22, color: 'var(--accent)' }} />
          </div>
          <div className="display-num" style={{ fontSize: 30, color: controlTower.supplierDue > 0 ? 'var(--rust)' : 'var(--accent)' }}>
            {fmtINR(controlTower.supplierDue, { short: true })}
          </div>
          <div className="summary-strip mt-3">
            <div className="ss-item">
              <span className="ss-label">Completed value</span>
              <span className="ss-value">{fmtINR(controlTower.completedValue, { short: true })}</span>
            </div>
            <div className="ss-item">
              <span className="ss-label">Paid</span>
              <span className="ss-value">{fmtINR(controlTower.supplierPaid, { short: true })}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="row between mb-3">
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Bag cut health</div>
              <div className="text-faint" style={{ fontSize: 12 }}>Lot continuity and packing visibility</div>
            </div>
            <span className="badge gold">{controlTower.todayBagCuts} today</span>
          </div>
          <div className="trace-kpi-row">
            <div><span>Net bags</span><strong>{controlTower.netBags}</strong></div>
            <div><span>Dispatch</span><strong>{controlTower.dispatchBags}</strong></div>
            <div><span>Cut loss</span><strong>{fmtQtl(controlTower.cutLossQtl, 1)} qtl</strong></div>
          </div>
          <div className="text-faint mt-3" style={{ fontSize: 12 }}>
            Use Bag Cut & Lots to connect procurement lots to milling, packing, and dispatch.
          </div>
        </div>

        <div className="card">
          <div className="row between mb-3">
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Yield pulse</div>
              <div className="text-faint" style={{ fontSize: 12 }}>Recent batch trend</div>
            </div>
            <span className={`badge ${avgYield >= 55 ? 'paddy' : 'rust'}`}>{avgYield.toFixed(1)}%</span>
          </div>
          <Sparkline values={controlTower.yieldValues.length ? controlTower.yieldValues : [0]} height={54} />
          <div className="row between mt-3" style={{ fontSize: 12 }}>
            <span className="text-soft">Best batch</span>
            <strong className="mono">{bestYield ? bestYield.toFixed(1) : '0.0'}%</strong>
          </div>
        </div>
      </div>

      <SectionHead label="Stock breakdown" meta="Live qty + value" />
      <div className="card mb-5">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--s-4)' }}>
          <div className="stock-tile" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)' }}>
            <div className="tile-label">Paddy</div>
            <div className="tile-qty">{fmtQtl(stockValue.paddyStock, 1)} <span>qtl</span></div>
            <div className="tile-val">{fmtINR(stockValue.paddyValue, { short: true })}</div>
          </div>
          {stockValue.products.map(p => (
            <div className="stock-tile" key={p.id}>
              <div className="tile-label">{p.name}</div>
              <div className="tile-qty">{fmtQtl(p.qtl, 1)} <span>qtl</span></div>
              <div className="tile-val">{fmtINR(p.value, { short: true })} <span className="text-faint" style={{ fontSize: 11, fontWeight: 400 }}>- Rs {p.rate}/qtl</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ CASH FLOW + PURCHASES vs SALES ══════════ */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1.4fr', gap: 'var(--s-4)' }}>
        {/* Cash flow */}
        <div>
          <SectionHead label="Cash flow" meta={range.toUpperCase()} />
          <div className="card">
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--s-3)' }}>
              <div>
                <div className="text-faint" style={{ fontSize: 12 }}>Cash in</div>
                <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
                  <IcArrowUp style={{ width: 14, height: 14, verticalAlign: -1 }} /> {fmtINR(cashflow.inflow, { short: true })}
                </div>
              </div>
              <div>
                <div className="text-faint" style={{ fontSize: 12 }}>Cash out</div>
                <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--rust)' }}>
                  <IcArrowDown style={{ width: 14, height: 14, verticalAlign: -1 }} /> {fmtINR(cashflow.outflow, { short: true })}
                </div>
              </div>
              <div>
                <div className="text-faint" style={{ fontSize: 12 }}>Net</div>
                <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: cashflow.net >= 0 ? 'var(--accent)' : 'var(--rust)' }}>
                  {fmtINR(cashflow.net, { short: true })}
                </div>
              </div>
            </div>
            <hr className="rule my-3" />
            <div className="text-soft" style={{ fontSize: 12, marginBottom: 4 }}>
              Cash out = <strong>expenses</strong> + <strong>labour payments</strong>
            </div>
            <div className="text-faint" style={{ fontSize: 11 }}>
              Tip: record every expense and worker payout to see real net.
            </div>
          </div>
        </div>

        {/* Purchases vs sales */}
        <div>
          <SectionHead label="Purchases vs Sales" meta="Last 7 days" />
          <div className="card">
            {last7.every(d => d.purchase === 0 && d.sales === 0) ? (
              <div className="empty">No purchase / sale data yet. Log a sale to see this fill in.</div>
            ) : (
              <>
                <div className="row gap-4 mb-3" style={{ fontSize: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, background: 'var(--text-faint)', borderRadius: 2 }} /> Purchases
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, background: 'var(--accent)', borderRadius: 2 }} /> Sales
                  </span>
                </div>
                <div className="bar-chart" style={{ height: 160 }}>
                  {last7.map(d => (
                    <div key={d.iso} className="bar-col">
                      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 140 }}>
                        <div className="bar" style={{
                          height: `${(d.purchase / chartMax) * 100}%`,
                          width: '45%', background: 'var(--text-faint)', borderRadius: 2,
                        }} title={`Purchase ${fmtINR(d.purchase, { short: true })}`}/>
                        <div className="bar alt" style={{
                          height: `${(d.sales / chartMax) * 100}%`,
                          width: '45%', background: 'var(--accent)', borderRadius: 2,
                        }} title={`Sales ${fmtINR(d.sales, { short: true })}`}/>
                      </div>
                      <div className="lbl">{d.label}</div>
                    </div>
                  ))}
                </div>
                <hr className="rule mt-3" />
                <div className="row gap-5 mt-3" style={{ fontSize: 13 }}>
                  <div><span className="text-soft">Week purchases</span> <span className="mono" style={{ marginLeft: 6, fontWeight: 600 }}>{fmtINR(last7.reduce((s, d) => s + d.purchase, 0), { short: true })}</span></div>
                  <div><span className="text-soft">Week sales</span> <span className="mono" style={{ marginLeft: 6, fontWeight: 600 }}>{fmtINR(last7.reduce((s, d) => s + d.sales, 0), { short: true })}</span></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ GODOWN OVERVIEW ══════════════════════════ */}
      <SectionHead label="Godown overview" meta="Capacity used" />
      <div className="grid grid-3 mb-5">
        {godownOverview.length === 0 && (
          <div className="card"><div className="empty">No godowns yet. Add some on the Godown page.</div></div>
        )}
        {godownOverview.map(g => (
          <div className="card tight" key={g.id}>
            <div className="row between mb-2">
              <div className="row gap-2">
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'var(--accent-soft)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <IcGodown style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{g.name}</div>
                  <div className="text-faint" style={{ fontSize: 11 }}>Paddy in: {fmtQtl(g.paddyInThis, 1)} qtl</div>
                </div>
              </div>
              {g.capacityQtl > 0 && (
                <span className={`badge ${g.usedPct > 90 ? 'rust' : g.usedPct > 75 ? 'gold' : 'paddy'}`}>
                  {g.usedPct.toFixed(0)}%
                </span>
              )}
            </div>
            {g.capacityQtl > 0 ? (
              <>
                <div className="row between" style={{ fontSize: 12, marginBottom: 4 }}>
                  <span className="text-soft">Stock</span>
                  <span className="mono">{fmtQtl(g.approxStock, 1)} / {fmtQtl(g.capacityQtl, 0)} qtl</span>
                </div>
                <div style={{ background: 'var(--surface-2)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${g.usedPct}%`,
                    background: g.usedPct > 90 ? 'var(--rust)' : g.usedPct > 75 ? 'var(--husk)' : 'var(--accent)',
                    borderRadius: 6, transition: 'width 0.4s ease',
                  }} />
                </div>
              </>
            ) : (
              <div className="text-faint" style={{ fontSize: 12, fontStyle: 'italic' }}>No capacity set - go to Godown page</div>
            )}
          </div>
        ))}
      </div>

      {/* ═══ YIELD + TOP BUYERS + ALERTS ══════════════ */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1.3fr 1fr', gap: 'var(--s-4)' }}>
        {/* Yield card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600, alignSelf: 'flex-start' }}>Milling yield</div>
          <YieldArc pct={avgYield} size={150} />
          <div className="row gap-5" style={{ fontSize: 12, color: 'var(--text-soft)' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="text-faint" style={{ fontSize: 11 }}>Best</div>
              <div className="mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>{bestYield ? bestYield.toFixed(1) : '-'}%</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="text-faint" style={{ fontSize: 11 }}>Batches</div>
              <div className="mono" style={{ fontWeight: 600 }}>{recentMilling.length}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="text-faint" style={{ fontSize: 11 }}>Target</div>
              <div className="mono" style={{ fontWeight: 600 }}>67%</div>
            </div>
          </div>
        </div>

        {/* Top buyers */}
        <div>
          <SectionHead label="Top buyers" meta="By revenue" />
          <div className="card">
            {topBuyers.length === 0 ? (
              <div className="empty">No sales recorded yet.</div>
            ) : (
              <ul className="dot-list">
                {topBuyers.map((b, i) => (
                  <li key={b.id}>
                    <div>
                      <div className="name">#{i + 1} {b.name}</div>
                      <div className="meta">Total billed</div>
                    </div>
                    <div className="amt in">{fmtINR(b.amt, { short: true })}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div>
          <SectionHead label="Alerts" meta="Stay on top" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
            <div className="card tight" style={{ borderLeft: '3px solid var(--rust)' }}>
              <div className="row between">
                <span className="small-caps">Cheques due</span>
                <IcBell style={{ width: 18, height: 18, color: 'var(--rust)' }} />
              </div>
              <div className="display-num" style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>{pendingCheques.length}</div>
              <div className="text-faint" style={{ fontSize: 11 }}>
                Earliest: {earliestCheque?.dueDate ? fmtDate(earliestCheque.dueDate) : '-'}
              </div>
            </div>
            <div className="card tight" style={{ borderLeft: '3px solid var(--husk-deep)' }}>
              <div className="row between">
                <span className="small-caps">Low stock</span>
                <IcMill style={{ width: 18, height: 18, color: 'var(--husk-deep)' }} />
              </div>
              <div className="display-num" style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>{lowStockCount}</div>
              <div className="text-faint" style={{ fontSize: 11 }}>Products below 5 qtl</div>
            </div>
            <div className="card tight" style={{ borderLeft: '3px solid var(--info)' }}>
              <div className="row between">
                <span className="small-caps">Machine alerts</span>
                <IcHardHat style={{ width: 18, height: 18, color: 'var(--info)' }} />
              </div>
              <div className="display-num" style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>{machineryAlerts.length}</div>
              <div className="text-faint" style={{ fontSize: 11 }}>AMC due, service due or stopped</div>
            </div>
            <div className="card tight" style={{ borderLeft: '3px solid var(--accent)' }}>
              <div className="row between">
                <span className="small-caps">Net cash</span>
                <IcCoin style={{ width: 18, height: 18, color: 'var(--accent)' }} />
              </div>
              <div className="display-num" style={{ fontSize: 32, fontWeight: 700, color: cashflow.net >= 0 ? 'var(--accent)' : 'var(--rust)', marginTop: 4 }}>
                {fmtINR(cashflow.net, { short: true })}
              </div>
              <div className="text-faint" style={{ fontSize: 11 }}>{range} in − out</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ QUICK ENTRY ══════════════════════════════ */}
      <SectionHead label="Quick Entry" meta="Tap to open" />
      <div className="grid grid-4">
        <button className="quick-nav-card" onClick={() => navigate('/milling')}>
          <div className="qnc-icon"><IcMill style={{ width: 20, height: 20 }} /></div>
          <div className="qnc-title">Log Milling Batch</div>
          <div className="qnc-sub">Paddy in, rice and by-products out</div>
        </button>
        <button className="quick-nav-card" onClick={() => navigate('/sales')}>
          <div className="qnc-icon"><IcCoin style={{ width: 20, height: 20 }} /></div>
          <div className="qnc-title">Record a Sale</div>
          <div className="qnc-sub">Bags or quintals to any buyer</div>
        </button>
        <button className="quick-nav-card" onClick={() => navigate('/stock')}>
          <div className="qnc-icon"><IcSack style={{ width: 20, height: 20 }} /></div>
          <div className="qnc-title">Add Stock</div>
          <div className="qnc-sub">Quick paddy / rice addition</div>
        </button>
        <button className="quick-nav-card" onClick={() => navigate('/expenses')}>
          <div className="qnc-icon"><IcGrain style={{ width: 20, height: 20 }} /></div>
          <div className="qnc-title">Log Expense</div>
          <div className="qnc-sub">Diesel, electricity, labour &amp; more</div>
        </button>
      </div>
    </div>
  );
}
