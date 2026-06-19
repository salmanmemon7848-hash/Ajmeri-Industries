import React, { useMemo, useRef, useState } from 'react';
import Masthead, { SectionHead } from '../components/Masthead';
import { useCollection } from '../hooks/useStore';
import { STOCK_PRODUCTS, fmtQtl, fmtDate, todayISO } from '../data/constants';
import { generateSlipPDF } from '../lib/pdf';
import { IcDownload, IcPlus } from '../components/Icons';
import AddStockModal from '../components/AddStockModal';

const BARDANA_KINDS = [
  { id: 'new',      name: 'New Bags In',  sign: +1, tone: 'paddy' },
  { id: 'old',      name: 'Old Bags Out', sign: -1, tone: 'gold'  },
  { id: 'returned', name: 'Returned',     sign: +1, tone: 'paddy' },
];

function stockBadge(qtl) {
  if (qtl > 10) return { cls: 'badge paddy', label: 'Sufficient' };
  if (qtl >= 1) return { cls: 'badge gold',  label: 'Low' };
  return          { cls: 'badge rust',  label: 'Critical' };
}

const isPaddyProduct = (id) =>
  ['paddy', 'paddy_sarna', 'paddy_mota', 'paddy_patla'].includes(id);

export default function Stock() {
  const { items: purchases }                       = useCollection('purchases');
  const { items: milling }                         = useCollection('milling');
  const { items: sales }                           = useCollection('sales');
  const { items: additions, create: addStock }     = useCollection('stockAdditions');
  const { items: bardana,   create: createBardana } = useCollection('bardana');

  const [tab, setTab]         = useState('stock');
  const [showAdd, setShowAdd] = useState(false);
  const reportRef             = useRef(null);

  // ── Bardana form ────────────────────────────────────────────────────
  const [bForm, setBForm] = useState({
    date: todayISO(), kind: 'new', qty: '', party: '', notes: '',
  });
  const setBField = (k, v) => setBForm(f => ({ ...f, [k]: v }));

  const submitBardana = (e) => {
    e?.preventDefault();
    if (!bForm.qty) return;
    createBardana({ ...bForm, qty: Number(bForm.qty) });
    setBForm(f => ({ ...f, qty: '', party: '', notes: '' }));
  };

  const bardanaStock = useMemo(() =>
    bardana.reduce((acc, b) => {
      const sign = BARDANA_KINDS.find(k => k.id === b.kind)?.sign || 0;
      return acc + sign * Number(b.qty || 0);
    }, 0),
    [bardana]
  );

  const byKind = useMemo(() => {
    const map = {};
    bardana.forEach(b => { map[b.kind] = (map[b.kind] || 0) + Number(b.qty || 0); });
    return map;
  }, [bardana]);

  // ── Stock calculation ────────────────────────────────────────────────
  const stock = useMemo(() => {
    const totalPaddyPurchased = purchases.reduce((s, p) => s + (Number(p.qtl) || 0), 0);
    const totalPaddyAdded     = additions
      .filter(a => isPaddyProduct(a.product))
      .reduce((s, a) => s + (Number(a.qty) || 0), 0);
    const totalPaddyMilled    = milling.reduce((s, m) => s + (Number(m.paddyQtl) || 0), 0);
    const paddyStock          = Math.max(0, totalPaddyPurchased + totalPaddyAdded - totalPaddyMilled);

    // Per-variety additions (paddy_sarna / paddy_mota / paddy_patla)
    const addOf = (id) => additions.filter(a => a.product === id).reduce((s, a) => s + (Number(a.qty) || 0), 0);

    const produced = (key) => milling.reduce((s, m) => s + (Number(m[key]) || 0), 0);

    const sold = (id) => sales.filter(s => s.product === id).reduce((sum, s) => {
      const q = Number(s.qty || 0);
      return sum + (s.unit === 'bag' ? q * 0.5 : q);
    }, 0);

    // Distribute paddy stock across varieties proportionally to their additions
    const sarna  = addOf('paddy_sarna');
    const mota   = addOf('paddy_mota');
    const patla  = addOf('paddy_patla');
    const legacy = addOf('paddy'); // old single-product entries
    const paddyAddTotal = sarna + mota + patla + legacy || 1;

    return {
      paddy_sarna: Math.max(0, paddyStock * ((sarna + legacy) / paddyAddTotal) || paddyStock),
      paddy_mota:  Math.max(0, paddyStock * (mota  / paddyAddTotal)),
      paddy_patla: Math.max(0, paddyStock * (patla / paddyAddTotal)),
      rice:        Math.max(0, produced('riceQtl')   + addOf('rice')        - sold('rice')),
      broken:      Math.max(0, produced('brokenQtl') + addOf('broken')      - sold('broken')),
      rafi:        Math.max(0, produced('rafiQtl')   + addOf('rafi')        - sold('rafi')),
      bran:        Math.max(0, produced('branQtl')   + addOf('bran')        - sold('bran')),
      husk:        Math.max(0, produced('huskQtl')   + addOf('husk')        - sold('husk')),
      bold_broken: Math.max(0, addOf('bold_broken')                         - sold('bold_broken')),
      bardana:     Math.max(0, addOf('bardana')),
    };
  }, [purchases, milling, sales, additions]);

  const totalPaddy = (stock.paddy_sarna || 0) + (stock.paddy_mota || 0) + (stock.paddy_patla || 0);
  const totalByProducts =
    (stock.rice || 0) + (stock.broken || 0) + (stock.rafi || 0) +
    (stock.bran || 0) + (stock.husk   || 0) + (stock.bold_broken || 0);

  const handleExport = async () => {
    if (!reportRef.current) return;
    await generateSlipPDF(reportRef.current, `Ajmeri-Stock-${todayISO()}.pdf`);
  };

  const handleAdd = ({ date, product, qty, newBagQty, oldBagQty }) => {
    addStock({
      date,
      product,
      qty:       Number(qty),
      newBagQty: Number(newBagQty) || 0,
      oldBagQty: Number(oldBagQty) || 0,
      source:    'manual',
    });
  };

  // Display products list — exclude sub-varieties if their stock is zero (cleaner view)
  const displayProducts = STOCK_PRODUCTS.filter(p => {
    if (p.id === 'paddy_mota'  && stock.paddy_mota  === 0) return false;
    if (p.id === 'paddy_patla' && stock.paddy_patla === 0) return false;
    return true;
  });

  return (
    <div className="page-enter">
      <Masthead title="Stock" subtitle="Live stock · Bardana · Manual entries" />

      {/* Tab bar */}
      <div className="segment mb-5">
        {[
          { id: 'stock',   label: 'Stock Dashboard' },
          { id: 'bardana', label: 'Bardana (Bags)' },
          { id: 'log',     label: 'Stock Log' },
        ].map(t => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: STOCK ──────────────────────────────────────────── */}
      {tab === 'stock' && (
        <>
          <div className="grid grid-3">
            <div className="stat">
              <div className="stat-label">Total Paddy</div>
              <div className="stat-value">{fmtQtl(totalPaddy)}<span className="unit"> qtl</span></div>
              <div className="stat-foot text-faint">Raw paddy in store</div>
            </div>
            <div className="stat gold">
              <div className="stat-label">Total Rice</div>
              <div className="stat-value">{fmtQtl(stock.rice)}<span className="unit"> qtl</span></div>
              <div className="stat-foot text-faint">Milled rice available</div>
            </div>
            <div className="stat gold">
              <div className="stat-label">By-products</div>
              <div className="stat-value">{fmtQtl(totalByProducts)}<span className="unit"> qtl</span></div>
              <div className="stat-foot text-faint">Broken · Rafi · Bran · Husk</div>
            </div>
          </div>

          <div className="row between mt-5 mb-2" style={{ alignItems: 'center' }}>
            <SectionHead label="Stock by product" meta="Calculated live" />
            <div className="row gap-3">
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                <IcPlus style={{ width: 16, height: 16 }} /> Add Stock
              </button>
              <button className="btn btn-soft" onClick={handleExport}>
                <IcDownload style={{ width: 16, height: 16 }} /> PDF
              </button>
            </div>
          </div>

          <div ref={reportRef}>
            <div className="card flush ledger-wrap">
              <table className="ledger">
                <thead>
                  <tr><th>Product</th><th>Stock (qtl)</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {displayProducts.map(p => {
                    const qtl   = stock[p.id] ?? 0;
                    const badge = stockBadge(qtl);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.label}</td>
                        <td className="num-cell mono" style={{ fontSize: 16, fontWeight: 700 }}>{fmtQtl(qtl)}</td>
                        <td><span className={badge.cls}>{badge.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <SectionHead label="Comparison bars" meta="Relative view" />
            <div className="card">
              {displayProducts.map(p => {
                const qtl    = stock[p.id] ?? 0;
                const maxVal = Math.max(1, ...displayProducts.map(x => stock[x.id] ?? 0));
                const pct    = (qtl / maxVal) * 100;
                return (
                  <div className="stock-row" key={p.id}>
                    <div className="lbl">{p.label}</div>
                    <div className="meter">
                      <span
                        className={p.id === 'rice' ? 'alt' : ''}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                    <div className="val">{fmtQtl(qtl)} qtl</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ─── TAB: BARDANA ────────────────────────────────────────── */}
      {tab === 'bardana' && (
        <>
          <div className="grid grid-3 mb-5">
            <div className="stat gold">
              <div className="stat-label">Bags in stock</div>
              <div className="stat-value">{bardanaStock.toLocaleString()}</div>
              <div className="stat-foot">Live count</div>
            </div>
            <div className="stat">
              <div className="stat-label">New bags total</div>
              <div className="stat-value">{(byKind.new || 0).toLocaleString()}</div>
              <div className="stat-foot text-faint">All-time inward</div>
            </div>
            <div className="stat">
              <div className="stat-label">Returned</div>
              <div className="stat-value text-paddy">{(byKind.returned || 0).toLocaleString()}</div>
              <div className="stat-foot text-faint">Reclaimed bags</div>
            </div>
          </div>

          <SectionHead label="Record movement" />
          <form className="card" onSubmit={submitBardana}>
            <div className="form-grid">
              <div className="field span-3">
                <label className="field-label">Date</label>
                <input className="input" type="date" value={bForm.date} onChange={e => setBField('date', e.target.value)} />
              </div>
              <div className="field span-4">
                <label className="field-label">Movement</label>
                <div className="segment">
                  {BARDANA_KINDS.map(k => (
                    <button key={k.id} type="button" className={bForm.kind === k.id ? 'on' : ''} onClick={() => setBField('kind', k.id)}>
                      {k.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field span-2">
                <label className="field-label">Bag count</label>
                <input className="input num" type="number" placeholder="0" value={bForm.qty} onChange={e => setBField('qty', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Party / Source</label>
                <input className="input" placeholder="Supplier, buyer or Stock" value={bForm.party} onChange={e => setBField('party', e.target.value)} />
              </div>
              <div className="field span-6">
                <label className="field-label">Notes</label>
                <input className="input" placeholder="Optional" value={bForm.notes} onChange={e => setBField('notes', e.target.value)} />
              </div>
            </div>
            <hr className="rule mt-4" />
            <div className="row between mt-3">
              <div className="text-soft" style={{ fontSize: 13 }}>
                {bForm.kind === 'old' ? 'Reduces stock by ' : 'Adds to stock: '}
                <strong className="mono">{bForm.qty || 0}</strong> bags
              </div>
              <button type="submit" className="btn btn-primary">
                <IcPlus style={{ width: 16, height: 16 }} /> Save
              </button>
            </div>
          </form>

          <SectionHead label="Movement log" meta={`${bardana.length} entries`} />
          <div className="card flush ledger-wrap">
            <table className="ledger">
              <thead>
                <tr><th>Date</th><th>Movement</th><th>Party</th><th>Notes</th><th>Bags</th></tr>
              </thead>
              <tbody>
                {bardana.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-soft" style={{ textAlign:'center', padding:'var(--s-6)' }}>No movements yet.</td>
                  </tr>
                )}
                {bardana.map(b => {
                  const k = BARDANA_KINDS.find(x => x.id === b.kind);
                  return (
                    <tr key={b.id}>
                      <td>{fmtDate(b.date)}</td>
                      <td><span className={`badge ${k?.tone || 'gold'}`}>{k?.name || b.kind}</span></td>
                      <td>{b.party || <span className="text-faint">—</span>}</td>
                      <td>{b.notes || <span className="text-faint">—</span>}</td>
                      <td className="num-cell" style={{ color: k?.sign === 1 ? 'var(--accent)' : 'var(--rust)', fontWeight: 700 }}>
                        {k?.sign === 1 ? '+' : '−'}{Number(b.qty).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── TAB: STOCK LOG ──────────────────────────────────────── */}
      {tab === 'log' && (
        <>
          <div className="row between mb-4" style={{ alignItems: 'center' }}>
            <SectionHead label="Manual stock additions" meta={`${additions.length} total entries`} />
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <IcPlus style={{ width: 16, height: 16 }} /> Add Stock
            </button>
          </div>

          {additions.length === 0 && (
            <div className="empty">No manual stock additions yet. Use "Add Stock" to record them.</div>
          )}

          <div className="card flush ledger-wrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Qty (qtl)</th>
                  <th>New Bags</th>
                  <th>Old Bags</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {additions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-soft" style={{ textAlign:'center', padding:'var(--s-6)' }}>
                      No entries yet.
                    </td>
                  </tr>
                )}
                {additions.map(a => {
                  const lbl = STOCK_PRODUCTS.find(p => p.id === a.product)?.label || a.product;
                  return (
                    <tr key={a.id}>
                      <td>{fmtDate(a.date)}</td>
                      <td style={{ fontWeight: 600 }}>{lbl}</td>
                      <td className="num-cell mono">{fmtQtl(a.qty)}</td>
                      <td className="num-cell">{a.newBagQty != null ? a.newBagQty : <span className="text-faint">—</span>}</td>
                      <td className="num-cell">{a.oldBagQty != null ? a.oldBagQty : <span className="text-faint">—</span>}</td>
                      <td><span className="badge">{a.source || 'manual'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showAdd && (
        <AddStockModal
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
          currentStock={stock}
        />
      )}
    </div>
  );
}
