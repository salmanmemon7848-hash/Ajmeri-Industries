import React, { useMemo, useState } from 'react';
import Masthead, { SectionHead } from '../components/Masthead';
import { useCollection } from '../hooks/useStore';
import { fmtINR, fmtQtl } from '../data/constants';
import { IcPlus, IcSearch } from '../components/Icons';

export default function Buyers() {
  const { items: buyers, create } = useCollection('buyers');
  const { items: sales } = useCollection('sales');
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', gstin: '' });

  const enriched = useMemo(() => buyers.map(b => {
    const bs = sales.filter(s => s.buyerId === b.id);
    const total = bs.reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const qty = bs.reduce((s, x) => s + (Number(x.qty) || 0) * (x.unit === 'qtl' ? 1 : 0.5), 0);
    return { ...b, total, qty, count: bs.length };
  }), [buyers, sales]);

  const filtered = q ? enriched.filter(b => (b.name + ' ' + (b.gstin || '')).toLowerCase().includes(q.toLowerCase())) : enriched;
  filtered.sort((a,b) => b.total - a.total);

  const submit = (e) => {
    e?.preventDefault();
    if (!form.name.trim()) return;
    create({ name: form.name.trim(), phone: form.phone, gstin: form.gstin });
    setForm({ name: '', phone: '', gstin: '' });
  };

  return (
    <div className="page-enter">
      <Masthead title="Buyers" subtitle="Customers and their orders" />

      <div className="row between mb-4 wrap" style={{ gap: 12 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <IcSearch style={{ position:'absolute', left: 12, top: 12, width: 16, height: 16, color: 'var(--text-faint)' }} />
          <input className="input" placeholder="Search buyer or GSTIN…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <div className="badge gold dot">{filtered.length} buyers</div>
      </div>

      <SectionHead label="Add buyer" />
      <form className="card" onSubmit={submit}>
        <div className="form-grid">
          <div className="field span-4">
            <label className="field-label">Name</label>
            <input className="input" placeholder="Buyer name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="field span-3">
            <label className="field-label">Phone</label>
            <input className="input" placeholder="+91 …" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="field span-4">
            <label className="field-label">GSTIN <span className="text-faint" style={{ fontWeight: 400, fontSize: 12 }}>(optional)</span></label>
            <input className="input" placeholder="24XXXXX0000X1Z5" value={form.gstin} onChange={(e) => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))} />
          </div>
          <div className="field span-1" style={{ alignSelf: 'end' }}>
            <button className="btn btn-primary" type="submit" style={{ width:'100%' }}><IcPlus style={{ width: 16, height: 16 }} /></button>
          </div>
        </div>
      </form>

      <SectionHead label="All buyers" meta="By lifetime value" />
      <div className="card flush ledger-wrap">
        <table className="ledger">
          <thead>
            <tr>
              <th>Buyer</th><th>GSTIN</th><th>Phone</th><th>Orders</th><th>Total qtl</th><th>Lifetime value</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-soft" style={{ textAlign:'center', padding: 'var(--s-6)' }}>No buyers yet. Add one above.</td></tr>
            )}
            {filtered.map(b => (
              <tr key={b.id}>
                <td style={{ fontWeight: 600 }}>{b.name}</td>
                <td className="mono" style={{ fontSize: 11.5 }}>{b.gstin || <span className="text-faint">—</span>}</td>
                <td className="mono">{b.phone || <span className="text-faint">—</span>}</td>
                <td className="num-cell">{b.count}</td>
                <td className="num-cell">{fmtQtl(b.qty)}</td>
                <td className="num-cell" style={{ fontWeight: 700 }}>{fmtINR(b.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
