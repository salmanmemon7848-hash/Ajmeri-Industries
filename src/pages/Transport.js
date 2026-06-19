import React, { useMemo, useState } from 'react';
import Masthead, { SectionHead } from '../components/Masthead';
import { useCollection } from '../hooks/useStore';
import { TRANSPORT_PRODUCTS, fmtINR, fmtDate, todayISO } from '../data/constants';
import { IcPlus } from '../components/Icons';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function TransportTab({ collection, fields, title, kicker }) {
  const { items, create } = useCollection(collection);
  const [month, setMonth] = useState(currentMonth());
  const [form, setForm] = useState(() => {
    const init = { date: todayISO(), notes: '' };
    fields.forEach(f => { if (f.default !== undefined) init[f.key] = f.default; else init[f.key] = ''; });
    return init;
  });
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-calc total from qty * rate
  const total = useMemo(() => {
    const q = Number(form.qty || 0);
    const r = Number(form.rate || 0);
    return q && r ? q * r : 0;
  }, [form.qty, form.rate]);

  const submit = (e) => {
    e?.preventDefault();
    const record = { ...form };
    fields.forEach(f => { if (f.type === 'number') record[f.key] = Number(form[f.key]) || 0; });
    if (total > 0) record.total = total;
    create(record);
    setForm(f => {
      const reset = { ...f, notes: '' };
      fields.filter(f2 => f2.clearOnSubmit !== false && f2.type !== 'select').forEach(f2 => { reset[f2.key] = ''; });
      return reset;
    });
  };

  const monthItems = items.filter(it => it.date && it.date.startsWith(month));
  const monthTotal = monthItems.reduce((s, it) => s + (Number(it.total) || 0), 0);
  const avgRate    = monthItems.length
    ? monthItems.reduce((s, it) => s + (Number(it.rate) || 0), 0) / monthItems.length
    : 0;

  return (
    <>
      <div className="grid grid-3 mb-5">
        <div className="stat">
          <div className="stat-label">This month total</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{fmtINR(monthTotal, { short: true })}</div>
          <div className="stat-foot text-faint">{monthItems.length} trips</div>
        </div>
        <div className="stat gold">
          <div className="stat-label">Total trips</div>
          <div className="stat-value">{items.length}</div>
          <div className="stat-foot text-faint">All time</div>
        </div>
        <div className="stat gold">
          <div className="stat-label">Avg rate (this month)</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{avgRate > 0 ? fmtINR(avgRate) : '—'}</div>
          <div className="stat-foot text-faint">₹/qtl</div>
        </div>
      </div>

      <SectionHead label={title} meta={kicker} />
      <form className="card" onSubmit={submit}>
        <div className="form-grid">
          <div className="field span-3">
            <label className="field-label">Date</label>
            <input className="input" type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
          </div>

          {fields.map(f => (
            <div key={f.key} className={`field span-${f.span || 3}`}>
              <label className="field-label">{f.label}</label>
              {f.type === 'select' ? (
                <select className="select" value={form[f.key]} onChange={e => setField(f.key, e.target.value)}>
                  {f.options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              ) : (
                <input
                  className={`input${f.type === 'number' ? ' num' : ''}`}
                  type={f.type || 'text'}
                  step={f.step}
                  placeholder={f.placeholder || ''}
                  value={form[f.key]}
                  onChange={e => setField(f.key, e.target.value)}
                />
              )}
            </div>
          ))}

          {total > 0 && (
            <div className="field span-3">
              <label className="field-label">Auto Total (₹)</label>
              <div className="card tight" style={{ background: 'var(--accent-soft)', padding: '9px 12px', fontWeight: 700, fontSize: 15 }}>
                {fmtINR(total)}
              </div>
            </div>
          )}

          <div className="field span-12">
            <label className="field-label">Notes</label>
            <input className="input" placeholder="Optional" value={form.notes} onChange={e => setField('notes', e.target.value)} />
          </div>
        </div>
        <hr className="rule mt-4" />
        <div className="row between mt-3">
          <div className="row gap-3">
            <input className="input" type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 160 }} />
          </div>
          <button type="submit" className="btn btn-primary">
            <IcPlus style={{ width: 16, height: 16 }} /> Save Trip
          </button>
        </div>
      </form>

      <SectionHead label="Trip log" meta={`${monthItems.length} entries this month`} />
      <div className="card flush ledger-wrap">
        <table className="ledger">
          <thead>
            <tr>
              <th>Date</th>
              {fields.map(f => <th key={f.key}>{f.label}</th>)}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {monthItems.length === 0 && (
              <tr>
                <td colSpan={fields.length + 2} className="text-soft" style={{ textAlign:'center', padding:'var(--s-6)' }}>
                  No entries for this month.
                </td>
              </tr>
            )}
            {monthItems.map(it => (
              <tr key={it.id}>
                <td>{fmtDate(it.date)}</td>
                {fields.map(f => (
                  <td key={f.key} className={f.type === 'number' ? 'num-cell' : ''}>
                    {it[f.key] ?? <span className="text-faint">—</span>}
                  </td>
                ))}
                <td className="num-cell" style={{ fontWeight: 700 }}>{fmtINR(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function Transport() {
  const [tab, setTab] = useState('paddy');

  const paddyFields = [
    { key: 'vehicleNumber', label: 'Vehicle No.',    span: 3, placeholder: 'HR-38-AB-1234' },
    { key: 'driverName',    label: 'Driver Name',    span: 3 },
    { key: 'from',          label: 'From (Samiti)',  span: 3 },
    { key: 'to',            label: 'To',             span: 3, placeholder: 'Ajmeri Industries', default: 'Ajmeri Industries' },
    { key: 'qty',           label: 'Qty (Qtl)',      span: 3, type: 'number', step: '0.1', placeholder: '0.00' },
    { key: 'rate',          label: 'Rate (₹/Qtl)',   span: 3, type: 'number', step: '1',   placeholder: '0' },
  ];

  const riceFields = [
    { key: 'vehicleNumber', label: 'Vehicle No.',     span: 3, placeholder: 'HR-38-AB-1234' },
    { key: 'driverName',    label: 'Driver Name',     span: 3 },
    { key: 'destCity',      label: 'Destination City',span: 3 },
    { key: 'product',       label: 'Product',         span: 3, type: 'select', options: TRANSPORT_PRODUCTS, default: 'rice' },
    { key: 'qty',           label: 'Qty (Qtl)',       span: 3, type: 'number', step: '0.1', placeholder: '0.00' },
    { key: 'rate',          label: 'Rate (₹/Qtl)',    span: 3, type: 'number', step: '1',   placeholder: '0' },
  ];

  const otherFields = [
    { key: 'vehicleNumber', label: 'Vehicle No.',  span: 4, placeholder: 'HR-38-AB-1234' },
    { key: 'description',   label: 'Description',  span: 8 },
    { key: 'amount',        label: 'Amount (₹)',   span: 4, type: 'number', step: '1', placeholder: '0' },
  ];

  return (
    <div className="page-enter">
      <Masthead title="Transport" subtitle="Paddy · Rice · Other transport expenses" />

      <div className="segment mb-5">
        {[
          { id: 'paddy', label: 'Paddy Transport' },
          { id: 'rice',  label: 'Rice Transport' },
          { id: 'other', label: 'Other Transport' },
        ].map(t => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'paddy' && (
        <TransportTab
          collection="paddyTransport"
          fields={paddyFields}
          title="New paddy trip"
          kicker="Samiti → Mill"
        />
      )}
      {tab === 'rice' && (
        <TransportTab
          collection="riceTransport"
          fields={riceFields}
          title="New rice delivery trip"
          kicker="Mill → FCI / Buyer / City"
        />
      )}
      {tab === 'other' && (
        <TransportTab
          collection="otherTransport"
          fields={otherFields}
          title="Other transport expense"
          kicker="Misc trips"
        />
      )}
    </div>
  );
}
