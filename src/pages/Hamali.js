import React, { useMemo, useState } from 'react';
import Masthead, { SectionHead } from '../components/Masthead';
import { useCollection } from '../hooks/useStore';
import { HAMALI_TYPES, fmtINR, fmtQtl, fmtDate, todayISO } from '../data/constants';
import { IcPlus } from '../components/Icons';

const UNITS_HAMALI = [
  { id: 'bags', label: 'Bags' },
  { id: 'qtl',  label: 'Qtl' },
];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Hamali() {
  const { items: entries, create } = useCollection('hamaliEntries');
  const [tab, setTab]   = useState('log');
  const [month, setMonth] = useState(currentMonth());

  const [form, setForm] = useState({
    date:   todayISO(),
    type:   'samiti',
    party:  '',
    qty:    '',
    unit:   'bags',
    rate:   '',
    total:  '',
    status: 'paid',
    notes:  '',
  });
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-calc total when qty or rate changes
  const handleQtyOrRate = (k, v) => {
    const next = { ...form, [k]: v };
    const q = Number(k === 'qty'  ? v : next.qty)  || 0;
    const r = Number(k === 'rate' ? v : next.rate) || 0;
    setForm({ ...next, [k]: v, total: q && r ? (q * r).toFixed(2) : next.total });
  };

  const submit = (e) => {
    e?.preventDefault();
    if (!form.qty || !form.rate) return alert('Enter quantity and rate');
    create({
      date:   form.date,
      type:   form.type,
      party:  form.party,
      qty:    Number(form.qty),
      unit:   form.unit,
      rate:   Number(form.rate),
      total:  Number(form.total) || Number(form.qty) * Number(form.rate),
      status: form.status,
      notes:  form.notes,
    });
    setForm(f => ({ ...f, party: '', qty: '', rate: '', total: '', notes: '' }));
  };

  const monthEntries = useMemo(() =>
    entries.filter(e => e.date && e.date.startsWith(month)),
    [entries, month]
  );

  const stats = useMemo(() => {
    const sum   = (arr) => arr.reduce((s, e) => s + (Number(e.total) || 0), 0);
    const paid  = monthEntries.filter(e => e.status === 'paid');
    const pend  = monthEntries.filter(e => e.status === 'pending');
    return {
      totalPaid:     sum(paid),
      totalPending:  sum(pend),
      samitiPaid:    sum(paid.filter(e => e.type === 'samiti')),
      fciPaid:       sum(paid.filter(e => e.type === 'fci')),
      samitiPending: sum(pend.filter(e => e.type === 'samiti')),
      fciPending:    sum(pend.filter(e => e.type === 'fci')),
    };
  }, [monthEntries]);

  const typeName = (id) => HAMALI_TYPES.find(t => t.id === id)?.name || id;

  // Monthly summary by type
  const allEntries = entries;
  const monthlyByType = useMemo(() => {
    const me = allEntries.filter(e => e.date && e.date.startsWith(month));
    const samiti = me.filter(e => e.type === 'samiti').reduce((s, e) => s + (Number(e.total) || 0), 0);
    const fci    = me.filter(e => e.type === 'fci').reduce((s, e) => s + (Number(e.total) || 0), 0);
    const other  = me.filter(e => e.type === 'other').reduce((s, e) => s + (Number(e.total) || 0), 0);
    return { samiti, fci, other, grand: samiti + fci + other };
  }, [allEntries, month]);

  return (
    <div className="page-enter">
      <Masthead title="Hamali" subtitle="Labour expense tracker — Samiti & FCI" />

      {/* Tab bar */}
      <div className="segment mb-5">
        {[
          { id: 'log',     label: 'Log Hamali' },
          { id: 'expense', label: 'Expense Log' },
          { id: 'summary', label: 'Monthly Summary' },
        ].map(t => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: LOG ───────────────────────────────────── */}
      {tab === 'log' && (
        <>
          {/* Month summary stats */}
          <div className="grid grid-3 mb-5">
            <div className="stat">
              <div className="stat-label">Paid this month</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{fmtINR(stats.totalPaid, { short: true })}</div>
              <div className="stat-foot text-faint">
                Samiti {fmtINR(stats.samitiPaid, { short: true })} · FCI {fmtINR(stats.fciPaid, { short: true })}
              </div>
            </div>
            <div className="stat gold">
              <div className="stat-label">Pending this month</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{fmtINR(stats.totalPending, { short: true })}</div>
              <div className="stat-foot text-faint">
                Samiti {fmtINR(stats.samitiPending, { short: true })} · FCI {fmtINR(stats.fciPending, { short: true })}
              </div>
            </div>
            <div className="stat gold">
              <div className="stat-label">Month</div>
              <div style={{ marginTop: 8 }}>
                <input
                  className="input"
                  type="month"
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                />
              </div>
            </div>
          </div>

          <SectionHead label="Record hamali entry" />
          <form className="card" onSubmit={submit}>
            <div className="form-grid">
              <div className="field span-3">
                <label className="field-label">Date</label>
                <input className="input" type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
              </div>

              <div className="field span-6">
                <label className="field-label">Type</label>
                <div className="segment">
                  {HAMALI_TYPES.map(t => (
                    <button key={t.id} type="button" className={form.type === t.id ? 'on' : ''} onClick={() => setField('type', t.id)}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field span-3">
                <label className="field-label">Status</label>
                <div className="segment">
                  <button type="button" className={form.status === 'paid' ? 'on' : ''} onClick={() => setField('status', 'paid')}>Paid</button>
                  <button type="button" className={form.status === 'pending' ? 'on' : ''} onClick={() => setField('status', 'pending')}>Pending</button>
                </div>
              </div>

              <div className="field span-6">
                <label className="field-label">Party / Location</label>
                <input className="input" placeholder="Samiti name or FCI godown name" value={form.party} onChange={e => setField('party', e.target.value)} />
              </div>

              <div className="field span-3">
                <label className="field-label">Unit</label>
                <div className="segment">
                  {UNITS_HAMALI.map(u => (
                    <button key={u.id} type="button" className={form.unit === u.id ? 'on' : ''} onClick={() => setField('unit', u.id)}>
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field span-3">
                <label className="field-label">Quantity ({form.unit})</label>
                <input className="input num" type="number" step="0.1" placeholder="0" value={form.qty} onChange={e => handleQtyOrRate('qty', e.target.value)} />
              </div>

              <div className="field span-3">
                <label className="field-label">Rate (₹/{form.unit})</label>
                <input className="input num" type="number" step="0.5" placeholder="0" value={form.rate} onChange={e => handleQtyOrRate('rate', e.target.value)} />
              </div>

              <div className="field span-3">
                <label className="field-label">Total Amount (₹)</label>
                <input className="input num" type="number" step="1" placeholder="auto" value={form.total} onChange={e => setField('total', e.target.value)} />
              </div>

              <div className="field span-6">
                <label className="field-label">Notes</label>
                <input className="input" placeholder="Optional remarks" value={form.notes} onChange={e => setField('notes', e.target.value)} />
              </div>
            </div>
            <hr className="rule mt-4" />
            <div className="row between mt-3">
              <div className="text-soft" style={{ fontSize: 13 }}>
                Total: <strong className="mono">{form.total ? fmtINR(Number(form.total)) : '—'}</strong>
              </div>
              <button type="submit" className="btn btn-primary">
                <IcPlus style={{ width: 16, height: 16 }} /> Save Entry
              </button>
            </div>
          </form>
        </>
      )}

      {/* ─── TAB: EXPENSE LOG ────────────────────────────── */}
      {tab === 'expense' && (
        <>
          <div className="row between mb-4" style={{ alignItems: 'center' }}>
            <SectionHead label="All hamali entries" meta={`${entries.length} total`} />
            <div className="row gap-3">
              <input className="input" type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 160 }} />
            </div>
          </div>

          {monthEntries.length === 0 && (
            <div className="empty">No entries for this month.</div>
          )}

          <div className="card flush ledger-wrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Date</th><th>Type</th><th>Party</th>
                  <th>Qty</th><th>Rate</th><th>Total</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {monthEntries.length === 0 && (
                  <tr><td colSpan={7} className="text-soft" style={{ textAlign:'center', padding:'var(--s-6)' }}>No entries.</td></tr>
                )}
                {monthEntries.map(e => (
                  <tr key={e.id}>
                    <td>{fmtDate(e.date)}</td>
                    <td><span className="badge gold">{typeName(e.type)}</span></td>
                    <td>{e.party || <span className="text-faint">—</span>}</td>
                    <td className="num-cell">{fmtQtl(e.qty)} {e.unit}</td>
                    <td className="num-cell">₹{e.rate}</td>
                    <td className="num-cell" style={{ fontWeight: 700 }}>{fmtINR(e.total)}</td>
                    <td>
                      <span className={`badge ${e.status === 'paid' ? 'paddy' : 'rust'}`}>
                        {e.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── TAB: MONTHLY SUMMARY ────────────────────────── */}
      {tab === 'summary' && (
        <>
          <div className="row between mb-4" style={{ alignItems: 'center' }}>
            <SectionHead label="Monthly summary" />
            <input className="input" type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 160 }} />
          </div>

          <div className="grid grid-3 mb-5">
            <div className="stat">
              <div className="stat-label">Samiti Hamali</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{fmtINR(monthlyByType.samiti, { short: true })}</div>
              <div className="stat-foot text-faint">Paddy lifting labour</div>
            </div>
            <div className="stat gold">
              <div className="stat-label">FCI Hamali</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{fmtINR(monthlyByType.fci, { short: true })}</div>
              <div className="stat-foot text-faint">CMR delivery labour</div>
            </div>
            <div className="stat gold">
              <div className="stat-label">Other</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{fmtINR(monthlyByType.other, { short: true })}</div>
              <div className="stat-foot text-faint">Misc expenses</div>
            </div>
          </div>

          {/* Bar chart by type */}
          <SectionHead label="Breakdown" meta="By type" />
          <div className="card">
            {[
              { label: 'Samiti Hamali', val: monthlyByType.samiti },
              { label: 'FCI Hamali',    val: monthlyByType.fci },
              { label: 'Other',         val: monthlyByType.other },
            ].map(({ label, val }) => {
              const pct = monthlyByType.grand > 0 ? (val / monthlyByType.grand) * 100 : 0;
              return (
                <div className="stock-row" key={label}>
                  <div className="lbl">{label}</div>
                  <div className="meter"><span style={{ width: `${Math.max(4, pct)}%` }} /></div>
                  <div className="val">{fmtINR(val)}</div>
                </div>
              );
            })}
          </div>

          <div className="card tight mt-4" style={{ borderLeft: '3px solid var(--accent)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
              Grand Total: <span className="mono">{fmtINR(monthlyByType.grand)}</span>
            </div>
            <div className="text-soft" style={{ fontSize: 12 }}>
              <strong>GST Note:</strong> Hamali charges billed with transport attract <strong>5% RCM</strong>.
              Separate manpower supply bills are under forward charge.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
