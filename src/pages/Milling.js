import React, { useMemo, useState } from 'react';
import Masthead, { SectionHead } from '../components/Masthead';
import { useCollection } from '../hooks/useStore';
import { fmtQtl, fmtDate, todayISO } from '../data/constants';
import { IcPlus, IcMill } from '../components/Icons';

// Default milling ratios (%)
const DEFAULT_RATIOS = {
  rice:   55,
  broken: 12,
  rafi:   1.5,
  bran:   8,
  husk:   20,
};

export default function Milling() {
  const { items: milling, create } = useCollection('milling');
  const { items: purchases }       = useCollection('purchases');
  const { items: sales }           = useCollection('sales');
  const { items: additions }       = useCollection('stockAdditions');

  // Ratio editor (session only — not persisted)
  const [showRatios, setShowRatios] = useState(false);
  const [ratios, setRatios] = useState({ ...DEFAULT_RATIOS });

  const [form, setForm] = useState({
    date:      todayISO(),
    paddyQtl:  '',
    riceQtl:   '',
    brokenQtl: '',
    rafiQtl:   '',
    branQtl:   '',
    huskQtl:   '',
    notes:     '',
    autoMode:  true,
  });

  // When paddyQtl changes in auto mode, recalculate all outputs
  const handlePaddyChange = (val) => {
    const p = Number(val);
    if (form.autoMode && p > 0) {
      setForm(f => ({
        ...f,
        paddyQtl:  val,
        riceQtl:   ((p * ratios.rice)   / 100).toFixed(2),
        brokenQtl: ((p * ratios.broken) / 100).toFixed(2),
        rafiQtl:   ((p * ratios.rafi)   / 100).toFixed(2),
        branQtl:   ((p * ratios.bran)   / 100).toFixed(2),
        huskQtl:   ((p * ratios.husk)   / 100).toFixed(2),
      }));
    } else {
      setForm(f => ({ ...f, paddyQtl: val }));
    }
  };

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleAutoMode = () => setForm(f => ({ ...f, autoMode: !f.autoMode }));

  const yieldPct = useMemo(() => {
    const p = Number(form.paddyQtl);
    const r = Number(form.riceQtl);
    return p > 0 ? (r / p * 100) : 0;
  }, [form.paddyQtl, form.riceQtl]);

  const totalOut = useMemo(() =>
    Number(form.riceQtl||0) + Number(form.brokenQtl||0) +
    Number(form.rafiQtl||0) + Number(form.branQtl||0) + Number(form.huskQtl||0),
    [form]
  );

  const wastage = useMemo(() =>
    Number(form.paddyQtl||0) - totalOut,
    [form.paddyQtl, totalOut]
  );

  // Available paddy — includes all paddy product IDs from Task 6
  const availablePaddy = useMemo(() => {
    const bought   = purchases.reduce((s, p) => s + (Number(p.qtl) || 0), 0);
    const added    = additions
      .filter(a => ['paddy','paddy_sarna','paddy_mota','paddy_patla'].includes(a.product))
      .reduce((s, a) => s + (Number(a.qty) || 0), 0);
    const consumed = milling.reduce((s, m) => s + (Number(m.paddyQtl) || 0), 0);
    return Math.max(0, bought + added - consumed);
  }, [purchases, milling, additions]);

  const availableRice = useMemo(() => {
    const produced = milling.reduce((s, m) => s + (Number(m.riceQtl) || 0), 0);
    const added    = additions.filter(a => a.product === 'rice').reduce((s, a) => s + (Number(a.qty) || 0), 0);
    const soldRice = sales.filter(x => x.product === 'rice').reduce((sum, x) => {
      const q = Number(x.qty || 0);
      return sum + (x.unit === 'bag' ? q * 0.5 : q);
    }, 0);
    return Math.max(0, produced + added - soldRice);
  }, [milling, additions, sales]);

  const submit = (e) => {
    e?.preventDefault();
    if (!form.paddyQtl || !form.riceQtl) return alert('Enter at least paddy in and rice out');
    const paddyIn = Number(form.paddyQtl);
    if (paddyIn > availablePaddy) {
      const ok = window.confirm(
        `You're milling ${fmtQtl(paddyIn)} qtl paddy but only ${fmtQtl(availablePaddy)} qtl is available. Continue?`
      );
      if (!ok) return;
    }
    create({
      date:       form.date,
      paddyQtl:   Number(form.paddyQtl),
      riceQtl:    Number(form.riceQtl),
      brokenQtl:  Number(form.brokenQtl) || 0,
      rafiQtl:    Number(form.rafiQtl)   || 0,
      branQtl:    Number(form.branQtl)   || 0,
      huskQtl:    Number(form.huskQtl)   || 0,
      wastageQtl: Math.max(0, wastage),
      yieldPct:   Math.round(yieldPct * 10) / 10,
      notes:      form.notes,
    });
    setForm(f => ({
      ...f,
      paddyQtl:'', riceQtl:'', brokenQtl:'',
      rafiQtl:'', branQtl:'', huskQtl:'', notes:'',
    }));
  };

  const recent   = milling.slice(0, 10);
  const avgYield = recent.length ? recent.reduce((s, m) => s + (Number(m.yieldPct) || 0), 0) / recent.length : 0;
  const maxY     = recent.length ? Math.max(...recent.map(m => Number(m.yieldPct) || 0)) : 0;
  const minY     = recent.length ? Math.min(...recent.map(m => Number(m.yieldPct) || 0)) : 0;

  const paddyQtlNum = Number(form.paddyQtl) || 0;
  const ratioTotal  = Object.values(ratios).reduce((a, b) => a + b, 0);

  return (
    <div className="page-enter">
      <Masthead title="Milling" subtitle="Log batches — by-products auto-calculated" />

      {/* Stats */}
      <div className="grid grid-2 mb-5">
        <div className="stat">
          <div className="stat-label">Available Paddy</div>
          <div className="stat-value">{fmtQtl(availablePaddy)}<span className="unit"> qtl</span></div>
          <div className="stat-foot text-faint">Ready to mill · from purchases + manual adds − milled</div>
        </div>
        <div className="stat gold">
          <div className="stat-label">Available Rice</div>
          <div className="stat-value">{fmtQtl(availableRice)}<span className="unit"> qtl</span></div>
          <div className="stat-foot text-faint">Finished rice on hand</div>
        </div>
      </div>

      {/* ⚙ Ratio editor (collapsible, session-only) */}
      <div className="card tight mb-4" style={{ borderLeft: '3px solid var(--accent)' }}>
        <div className="row between" style={{ alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>⚙ Milling Ratios</div>
          <div className="row gap-3">
            <div className="segment">
              <button type="button" className={form.autoMode ? 'on' : ''} onClick={toggleAutoMode}>
                Auto-fill {form.autoMode ? 'ON' : 'OFF'}
              </button>
            </div>
            <button className="btn btn-soft" onClick={() => setShowRatios(s => !s)}>
              {showRatios ? 'Hide ratios' : 'Adjust ratios'}
            </button>
          </div>
        </div>
        {showRatios && (
          <div className="form-grid mt-3">
            {Object.entries(ratios).map(([key, val]) => (
              <div className="field span-2" key={key}>
                <label className="field-label" style={{ textTransform: 'capitalize' }}>{key} %</label>
                <input
                  className="input num"
                  type="number"
                  step="0.1"
                  value={val}
                  onChange={e => setRatios(r => ({ ...r, [key]: Number(e.target.value) }))}
                />
              </div>
            ))}
            <div className="field span-4" style={{ alignSelf: 'flex-end' }}>
              <div className="card tight" style={{ background: 'var(--surface-2)', fontSize: 12, padding: '8px 12px' }}>
                Total: <strong>{ratioTotal.toFixed(1)}%</strong>
                {' · '}Wastage: <strong style={{ color: 'var(--danger)' }}>
                  {(100 - ratioTotal).toFixed(1)}%
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <SectionHead label="New batch" meta="Paddy in → rice + by-products out" />

      <form className="card" onSubmit={submit}>
        <div className="form-grid">
          <div className="field span-3">
            <label className="field-label">Date</label>
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={e => setField('date', e.target.value)}
            />
          </div>

          <div className="field span-3">
            <label className="field-label">Paddy In (qtl)</label>
            <input
              className="input num"
              type="number"
              step="0.1"
              inputMode="decimal"
              placeholder="0.00"
              value={form.paddyQtl}
              onChange={e => handlePaddyChange(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field span-6">
            <div
              className="card tight"
              style={{
                background: yieldPct > 0 ? 'var(--accent-soft)' : 'var(--surface-2)',
                border: '1px solid var(--line)',
                padding: 16,
              }}
            >
              <div className="row between">
                <div>
                  <div className="text-soft" style={{ fontSize: 13 }}>Live yield</div>
                  <div
                    className="display-num"
                    style={{ fontSize: 28, color: yieldPct > 0 ? 'var(--accent-hover)' : 'var(--text)' }}
                  >
                    {yieldPct.toFixed(1)}
                    <span style={{ fontSize: 14, color: 'var(--text-soft)', fontWeight: 500, marginLeft: 2 }}>%</span>
                  </div>
                </div>
                <IcMill style={{ width: 32, height: 32, color: 'var(--accent)' }} />
              </div>
              <div className="text-faint" style={{ fontSize: 12, marginTop: 4 }}>
                Benchmark: 55% rice · 12% broken · 8% bran
              </div>
            </div>
          </div>
        </div>

        <hr className="rule mt-4 mb-4" />

        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
          By-products out (qtl)
          {form.autoMode && (
            <span className="badge paddy" style={{ marginLeft: 10, fontSize: 11 }}>
              Auto-calculated
            </span>
          )}
        </div>

        <div className="form-grid mt-3">
          {[
            { key: 'riceQtl',   label: 'Rice',              pct: ratios.rice   },
            { key: 'brokenQtl', label: 'Broken',            pct: ratios.broken },
            { key: 'rafiQtl',   label: 'Rafi (Fine Broken)',pct: ratios.rafi   },
            { key: 'branQtl',   label: 'Bran',              pct: ratios.bran   },
            { key: 'huskQtl',   label: 'Husk',              pct: ratios.husk   },
          ].map(({ key, label, pct }) => (
            <div className="field span-3" key={key}>
              <label className="field-label">
                {label}
                <span className="text-faint" style={{ fontSize: 11, marginLeft: 6 }}>({pct}%)</span>
              </label>
              <input
                className="input num"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form[key]}
                onChange={e => {
                  setForm(f => ({ ...f, autoMode: false, [key]: e.target.value }));
                }}
              />
              {paddyQtlNum > 0 && (
                <div className="text-faint" style={{ fontSize: 11, marginTop: 3 }}>
                  Auto: {((paddyQtlNum * pct) / 100).toFixed(2)} qtl
                </div>
              )}
            </div>
          ))}

          {/* Wastage indicator */}
          <div className="field span-3">
            <label className="field-label" style={{ color: 'var(--text-soft)' }}>Wastage (auto)</label>
            <div
              className="card tight"
              style={{
                background: wastage < -0.1 ? 'var(--danger-soft, #fff0f0)' : wastage > 0.01 ? 'var(--accent-soft)' : 'var(--surface-2)',
                border: `1px solid ${wastage < -0.1 ? 'var(--danger)' : 'var(--line)'}`,
                padding: '9px 12px',
                fontWeight: 700,
                fontSize: 15,
                color: wastage < -0.1 ? 'var(--danger)' : 'var(--text)',
              }}
            >
              {fmtQtl(wastage)} qtl
              {wastage < -0.1 && (
                <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--danger)', marginTop: 2 }}>
                  ⚠ Over-allocation
                </div>
              )}
            </div>
          </div>

          <div className="field span-12">
            <label className="field-label">Notes</label>
            <input
              className="input"
              placeholder="Lot, condition, machine, shift hours…"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
            />
          </div>
        </div>

        {/* Batch preview summary card */}
        {paddyQtlNum > 0 && (
          <div className="card tight mt-4" style={{ background: 'var(--surface-2)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Batch Summary Preview</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8 }}>
              {[
                { label: 'Paddy In', val: form.paddyQtl || 0 },
                { label: 'Rice',     val: form.riceQtl   || 0 },
                { label: 'Broken',   val: form.brokenQtl || 0 },
                { label: 'Rafi',     val: form.rafiQtl   || 0 },
                { label: 'Bran',     val: form.branQtl   || 0 },
                { label: 'Husk',     val: form.huskQtl   || 0 },
                { label: 'Wastage',  val: Math.max(0, wastage) },
              ].map(({ label, val }) => (
                <div key={label} style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--surface)', borderRadius: 6 }}>
                  <div className="text-faint" style={{ fontSize: 11 }}>{label}</div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: 15 }}>{fmtQtl(Number(val))}</div>
                  {paddyQtlNum > 0 && (
                    <div className="text-faint" style={{ fontSize: 10 }}>
                      {((Number(val) / paddyQtlNum) * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <hr className="rule mt-4" />
        <div className="row between mt-4 wrap">
          <div className="row gap-5 wrap">
            <div>
              <div className="text-soft" style={{ fontSize: 13 }}>Total out</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>{fmtQtl(totalOut)} qtl</div>
            </div>
            <div>
              <div className="text-soft" style={{ fontSize: 13 }}>Wastage</div>
              <div
                className="mono"
                style={{ fontSize: 18, fontWeight: 600, color: wastage < 0 ? 'var(--danger)' : 'var(--accent)' }}
              >
                {wastage >= 0 ? '+' : ''}{fmtQtl(wastage)} qtl
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            <IcPlus style={{ width: 16, height: 16 }} /> Log batch
          </button>
        </div>
      </form>

      {/* Yield trend */}
      <SectionHead label="Yield trend" meta="Last 10 batches" />
      <div className="grid grid-3">
        <div className="stat gold">
          <div className="stat-label">Avg yield</div>
          <div className="stat-value">{avgYield.toFixed(1)}<span className="unit">%</span></div>
          <div className="stat-foot text-faint">From {recent.length} batches</div>
        </div>
        <div className="stat">
          <div className="stat-label">Best</div>
          <div className="stat-value text-paddy">{maxY.toFixed(1)}<span className="unit">%</span></div>
          <div className="stat-foot text-faint">Top batch in window</div>
        </div>
        <div className="stat">
          <div className="stat-label">Worst</div>
          <div className="stat-value" style={{ color: 'var(--rust)' }}>{minY.toFixed(1)}<span className="unit">%</span></div>
          <div className="stat-foot text-faint">Floor of window</div>
        </div>
      </div>

      <div className="card mt-4">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Yield % across recent batches</div>
        {recent.length === 0 ? (
          <div className="empty">No batches yet. Add one above to see the trend.</div>
        ) : (
          <div className="bar-chart" style={{ height: 140 }}>
            {recent.slice().reverse().map(m => {
              const y = Number(m.yieldPct) || 0;
              const h = Math.max(6, (y / 70) * 100);
              return (
                <div key={m.id} className="bar-col">
                  <div
                    className="bar"
                    style={{ height: `${h}%`, width: '70%', margin: '0 auto' }}
                    title={`${y}% — ${m.date}`}
                  />
                  <div className="lbl">
                    {new Date(m.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Batch log */}
      <SectionHead label="Batch log" meta={`${milling.length} batches`} />
      <div className="card flush ledger-wrap">
        <table className="ledger">
          <thead>
            <tr>
              <th>Date</th><th>Paddy In</th><th>Rice</th><th>Broken</th>
              <th>Rafi</th><th>Bran</th><th>Husk</th><th>Wastage</th><th>Yield</th>
            </tr>
          </thead>
          <tbody>
            {milling.length === 0 && (
              <tr>
                <td colSpan={9} className="text-soft" style={{ textAlign:'center', padding:'var(--s-6)' }}>
                  No batches yet. Log your first above.
                </td>
              </tr>
            )}
            {milling.map(m => (
              <tr key={m.id}>
                <td>{fmtDate(m.date)}</td>
                <td className="num-cell">{fmtQtl(m.paddyQtl)} qtl</td>
                <td className="num-cell">{fmtQtl(m.riceQtl)}</td>
                <td className="num-cell">{fmtQtl(m.brokenQtl)}</td>
                <td className="num-cell">{fmtQtl(m.rafiQtl)}</td>
                <td className="num-cell">{fmtQtl(m.branQtl)}</td>
                <td className="num-cell">{fmtQtl(m.huskQtl)}</td>
                <td className="num-cell" style={{ color: 'var(--text-soft)' }}>
                  {fmtQtl(m.wastageQtl || 0)}
                </td>
                <td>
                  <span className={`badge ${Number(m.yieldPct) >= 55 ? 'paddy' : 'gold'}`}>
                    {Number(m.yieldPct).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
