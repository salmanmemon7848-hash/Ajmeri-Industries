import React, { useState, useMemo } from 'react';
import Masthead, { SectionHead } from '../components/Masthead';
import { useCollection } from '../hooks/useStore';
import { fmtQtl, fmtDate, todayISO } from '../data/constants';
import { IcPlus } from '../components/Icons';

const PRODUCTS = ['paddy', 'rice', 'broken', 'bran', 'husk', 'rafi'];
const DAMAGE_TYPES = ['Moisture', 'Pest/Weevil', 'Fire', 'Flood', 'Theft', 'Handling', 'Other'];
const STATUS_OPTIONS = ['reported', 'pending', 'resolved'];

function damageBadge(pct) {
  if (pct < 2)  return { cls: 'badge paddy',  label: `${pct.toFixed(2)}% ✓ Low` };
  if (pct <= 4) return { cls: 'badge gold',   label: `${pct.toFixed(2)}% ⚠ Moderate` };
  return          { cls: 'badge rust',   label: `${pct.toFixed(2)}% ✗ High` };
}

function hrrBadge(hrr) {
  if (hrr >= 63 && hrr <= 67) return { cls: 'badge paddy', label: 'Good' };
  if (hrr >= 60 && hrr < 63)  return { cls: 'badge gold',  label: 'Low' };
  if (hrr > 67)                return { cls: 'badge gold',  label: 'High' };
  return                          { cls: 'badge rust',  label: 'Poor' };
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function DamageTracker() {
  const { items: damageRecords, create: createDamage } = useCollection('damageRecords');
  const { items: hrrRecords,    create: createHrr }    = useCollection('hrrTracking');
  const { items: milling }                              = useCollection('milling');
  const { items: godowns }                              = useCollection('godowns');

  const [tab, setTab] = useState('damage');

  // Damage form
  const [df, setDf] = useState({
    date: todayISO(), product: 'rice', damageType: 'Moisture',
    quantityQtl: '', totalQuantityQtl: '', cause: '',
    actionTaken: '', status: 'reported', godownId: '',
  });
  const setDField = (k, v) => setDf(f => ({ ...f, [k]: v }));

  const liveDamagePct = useMemo(() => {
    const q = Number(df.quantityQtl);
    const t = Number(df.totalQuantityQtl);
    return t > 0 ? (q / t) * 100 : 0;
  }, [df.quantityQtl, df.totalQuantityQtl]);

  const submitDamage = (e) => {
    e.preventDefault();
    if (!df.quantityQtl || !df.totalQuantityQtl) return alert('Enter quantity and total quantity');
    createDamage({
      date: df.date,
      product: df.product,
      damageType: df.damageType,
      quantityQtl: Number(df.quantityQtl),
      totalQuantityQtl: Number(df.totalQuantityQtl),
      damagePercent: liveDamagePct,
      godownId: df.godownId,
      cause: df.cause,
      actionTaken: df.actionTaken,
      status: df.status,
    });
    setDf(f => ({ ...f, quantityQtl: '', totalQuantityQtl: '', cause: '', actionTaken: '' }));
  };

  // HRR form
  const [hf, setHf] = useState({
    date: todayISO(), millingId: '', paddyInput: '', headRiceOutput: '', brokenRice: '',
  });
  const setHField = (k, v) => setHf(f => ({ ...f, [k]: v }));

  const liveHrr = useMemo(() => {
    const paddy = Number(hf.paddyInput);
    const head  = Number(hf.headRiceOutput);
    return paddy > 0 ? (head / paddy) * 100 : 0;
  }, [hf.paddyInput, hf.headRiceOutput]);

  const liveVariance = liveHrr - 65;

  const submitHrr = (e) => {
    e.preventDefault();
    if (!hf.paddyInput || !hf.headRiceOutput) return alert('Enter paddy input and head rice output');
    createHrr({
      date: hf.date,
      millingId: hf.millingId,
      paddyInput: Number(hf.paddyInput),
      headRiceOutput: Number(hf.headRiceOutput),
      brokenRice: Number(hf.brokenRice) || 0,
      hrrPercent: liveHrr,
      targetPercent: 65,
      variance: liveVariance,
    });
    setHf(f => ({ ...f, millingId: '', paddyInput: '', headRiceOutput: '', brokenRice: '' }));
  };

  // Monthly summary
  const [summaryMonth, setSummaryMonth] = useState(currentMonth());

  const monthDamage = useMemo(() =>
    damageRecords.filter(r => r.date && r.date.slice(0, 7) === summaryMonth),
    [damageRecords, summaryMonth]
  );
  const totalDamagedQtl = monthDamage.reduce((s, r) => s + (Number(r.quantityQtl) || 0), 0);
  const totalProductionQtl = milling
    .filter(m => m.date && m.date.slice(0, 7) === summaryMonth)
    .reduce((s, m) => s + (Number(m.riceQtl) || 0) + (Number(m.brokenQtl) || 0) + (Number(m.rafiQtl) || 0) + (Number(m.branQtl) || 0) + (Number(m.huskQtl) || 0), 0);
  const overallDamagePct = totalProductionQtl > 0 ? (totalDamagedQtl / totalProductionQtl) * 100 : 0;

  const damageByType = useMemo(() => {
    const map = {};
    DAMAGE_TYPES.forEach(t => { map[t] = 0; });
    monthDamage.forEach(r => {
      if (map[r.damageType] !== undefined) map[r.damageType] += Number(r.quantityQtl) || 0;
    });
    return Object.entries(map).filter(([, v]) => v > 0).map(([type, qty]) => ({ type, qty }));
  }, [monthDamage]);

  const maxBarQty = Math.max(1, ...damageByType.map(d => d.qty));

  return (
    <div className="page-enter">
      <Masthead title="Damage Tracker" subtitle="Log damage events and track Head Rice Recovery (HRR)" />

      {/* Tab bar */}
      <div className="segment mb-5">
        {['damage', 'hrr', 'summary'].map(t => (
          <button
            key={t}
            className={`seg-btn${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'damage' ? 'Log Damage' : t === 'hrr' ? 'HRR Tracking' : 'Monthly Summary'}
          </button>
        ))}
      </div>

      {/* ─── LOG DAMAGE ────────────────────────────────── */}
      {tab === 'damage' && (
        <>
          <SectionHead label="Log damage event" />
          <form className="card" onSubmit={submitDamage}>
            <div className="form-grid">
              <div className="field span-3">
                <label className="field-label">Date</label>
                <input className="input" type="date" value={df.date} onChange={e => setDField('date', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Product</label>
                <select className="input select" value={df.product} onChange={e => setDField('product', e.target.value)}>
                  {PRODUCTS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div className="field span-3">
                <label className="field-label">Damage Type</label>
                <select className="input select" value={df.damageType} onChange={e => setDField('damageType', e.target.value)}>
                  {DAMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="field span-3">
                <label className="field-label">Status</label>
                <select className="input select" value={df.status} onChange={e => setDField('status', e.target.value)}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="field span-3">
                <label className="field-label">Damaged Qty (qtl)</label>
                <input className="input num" type="number" step="0.01" placeholder="0.00" value={df.quantityQtl} onChange={e => setDField('quantityQtl', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Total Stock Qty (qtl)</label>
                <input className="input num" type="number" step="0.01" placeholder="0.00" value={df.totalQuantityQtl} onChange={e => setDField('totalQuantityQtl', e.target.value)} />
              </div>
              {/* Live damage % */}
              <div className="field span-6">
                <div className="card tight" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', padding: 14 }}>
                  <div className="row between">
                    <div>
                      <div className="text-soft" style={{ fontSize: 12 }}>Live Damage %</div>
                      <div className="display-num" style={{ fontSize: 26, fontWeight: 700 }}>
                        {liveDamagePct.toFixed(2)}<span style={{ fontSize: 13 }}>%</span>
                      </div>
                    </div>
                    <span className={damageBadge(liveDamagePct).cls}>{damageBadge(liveDamagePct).label}</span>
                  </div>
                </div>
              </div>
              <div className="field span-6">
                <label className="field-label">Godown</label>
                <select className="input select" value={df.godownId} onChange={e => setDField('godownId', e.target.value)}>
                  <option value="">— Select godown —</option>
                  {godowns.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="field span-6">
                <label className="field-label">Cause</label>
                <input className="input" placeholder="Describe the cause" value={df.cause} onChange={e => setDField('cause', e.target.value)} />
              </div>
              <div className="field span-6">
                <label className="field-label">Action Taken</label>
                <input className="input" placeholder="Steps taken to address" value={df.actionTaken} onChange={e => setDField('actionTaken', e.target.value)} />
              </div>
            </div>
            <div className="row between mt-4">
              <div />
              <button type="submit" className="btn btn-primary"><IcPlus style={{ width: 16, height: 16 }} /> Log Damage</button>
            </div>
          </form>

          <SectionHead label="Damage log" meta={`${damageRecords.length} records`} />
          <div className="card flush ledger-wrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Date</th><th>Product</th><th>Type</th><th>Qty (qtl)</th>
                  <th>Damage %</th><th>Cause</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {damageRecords.length === 0 && (
                  <tr><td colSpan={7} className="text-soft" style={{ textAlign: 'center', padding: 'var(--s-6)' }}>No damage records yet.</td></tr>
                )}
                {damageRecords.map(r => (
                  <tr key={r.id}>
                    <td>{fmtDate(r.date)}</td>
                    <td style={{ fontWeight: 600 }}>{r.product}</td>
                    <td>{r.damageType}</td>
                    <td className="num-cell">{fmtQtl(r.quantityQtl)}</td>
                    <td><span className={damageBadge(Number(r.damagePercent) || 0).cls}>{(Number(r.damagePercent) || 0).toFixed(2)}%</span></td>
                    <td className="text-soft">{r.cause || '—'}</td>
                    <td><span className={`badge ${r.status === 'resolved' ? 'paddy' : r.status === 'reported' ? 'gold' : ''}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── HRR TRACKING ──────────────────────────────── */}
      {tab === 'hrr' && (
        <>
          <SectionHead label="Log HRR entry" meta="Target: 65% | Good range: 63–67%" />
          <form className="card" onSubmit={submitHrr}>
            <div className="form-grid">
              <div className="field span-3">
                <label className="field-label">Date</label>
                <input className="input" type="date" value={hf.date} onChange={e => setHField('date', e.target.value)} />
              </div>
              <div className="field span-9">
                <label className="field-label">Milling Batch (optional)</label>
                <select className="input select" value={hf.millingId} onChange={e => setHField('millingId', e.target.value)}>
                  <option value="">— Select milling batch —</option>
                  {milling.map(m => (
                    <option key={m.id} value={m.id}>{fmtDate(m.date)} — {fmtQtl(m.paddyQtl)} qtl paddy</option>
                  ))}
                </select>
              </div>
              <div className="field span-4">
                <label className="field-label">Paddy Input (qtl)</label>
                <input className="input num" type="number" step="0.1" placeholder="0.00" value={hf.paddyInput} onChange={e => setHField('paddyInput', e.target.value)} />
              </div>
              <div className="field span-4">
                <label className="field-label">Head Rice Output (qtl)</label>
                <input className="input num" type="number" step="0.1" placeholder="0.00" value={hf.headRiceOutput} onChange={e => setHField('headRiceOutput', e.target.value)} />
              </div>
              <div className="field span-4">
                <label className="field-label">Broken Rice (qtl)</label>
                <input className="input num" type="number" step="0.1" placeholder="0.00" value={hf.brokenRice} onChange={e => setHField('brokenRice', e.target.value)} />
              </div>
            </div>

            {/* Live HRR stats */}
            <div className="grid grid-3 mt-4">
              <div className="stat">
                <div className="stat-label">Live HRR %</div>
                <div className="stat-value">{liveHrr.toFixed(2)}<span className="unit">%</span></div>
                <div className="stat-foot">{hrrBadge(liveHrr).label}</div>
              </div>
              <div className="stat gold">
                <div className="stat-label">Target</div>
                <div className="stat-value">65<span className="unit">%</span></div>
                <div className="stat-foot">Good: 63–67%</div>
              </div>
              <div className={`stat ${liveVariance >= 0 ? 'gold' : ''}`}>
                <div className="stat-label">Variance</div>
                <div className="stat-value" style={{ color: liveVariance >= 0 ? 'var(--accent)' : 'var(--rust)' }}>
                  {liveVariance >= 0 ? '+' : ''}{liveVariance.toFixed(2)}<span className="unit">%</span>
                </div>
                <div className="stat-foot">{liveVariance >= 0 ? 'Above target' : 'Below target'}</div>
              </div>
            </div>

            <div className="row between mt-4">
              <div />
              <button type="submit" className="btn btn-primary"><IcPlus style={{ width: 16, height: 16 }} /> Log HRR</button>
            </div>
          </form>

          <SectionHead label="HRR log" meta={`${hrrRecords.length} records`} />
          <div className="card flush ledger-wrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Date</th><th>Paddy In</th><th>Head Rice</th><th>Broken</th>
                  <th>HRR %</th><th>Variance</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {hrrRecords.length === 0 && (
                  <tr><td colSpan={7} className="text-soft" style={{ textAlign: 'center', padding: 'var(--s-6)' }}>No HRR records yet.</td></tr>
                )}
                {hrrRecords.map(r => {
                  const b = hrrBadge(Number(r.hrrPercent) || 0);
                  return (
                    <tr key={r.id}>
                      <td>{fmtDate(r.date)}</td>
                      <td className="num-cell">{fmtQtl(r.paddyInput)}</td>
                      <td className="num-cell">{fmtQtl(r.headRiceOutput)}</td>
                      <td className="num-cell">{fmtQtl(r.brokenRice)}</td>
                      <td className="num-cell mono">{(Number(r.hrrPercent) || 0).toFixed(2)}%</td>
                      <td className="num-cell" style={{ color: Number(r.variance) >= 0 ? 'var(--accent)' : 'var(--rust)', fontWeight: 600 }}>
                        {Number(r.variance) >= 0 ? '+' : ''}{(Number(r.variance) || 0).toFixed(2)}%
                      </td>
                      <td><span className={b.cls}>{b.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── MONTHLY SUMMARY ───────────────────────────── */}
      {tab === 'summary' && (
        <>
          <div className="card tight mb-4">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Select Month</label>
              <input className="input" type="month" value={summaryMonth} onChange={e => setSummaryMonth(e.target.value)} style={{ width: 200 }} />
            </div>
          </div>

          <div className="grid grid-3 mb-4">
            <div className="stat">
              <div className="stat-label">Total Damaged</div>
              <div className="stat-value">{fmtQtl(totalDamagedQtl)}<span className="unit"> qtl</span></div>
              <div className="stat-foot text-faint">{monthDamage.length} events</div>
            </div>
            <div className="stat gold">
              <div className="stat-label">Production</div>
              <div className="stat-value">{fmtQtl(totalProductionQtl)}<span className="unit"> qtl</span></div>
              <div className="stat-foot text-faint">Total output this month</div>
            </div>
            <div className="stat">
              <div className="stat-label">Damage % of Production</div>
              <div className="stat-value" style={{ color: overallDamagePct > 3 ? 'var(--rust)' : 'var(--accent)' }}>
                {overallDamagePct.toFixed(2)}<span className="unit">%</span>
              </div>
              <div className="stat-foot">
                <span className={overallDamagePct > 3 ? 'badge rust' : 'badge paddy'}>
                  {overallDamagePct > 3 ? 'Above Target' : 'Below Target'}
                </span>
              </div>
            </div>
          </div>

          <SectionHead label="Damage by type" meta="CSS bar chart" />
          <div className="card">
            {damageByType.length === 0 && (
              <div className="empty">No damage records for {summaryMonth}.</div>
            )}
            {damageByType.map(d => {
              const pct = (d.qty / maxBarQty) * 100;
              return (
                <div className="stock-row" key={d.type}>
                  <div className="lbl">{d.type}</div>
                  <div className="meter">
                    <span style={{ width: `${Math.max(4, pct)}%`, background: 'var(--rust-soft)' }} />
                  </div>
                  <div className="val">{fmtQtl(d.qty)} qtl</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
