import React, { useMemo, useState } from 'react';
import Masthead, { SectionHead } from '../components/Masthead';
import { useCollection } from '../hooks/useStore';
import { fmtDate, todayISO } from '../data/constants';
import { IcPlus, IcSack } from '../components/Icons';

const KINDS = [
  { id: 'new',      name: 'New bags in',  tone: 'paddy', sign: +1 },
  { id: 'old',      name: 'Old bags out', tone: 'gold',  sign: -1 },
  { id: 'returned', name: 'Returned',     tone: 'paddy', sign: +1 },
];

export default function Bardana() {
  const { items: bardana, create } = useCollection('bardana');
  const [form, setForm] = useState({ date: todayISO(), kind: 'new', qty: '', party: '', notes: '' });

  // Redirect notice at the top
  const notice = (
    <div
      className="card tight mb-5"
      style={{
        borderLeft: '3px solid var(--accent)',
        background: 'var(--accent-soft)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span className="qnc-icon"><IcSack style={{ width: 20, height: 20 }} /></span>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Bardana tracking has moved</div>
        <div className="text-soft" style={{ fontSize: 13 }}>
          Go to <strong>Stock, Bardana tab</strong> for the full bag inventory manager.
          This page is kept for legacy access.
        </div>
      </div>
    </div>
  );

  const submit = (e) => {
    e?.preventDefault();
    if (!form.qty) return;
    create({ ...form, qty: Number(form.qty) });
    setForm(f => ({ ...f, qty: '', party: '', notes: '' }));
  };

  const stock = useMemo(() => bardana.reduce((acc, b) => {
    const s = KINDS.find(k => k.id === b.kind)?.sign || 0;
    return acc + s * Number(b.qty || 0);
  }, 0), [bardana]);

  const byKind = useMemo(() => {
    const map = {};
    bardana.forEach(b => { map[b.kind] = (map[b.kind] || 0) + Number(b.qty || 0); });
    return map;
  }, [bardana]);

  return (
    <div className="page-enter">
      <Masthead title="Bardana" subtitle="Bag inventory movements" />
      {notice}

      <div className="grid grid-3">
        <div className="stat gold">
          <span className="stat-corner">No. I</span>
          <div className="stat-label">Bags in stock</div>
          <div className="stat-value">{stock.toLocaleString()}</div>
          <div className="stat-foot">Live count</div>
        </div>
        <div className="stat">
          <div className="stat-label">New bags total</div>
          <div className="stat-value">{(byKind.new || 0).toLocaleString()}</div>
          <div className="stat-foot text-faint">Inward · all-time</div>
        </div>
        <div className="stat">
          <div className="stat-label">Returned by buyers</div>
          <div className="stat-value text-paddy">{(byKind.returned || 0).toLocaleString()}</div>
          <div className="stat-foot text-faint">Reclaimed bardana</div>
        </div>
      </div>

      <SectionHead label="Record movement" />
      <form className="card" onSubmit={submit}>
        <div className="form-grid">
          <div className="field span-3">
            <label className="field-label">Date</label>
            <input className="input" type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="field span-6">
            <label className="field-label">Movement</label>
            <div className="segment">
              {KINDS.map(k => (
                <button key={k.id} type="button" className={form.kind === k.id ? 'on' : ''} onClick={() => setForm(f => ({ ...f, kind: k.id }))}>{k.name}</button>
              ))}
            </div>
          </div>
          <div className="field span-3">
            <label className="field-label">Bag count</label>
            <input className="input num" type="number" placeholder="0" value={form.qty} onChange={(e) => setForm(f => ({ ...f, qty: e.target.value }))} />
          </div>
          <div className="field span-6">
            <label className="field-label">Party / Source</label>
            <input className="input" placeholder="Supplier name, buyer name, or 'Stock'" value={form.party} onChange={(e) => setForm(f => ({ ...f, party: e.target.value }))} />
          </div>
          <div className="field span-6">
            <label className="field-label">Notes</label>
            <input className="input" placeholder="Optional" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <hr className="rule mt-4" />
        <div className="row between mt-3">
          <div className="text-soft" style={{ fontSize: 13 }}>{form.kind === 'old' ? 'This will reduce stock by' : 'This will add to stock'} <strong className="mono">{form.qty || 0}</strong> bags.</div>
          <button type="submit" className="btn btn-primary"><IcPlus style={{ width: 16, height: 16 }} /> Save</button>
        </div>
      </form>

      <SectionHead label="Movement log" meta={`${bardana.length} entries`} />
      <div className="card flush ledger-wrap">
        <table className="ledger">
          <thead>
            <tr>
              <th>Date</th><th>Movement</th><th>Party</th><th>Notes</th><th>Bags</th>
            </tr>
          </thead>
          <tbody>
            {bardana.length === 0 && (
              <tr><td colSpan={5} className="text-soft" style={{ textAlign:'center', padding: 'var(--s-6)' }}>No movements yet.</td></tr>
            )}
            {bardana.map(b => {
              const k = KINDS.find(x => x.id === b.kind);
              return (
                <tr key={b.id}>
                  <td>{fmtDate(b.date)}</td>
                  <td><span className={`badge ${k?.tone || 'gold'}`}>{k?.name || b.kind}</span></td>
                  <td>{b.party || <span className="text-faint">—</span>}</td>
                  <td>{b.notes || <span className="text-faint">—</span>}</td>
                  <td className="num-cell" style={{ color: k?.sign === 1 ? 'var(--paddy)' : 'var(--rust)', fontWeight: 700 }}>
                    {k?.sign === 1 ? '+' : '−'}{Number(b.qty).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
