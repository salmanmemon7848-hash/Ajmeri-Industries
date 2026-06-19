import React, { useMemo, useState } from 'react';
import Masthead, { SectionHead } from '../components/Masthead';
import { useCollection } from '../hooks/useStore';
import { BY_PRODUCTS, fmtINR, fmtQtl, fmtDate, todayISO, UNITS } from '../data/constants';
import { IcPlus } from '../components/Icons';

export default function Sales() {
  const { items: sales, create }               = useCollection('sales');
  const { items: buyers, create: createBuyer } = useCollection('buyers');

  const [form, setForm] = useState({
    date:       todayISO(),
    buyerId:    '',
    buyerName:  '',
    product:    'rice',
    unit:       'qtl',
    qty:        '',
    rate:       '',
    broker:     '',
    commission: '',
    city:       '',
    notes:      '',
  });
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const qtl = useMemo(() => {
    const factor = UNITS.find(u => u.id === form.unit)?.factor || 1;
    return Number(form.qty || 0) * factor;
  }, [form.qty, form.unit]);

  const amount = useMemo(() => qtl * Number(form.rate || 0), [qtl, form.rate]);

  const submit = (e) => {
    e?.preventDefault();
    let buyerId   = form.buyerId;
    let buyerName = form.buyerName;
    if (!buyerId && buyerName.trim()) {
      const b = createBuyer({ name: buyerName.trim(), phone: '', gstin: '' });
      buyerId = b.id;
    }
    if (!buyerId) return alert('Select or type a buyer name');
    if (!form.qty || !form.rate) return alert('Enter qty and rate');

    create({
      date:       form.date,
      buyerId,
      product:    form.product,
      unit:       form.unit,
      qty:        Number(form.qty),
      rate:       Number(form.rate),
      amount,
      broker:     form.broker,
      commission: Number(form.commission) || 0,
      city:       form.city,
      notes:      form.notes,
    });
    setForm(f => ({ ...f, qty:'', rate:'', commission:'', broker:'', buyerName:'', buyerId:'', city:'', notes:'' }));
  };

  const todayTotal = sales
    .filter(s => s.date === todayISO())
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  return (
    <div className="page-enter">
      <Masthead title="Sales" subtitle="Record sales in bags or quintals" />

      <SectionHead label="New sale" />

      <form className="card" onSubmit={submit}>
        <div className="form-grid">
          <div className="field span-3">
            <label className="field-label">Date</label>
            <input className="input" type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
          </div>

          <div className="field span-6">
            <label className="field-label">Buyer</label>
            <input
              className="input"
              list="buyers-list"
              placeholder="Type or select buyer…"
              value={form.buyerName || buyers.find(b => b.id === form.buyerId)?.name || ''}
              onChange={e => {
                const name  = e.target.value;
                const match = buyers.find(b => b.name.toLowerCase() === name.toLowerCase());
                if (match) setForm(f => ({ ...f, buyerId: match.id, buyerName: '' }));
                else       setForm(f => ({ ...f, buyerId: '',        buyerName: name }));
              }}
            />
            <datalist id="buyers-list">
              {buyers.map(b => <option key={b.id} value={b.name}>{b.gstin || ''}</option>)}
            </datalist>
          </div>

          {/* City — replaces old Godown field */}
          <div className="field span-3">
            <label className="field-label">City</label>
            <input
              className="input"
              placeholder="e.g. Raipur, Bilaspur, Durg"
              value={form.city}
              onChange={e => setField('city', e.target.value)}
            />
          </div>

          <div className="field span-4">
            <label className="field-label">Product</label>
            <div className="segment" style={{ flexWrap: 'wrap' }}>
              {BY_PRODUCTS.map(bp => (
                <button
                  key={bp.id}
                  type="button"
                  className={form.product === bp.id ? 'on' : ''}
                  onClick={() => setField('product', bp.id)}
                >
                  {bp.name}
                </button>
              ))}
            </div>
          </div>

          <div className="field span-4">
            <label className="field-label">Unit</label>
            <div className="segment">
              <button type="button" className={form.unit === 'qtl' ? 'on' : ''} onClick={() => setField('unit','qtl')}>Quintal</button>
              <button type="button" className={form.unit === 'bag' ? 'on' : ''} onClick={() => setField('unit','bag')}>Bag (50kg)</button>
            </div>
            <div className="row gap-3 mt-3">
              <div className="field" style={{ flex: 1 }}>
                <label className="field-label">Qty ({form.unit === 'qtl' ? 'qtl' : 'bags'})</label>
                <input className="input num" type="number" step="0.01" placeholder="0.00" value={form.qty} onChange={e => setField('qty', e.target.value)} />
                {form.unit === 'bag' && form.qty && <span className="field-hint">= {fmtQtl(qtl)} qtl</span>}
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="field-label">Rate (₹/qtl)</label>
                <input className="input num" type="number" placeholder="0" value={form.rate} onChange={e => setField('rate', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="field span-4">
            <label className="field-label">Broker</label>
            <input className="input" placeholder="Broker name (optional)" value={form.broker} onChange={e => setField('broker', e.target.value)} />
            <div className="row gap-3 mt-3">
              <div className="field" style={{ flex: 1 }}>
                <label className="field-label">Commission (₹)</label>
                <input className="input num" type="number" placeholder="0" value={form.commission} onChange={e => setField('commission', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="field span-12">
            <label className="field-label">Notes</label>
            <input className="input" placeholder="LR number, party reference, dispatch instructions…" value={form.notes} onChange={e => setField('notes', e.target.value)} />
          </div>
        </div>

        <hr className="rule mt-5" />

        <div className="row between mt-4 wrap" style={{ gap: 12 }}>
          <div>
            <div className="small-caps">Computed amount</div>
            <div className="display-num" style={{ fontSize: 32, color: 'var(--text)' }}>
              ₹ {fmtINR(amount).replace('₹','')}
            </div>
            <div className="text-soft" style={{ fontSize: 13 }}>
              {fmtQtl(qtl)} qtl × ₹ {form.rate || 0}{form.commission ? ` · less ₹${form.commission} broker` : ''}
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            <IcPlus style={{ width: 16, height: 16 }} /> Record Sale
          </button>
        </div>
      </form>

      <div className="grid grid-3 mt-5">
        <div className="stat">
          <div className="stat-label">Today's sales</div>
          <div className="stat-value">₹{fmtINR(todayTotal, { short: true }).replace('₹','')}</div>
          <div className="stat-foot">{sales.filter(s => s.date === todayISO()).length} invoices</div>
        </div>
        <div className="stat gold">
          <div className="stat-label">Total invoices</div>
          <div className="stat-value">{sales.length}</div>
          <div className="stat-foot">All time</div>
        </div>
        <div className="stat gold">
          <div className="stat-label">Unique buyers</div>
          <div className="stat-value">{new Set(sales.map(s => s.buyerId)).size}</div>
          <div className="stat-foot">in current ledger</div>
        </div>
      </div>

      <SectionHead label="Recent sales" meta={`${sales.length} entries`} />
      <div className="card flush ledger-wrap">
        <table className="ledger">
          <thead>
            <tr>
              <th>Date</th><th>Buyer</th><th>Product</th><th>City</th><th>Qty</th><th>Rate</th><th>Broker</th><th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr>
                <td colSpan={8} className="text-soft" style={{ textAlign:'center', padding:'var(--s-6)' }}>No sales logged yet.</td>
              </tr>
            )}
            {sales.map(s => (
              <tr key={s.id}>
                <td>{fmtDate(s.date)}</td>
                <td style={{ fontWeight: 600 }}>{buyers.find(b => b.id === s.buyerId)?.name || '—'}</td>
                <td><span className="badge gold">{BY_PRODUCTS.find(x => x.id === s.product)?.name || s.product}</span></td>
                <td>{s.city || <span className="text-faint">—</span>}</td>
                <td className="num-cell">{fmtQtl(s.qty)} {s.unit}</td>
                <td className="num-cell">₹ {s.rate}</td>
                <td>{s.broker || <span className="text-faint">—</span>}</td>
                <td className="num-cell" style={{ fontWeight: 700 }}>{fmtINR(s.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
