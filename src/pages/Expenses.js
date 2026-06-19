import React, { useMemo, useState } from 'react';
import Masthead, { SectionHead } from '../components/Masthead';
import { useCollection } from '../hooks/useStore';
import { EXPENSE_CATEGORIES, CONSUMABLE_UNITS, fmtINR, fmtDate, todayISO } from '../data/constants';
import { IcPlus } from '../components/Icons';

// Only the new consumable-specific categories
const CONSUMABLE_CATEGORIES = EXPENSE_CATEGORIES.filter(c =>
  ['silai_dhaga','color_dye','rubber_roll','machinery','consumables'].includes(c.id)
);

export default function Expenses() {
  const { items: expenses, create }                           = useCollection('expenses');
  const { items: consumables, create: createConsumable }     = useCollection('consumablePurchases');

  // ── General expense form ──────────────────────────────────────────
  const [form, setForm] = useState({
    date:        todayISO(),
    category:    'electricity',
    description: '',
    amount:      '',
  });
  const [filterCat, setFilterCat] = useState('all');
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e) => {
    e?.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return alert('Enter a valid amount');
    create({
      date:        form.date,
      category:    form.category,
      description: form.description.trim(),
      amount:      Number(form.amount),
    });
    setForm(f => ({ ...f, description: '', amount: '' }));
  };

  // ── Consumable purchase form ──────────────────────────────────────
  const [cForm, setCForm] = useState({
    date:         todayISO(),
    itemName:     '',
    category:     'silai_dhaga',
    qty:          '',
    unit:         'kg',
    rate:         '',
    total:        '',
    supplier:     '',
    billNumber:   '',
  });
  const setCField = (k, v) => setCForm(f => ({ ...f, [k]: v }));

  const cTotal = useMemo(() => {
    const q = Number(cForm.qty  || 0);
    const r = Number(cForm.rate || 0);
    return q && r ? (q * r) : 0;
  }, [cForm.qty, cForm.rate]);

  const submitConsumable = (e) => {
    e?.preventDefault();
    if (!cForm.itemName || !cForm.qty || !cForm.rate) return alert('Item name, qty and rate are required');
    createConsumable({
      date:       cForm.date,
      itemName:   cForm.itemName.trim(),
      category:   cForm.category,
      qty:        Number(cForm.qty),
      unit:       cForm.unit,
      rate:       Number(cForm.rate),
      total:      Number(cForm.total) || cTotal,
      supplier:   cForm.supplier.trim(),
      billNumber: cForm.billNumber.trim(),
    });
    setCForm(f => ({ ...f, itemName:'', qty:'', rate:'', total:'', supplier:'', billNumber:'' }));
  };

  // ── Stats ─────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    filterCat === 'all' ? expenses : expenses.filter(e => e.category === filterCat),
    [expenses, filterCat]
  );

  const currentMonth = todayISO().slice(0, 7);
  const monthTotal   = expenses.filter(e => e.date.startsWith(currentMonth)).reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalAll     = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const byCategory = useMemo(() => EXPENSE_CATEGORIES.map(cat => {
    const total = expenses.filter(e => e.category === cat.id).reduce((s, e) => s + Number(e.amount || 0), 0);
    return { ...cat, total };
  }), [expenses]);

  const catName = (id) => EXPENSE_CATEGORIES.find(c => c.id === id)?.name || id;
  const consCatName = (id) => CONSUMABLE_CATEGORIES.find(c => c.id === id)?.name || id;

  return (
    <div className="page-enter">
      <Masthead title="Expenses" subtitle="Operational costs · Consumables & Supplies" />

      {/* ── General Expense Form ─────────────────────────── */}
      <SectionHead label="Log expense" />
      <form className="card" onSubmit={submit}>
        <div className="form-grid">
          <div className="field span-3">
            <label className="field-label">Date</label>
            <input className="input" type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
          </div>
          <div className="field span-5">
            <label className="field-label">Category</label>
            <select className="select" value={form.category} onChange={e => setField('category', e.target.value)}>
              {EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field span-4">
            <label className="field-label">Amount (₹)</label>
            <input className="input num" type="number" step="1" inputMode="numeric" placeholder="0" value={form.amount} onChange={e => setField('amount', e.target.value)} />
          </div>
          <div className="field span-12">
            <label className="field-label">Description</label>
            <input className="input" placeholder="e.g. Diesel for generator, motor repair…" value={form.description} onChange={e => setField('description', e.target.value)} />
          </div>
        </div>
        <hr className="rule mt-4" />
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="submit" className="btn btn-primary">
            <IcPlus style={{ width: 16, height: 16 }} /> Save Expense
          </button>
        </div>
      </form>

      {/* ── Stats ───────────────────────────────────────────── */}
      <div className="grid grid-3 mt-5">
        <div className="stat">
          <div className="stat-label">This month</div>
          <div className="stat-value">₹{fmtINR(monthTotal, { short: true }).replace('₹','')}</div>
          <div className="stat-foot">{expenses.filter(e => e.date.startsWith(currentMonth)).length} entries</div>
        </div>
        <div className="stat gold">
          <div className="stat-label">All time</div>
          <div className="stat-value">₹{fmtINR(totalAll, { short: true }).replace('₹','')}</div>
          <div className="stat-foot">{expenses.length} entries</div>
        </div>
        <div className="stat gold">
          <div className="stat-label">Top category</div>
          <div className="stat-value" style={{ fontSize: 18 }}>
            {byCategory.sort((a, b) => b.total - a.total)[0]?.name.split(' / ')[0] || '—'}
          </div>
          <div className="stat-foot">by total spend</div>
        </div>
      </div>

      <SectionHead label="By category" meta="All time" />
      <div className="card">
        {byCategory.map(cat => {
          const pct = totalAll > 0 ? (cat.total / totalAll) * 100 : 0;
          return (
            <div className="stock-row" key={cat.id}>
              <div className="lbl">{cat.name}</div>
              <div className="meter"><span style={{ width: `${Math.max(4, pct)}%` }} /></div>
              <div className="val">{fmtINR(cat.total)}</div>
            </div>
          );
        })}
      </div>

      <SectionHead label="Expense log" meta={`${filtered.length} entries`} />
      <div className="row between mb-4 wrap" style={{ gap: 12 }}>
        <div className="segment" style={{ flexWrap: 'wrap' }}>
          <button className={filterCat === 'all' ? 'on' : ''} onClick={() => setFilterCat('all')}>All</button>
          {EXPENSE_CATEGORIES.map(c => (
            <button key={c.id} className={filterCat === c.id ? 'on' : ''} onClick={() => setFilterCat(c.id)}>
              {c.name.split(' / ')[0]}
            </button>
          ))}
        </div>
        <div className="text-faint" style={{ fontSize: 13 }}>Newest at top</div>
      </div>

      <div className="card flush ledger-wrap">
        <table className="ledger">
          <thead>
            <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="text-soft" style={{ textAlign:'center', padding:'var(--s-6)' }}>No expenses logged yet.</td></tr>
            )}
            {filtered.map(exp => (
              <tr key={exp.id}>
                <td>{fmtDate(exp.date)}</td>
                <td><span className="badge gold">{catName(exp.category)}</span></td>
                <td>{exp.description || <span className="text-faint">—</span>}</td>
                <td className="num-cell" style={{ fontWeight: 700 }}>{fmtINR(exp.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Consumables Purchase Section ─────────────────── */}
      <div style={{ marginTop: 40 }}>
        <SectionHead label="Consumables Purchase" meta="Thread · Dye · Rubber Roll · Machinery · Other" />
        <form className="card" onSubmit={submitConsumable}>
          <div className="form-grid">
            <div className="field span-3">
              <label className="field-label">Date</label>
              <input className="input" type="date" value={cForm.date} onChange={e => setCField('date', e.target.value)} />
            </div>
            <div className="field span-5">
              <label className="field-label">Item Name</label>
              <input className="input" placeholder="e.g. Stitching thread, rubber roller…" value={cForm.itemName} onChange={e => setCField('itemName', e.target.value)} />
            </div>
            <div className="field span-4">
              <label className="field-label">Category</label>
              <select className="select" value={cForm.category} onChange={e => setCField('category', e.target.value)}>
                {CONSUMABLE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field span-2">
              <label className="field-label">Qty</label>
              <input className="input num" type="number" step="0.01" placeholder="0" value={cForm.qty} onChange={e => setCField('qty', e.target.value)} />
            </div>
            <div className="field span-2">
              <label className="field-label">Unit</label>
              <select className="select" value={cForm.unit} onChange={e => setCField('unit', e.target.value)}>
                {CONSUMABLE_UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="field span-3">
              <label className="field-label">Rate per Unit (₹)</label>
              <input className="input num" type="number" step="1" placeholder="0" value={cForm.rate} onChange={e => setCField('rate', e.target.value)} />
            </div>
            <div className="field span-3">
              <label className="field-label">Total Amount (₹)</label>
              <input
                className="input num"
                type="number"
                step="1"
                placeholder="auto"
                value={cForm.total || (cTotal > 0 ? cTotal : '')}
                onChange={e => setCField('total', e.target.value)}
              />
            </div>
            <div className="field span-4">
              <label className="field-label">Supplier Name</label>
              <input className="input" placeholder="Supplier / vendor" value={cForm.supplier} onChange={e => setCField('supplier', e.target.value)} />
            </div>
            <div className="field span-4">
              <label className="field-label">Bill Number <span className="text-faint" style={{ fontSize: 11 }}>(optional)</span></label>
              <input className="input" placeholder="Bill / invoice no." value={cForm.billNumber} onChange={e => setCField('billNumber', e.target.value)} />
            </div>
          </div>
          <hr className="rule mt-4" />
          <div className="row between mt-3">
            <div className="text-soft" style={{ fontSize: 13 }}>
              Total: <strong className="mono">{fmtINR(Number(cForm.total) || cTotal)}</strong>
            </div>
            <button type="submit" className="btn btn-primary">
              <IcPlus style={{ width: 16, height: 16 }} /> Save Purchase
            </button>
          </div>
        </form>

        {/* Consumables ledger */}
        <SectionHead label="Consumable purchase log" meta={`${consumables.length} entries`} />
        {consumables.length === 0 && <div className="empty">No consumable purchases yet.</div>}
        <div className="card flush ledger-wrap">
          <table className="ledger">
            <thead>
              <tr>
                <th>Date</th><th>Item</th><th>Category</th>
                <th>Qty</th><th>Rate</th><th>Total</th>
                <th>Supplier</th><th>Bill No.</th>
              </tr>
            </thead>
            <tbody>
              {consumables.length === 0 && (
                <tr><td colSpan={8} className="text-soft" style={{ textAlign:'center', padding:'var(--s-6)' }}>No entries yet.</td></tr>
              )}
              {consumables.map(c => (
                <tr key={c.id}>
                  <td>{fmtDate(c.date)}</td>
                  <td style={{ fontWeight: 600 }}>{c.itemName}</td>
                  <td><span className="badge gold">{consCatName(c.category)}</span></td>
                  <td className="num-cell">{c.qty} {c.unit}</td>
                  <td className="num-cell">₹{c.rate}</td>
                  <td className="num-cell" style={{ fontWeight: 700 }}>{fmtINR(c.total)}</td>
                  <td>{c.supplier || <span className="text-faint">—</span>}</td>
                  <td>{c.billNumber || <span className="text-faint">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
