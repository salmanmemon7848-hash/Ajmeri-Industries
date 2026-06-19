import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { IcPlus, IcClose } from './Icons';
import { todayISO, fmtQtl, STOCK_PRODUCTS } from '../data/constants';

export default function AddStockModal({ onClose, onAdd, currentStock = {} }) {
  const [date,      setDate]      = useState(todayISO());
  const [product,   setProduct]   = useState('paddy_sarna');
  const [qty,       setQty]       = useState('');
  const [newBagQty, setNewBagQty] = useState('');
  const [oldBagQty, setOldBagQty] = useState('');
  const [error,     setError]     = useState('');

  useEffect(() => { setError(''); }, [product, qty, newBagQty, oldBagQty, date]);

  const submit = (e) => {
    e?.preventDefault();
    const n = Number(qty);
    if (!n || n <= 0) { setError('Enter a valid quantity (qtl).'); return; }
    if (newBagQty === '' || oldBagQty === '') {
      setError('New Bags and Old Bags are required (enter 0 if none).');
      return;
    }
    onAdd({ date, product, qty: n, newBagQty: Number(newBagQty), oldBagQty: Number(oldBagQty) });
    onClose?.();
  };

  const currentLabel = STOCK_PRODUCTS.find(p => p.id === product)?.label;
  const currentQtl   = currentStock[product] ?? 0;

  const footer = (
    <>
      <button type="button" className="btn btn-soft" onClick={onClose}>
        <IcClose style={{ width: 16, height: 16 }} /> Cancel
      </button>
      <button type="button" className="btn btn-primary" onClick={submit}>
        <IcPlus style={{ width: 16, height: 16 }} /> Add to stock
      </button>
    </>
  );

  return (
    <Modal
      title="Add Stock"
      kicker="Date, product, quantity & bag counts"
      onClose={onClose}
      footer={footer}
    >
      <form onSubmit={submit} className="form-grid">

        {/* Date */}
        <div className="field span-6">
          <label className="field-label">Date</label>
          <input
            className="input"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        {/* Product */}
        <div className="field span-6">
          <label className="field-label">Product</label>
          <select
            className="input"
            value={product}
            onChange={e => setProduct(e.target.value)}
          >
            {STOCK_PRODUCTS.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <div className="text-faint" style={{ fontSize: 12, marginTop: 6 }}>
            Current {currentLabel} on hand: <strong>{fmtQtl(currentQtl)} qtl</strong>
          </div>
        </div>

        {/* Quantity */}
        <div className="field span-12">
          <label className="field-label">Quantity (qtl)</label>
          <input
            className="input num"
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="0.00"
            value={qty}
            onChange={e => setQty(e.target.value)}
            autoFocus
          />
        </div>

        {/* New Bags */}
        <div className="field span-6">
          <label className="field-label">New Bags <span className="text-faint" style={{ fontSize: 11 }}>(qtl)</span></label>
          <input
            className="input num"
            type="number"
            step="1"
            min="0"
            placeholder="0"
            value={newBagQty}
            onChange={e => setNewBagQty(e.target.value)}
          />
        </div>

        {/* Old Bags */}
        <div className="field span-6">
          <label className="field-label">Old Bags <span className="text-faint" style={{ fontSize: 11 }}>(qtl)</span></label>
          <input
            className="input num"
            type="number"
            step="1"
            min="0"
            placeholder="0"
            value={oldBagQty}
            onChange={e => setOldBagQty(e.target.value)}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="field span-12" style={{ color: 'var(--danger)', fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* Info */}
        <div className="field span-12">
          <div className="card tight" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', padding: 12 }}>
            <div className="text-soft" style={{ fontSize: 12 }}>
              Adding paddy varieties reflects as <strong>available paddy</strong> on the Milling page.
              Adding rice / by-products bumps the finished-goods count.
            </div>
          </div>
        </div>

        <button type="submit" style={{ display: 'none' }} aria-hidden="true" />
      </form>
    </Modal>
  );
}
