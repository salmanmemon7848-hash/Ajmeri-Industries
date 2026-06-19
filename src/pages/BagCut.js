import React, { useMemo, useState } from 'react';
import Masthead, { SectionHead } from '../components/Masthead';
import { useCollection } from '../hooks/useStore';
import { BY_PRODUCTS, STOCK_PRODUCTS, fmtQtl, fmtDate, todayISO } from '../data/constants';
import { IcPlus, IcSack, IcSearch } from '../components/Icons';

const OPERATIONS = [
  { id: 'receipt', name: 'Receipt bag cut', hint: 'Paddy arrived from supplier' },
  { id: 'milling', name: 'Milling issue', hint: 'Bags opened for milling batch' },
  { id: 'dispatch', name: 'Dispatch packing', hint: 'Finished goods loaded out' },
  { id: 'repack', name: 'Repack / correction', hint: 'Damaged or adjusted bags' },
];

const BAG_WEIGHTS = [25, 50, 75];

function productName(id) {
  return BY_PRODUCTS.find(p => p.id === id)?.name
    || STOCK_PRODUCTS.find(p => p.id === id)?.label
    || id
    || 'Product';
}

function operationName(id) {
  return OPERATIONS.find(o => o.id === id)?.name || id;
}

function makeLotId() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  return `BAG-${ymd}-${String(d.getTime()).slice(-5)}`;
}

export default function BagCut() {
  const { items: bagCuts, create } = useCollection('bagCuts');
  const { items: purchaseLots } = useCollection('purchaseTracker');
  const { items: godowns } = useCollection('godowns');

  const knownLots = useMemo(() => {
    const map = new Map();
    purchaseLots.forEach(lot => {
      if (!lot.lotId) return;
      map.set(lot.lotId, {
        lotId: lot.lotId,
        party: lot.buyerName || lot.supplierName || 'Supplier',
        product: lot.product || 'paddy',
        qtl: Number(lot.actualQtl || lot.estimatedQtl || 0),
        stage: lot.stage || 'estimate',
        source: lot.sourceLocation || lot.weighmentLocation || '',
      });
    });
    bagCuts.forEach(row => {
      if (!row.lotId || map.has(row.lotId)) return;
      map.set(row.lotId, {
        lotId: row.lotId,
        party: row.supervisor || 'Manual entry',
        product: row.product,
        qtl: Number(row.netQtl || 0),
        stage: row.operation,
        source: row.godownName || '',
      });
    });
    return Array.from(map.values()).sort((a, b) => a.lotId.localeCompare(b.lotId));
  }, [purchaseLots, bagCuts]);

  const [query, setQuery] = useState('');
  const [form, setForm] = useState({
    date: todayISO(),
    operation: 'receipt',
    lotId: '',
    product: 'paddy',
    godownId: '',
    bagWeightKg: '50',
    totalBags: '',
    cutBags: '',
    rejectedBags: '',
    supervisor: '',
    vehicleNumber: '',
    reason: '',
    notes: '',
  });

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const computed = useMemo(() => {
    const totalBags = Number(form.totalBags) || 0;
    const cutBags = Number(form.cutBags) || 0;
    const rejectedBags = Number(form.rejectedBags) || 0;
    const bagWeightKg = Number(form.bagWeightKg) || 50;
    const netBags = Math.max(0, totalBags - cutBags - rejectedBags);
    const netQtl = (netBags * bagWeightKg) / 100;
    const lossQtl = ((cutBags + rejectedBags) * bagWeightKg) / 100;
    const lossPct = totalBags > 0 ? ((cutBags + rejectedBags) / totalBags) * 100 : 0;
    return { totalBags, cutBags, rejectedBags, bagWeightKg, netBags, netQtl, lossQtl, lossPct };
  }, [form]);

  const filteredLots = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return knownLots.slice(0, 8);
    return knownLots.filter(l =>
      l.lotId.toLowerCase().includes(q)
      || (l.party || '').toLowerCase().includes(q)
      || productName(l.product).toLowerCase().includes(q)
    ).slice(0, 12);
  }, [knownLots, query]);

  const stats = useMemo(() => {
    const todayRows = bagCuts.filter(row => row.date === todayISO());
    const totalNetBags = bagCuts.reduce((sum, row) => sum + (Number(row.netBags) || 0), 0);
    const totalLossQtl = bagCuts.reduce((sum, row) => sum + (Number(row.lossQtl) || 0), 0);
    const dispatchBags = bagCuts
      .filter(row => row.operation === 'dispatch')
      .reduce((sum, row) => sum + (Number(row.netBags) || 0), 0);
    return {
      todayCount: todayRows.length,
      totalNetBags,
      totalLossQtl,
      dispatchBags,
      activeLots: new Set(knownLots.map(l => l.lotId)).size,
    };
  }, [bagCuts, knownLots]);

  const selectLot = (lot) => {
    setForm(f => ({
      ...f,
      lotId: lot.lotId,
      product: lot.product || f.product,
    }));
  };

  const submit = (event) => {
    event?.preventDefault();
    if (!form.lotId.trim()) return alert('Enter or select a lot ID');
    if (!computed.totalBags) return alert('Enter total bags');
    const godown = godowns.find(g => g.id === form.godownId);
    create({
      date: form.date,
      operation: form.operation,
      lotId: form.lotId.trim() || makeLotId(),
      product: form.product,
      godownId: form.godownId,
      godownName: godown?.name || '',
      bagWeightKg: computed.bagWeightKg,
      totalBags: computed.totalBags,
      cutBags: computed.cutBags,
      rejectedBags: computed.rejectedBags,
      netBags: computed.netBags,
      netQtl: Number(computed.netQtl.toFixed(2)),
      lossQtl: Number(computed.lossQtl.toFixed(2)),
      lossPct: Number(computed.lossPct.toFixed(2)),
      supervisor: form.supervisor,
      vehicleNumber: form.vehicleNumber,
      reason: form.reason,
      notes: form.notes,
    });
    setForm(f => ({
      ...f,
      lotId: '',
      totalBags: '',
      cutBags: '',
      rejectedBags: '',
      supervisor: '',
      vehicleNumber: '',
      reason: '',
      notes: '',
    }));
  };

  return (
    <div className="page-enter">
      <Masthead
        title="Bag Cut & Lot Trace"
        subtitle="Track bags, cuts, rejected bags, godown movement, and lot continuity"
      />

      <div className="grid grid-4 mb-5">
        <div className="stat">
          <div className="stat-label">Today entries</div>
          <div className="stat-value">{stats.todayCount}</div>
          <div className="stat-foot">Bag cut records</div>
        </div>
        <div className="stat gold">
          <div className="stat-label">Net bags tracked</div>
          <div className="stat-value">{stats.totalNetBags}</div>
          <div className="stat-foot">Across all lots</div>
        </div>
        <div className="stat">
          <div className="stat-label">Dispatch bags</div>
          <div className="stat-value">{stats.dispatchBags}</div>
          <div className="stat-foot">Packed out</div>
        </div>
        <div className="stat">
          <div className="stat-label">Cut loss</div>
          <div className="stat-value">{fmtQtl(stats.totalLossQtl, 1)}<span className="unit"> qtl</span></div>
          <div className="stat-foot">{stats.activeLots} active lot references</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: 'var(--s-4)' }}>
        <div>
          <SectionHead label="New bag cut entry" meta="Lot -> bags -> net qtl" />
          <form className="card" onSubmit={submit}>
            <div className="form-grid">
              <div className="field span-3">
                <label className="field-label">Date</label>
                <input className="input" type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Operation</label>
                <select className="select" value={form.operation} onChange={e => setField('operation', e.target.value)}>
                  {OPERATIONS.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
                </select>
              </div>
              <div className="field span-3">
                <label className="field-label">Lot ID</label>
                <input
                  className="input"
                  list="bagcut-lots"
                  placeholder={makeLotId()}
                  value={form.lotId}
                  onChange={e => setField('lotId', e.target.value)}
                />
                <datalist id="bagcut-lots">
                  {knownLots.map(lot => <option key={lot.lotId} value={lot.lotId}>{lot.party}</option>)}
                </datalist>
              </div>
              <div className="field span-3">
                <label className="field-label">Product</label>
                <select className="select" value={form.product} onChange={e => setField('product', e.target.value)}>
                  <option value="paddy">Paddy</option>
                  {BY_PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="field span-3">
                <label className="field-label">Godown</label>
                <select className="select" value={form.godownId} onChange={e => setField('godownId', e.target.value)}>
                  <option value="">Select godown</option>
                  {godowns.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="field span-3">
                <label className="field-label">Bag weight</label>
                <select className="select" value={form.bagWeightKg} onChange={e => setField('bagWeightKg', e.target.value)}>
                  {BAG_WEIGHTS.map(w => <option key={w} value={w}>{w} kg</option>)}
                  <option value="100">100 kg</option>
                </select>
              </div>
              <div className="field span-2">
                <label className="field-label">Total bags</label>
                <input className="input num" type="number" inputMode="numeric" min="0" value={form.totalBags} onChange={e => setField('totalBags', e.target.value)} />
              </div>
              <div className="field span-2">
                <label className="field-label">Cut bags</label>
                <input className="input num" type="number" inputMode="numeric" min="0" value={form.cutBags} onChange={e => setField('cutBags', e.target.value)} />
              </div>
              <div className="field span-2">
                <label className="field-label">Rejected</label>
                <input className="input num" type="number" inputMode="numeric" min="0" value={form.rejectedBags} onChange={e => setField('rejectedBags', e.target.value)} />
              </div>

              <div className="field span-4">
                <label className="field-label">Supervisor</label>
                <input className="input" placeholder="Operator / staff name" value={form.supervisor} onChange={e => setField('supervisor', e.target.value)} />
              </div>
              <div className="field span-4">
                <label className="field-label">Vehicle number</label>
                <input className="input" placeholder="Optional truck / gate pass" value={form.vehicleNumber} onChange={e => setField('vehicleNumber', e.target.value)} />
              </div>
              <div className="field span-4">
                <label className="field-label">Reason</label>
                <input className="input" placeholder="Quality cut, leakage, repack" value={form.reason} onChange={e => setField('reason', e.target.value)} />
              </div>
              <div className="field span-12">
                <label className="field-label">Notes</label>
                <input className="input" placeholder="Optional remarks" value={form.notes} onChange={e => setField('notes', e.target.value)} />
              </div>
            </div>

            <div className="bagcut-preview mt-4">
              <div>
                <span className="small-caps">Net bags</span>
                <strong>{computed.netBags}</strong>
              </div>
              <div>
                <span className="small-caps">Net qtl</span>
                <strong>{fmtQtl(computed.netQtl, 2)}</strong>
              </div>
              <div>
                <span className="small-caps">Cut loss</span>
                <strong>{fmtQtl(computed.lossQtl, 2)} qtl</strong>
              </div>
              <div>
                <span className="small-caps">Loss rate</span>
                <strong>{computed.lossPct.toFixed(1)}%</strong>
              </div>
            </div>

            <div className="row between mt-4 wrap">
              <div className="text-faint" style={{ fontSize: 12 }}>
                {OPERATIONS.find(op => op.id === form.operation)?.hint}
              </div>
              <button type="submit" className="btn btn-primary">
                <IcPlus style={{ width: 16, height: 16 }} /> Save Bag Cut
              </button>
            </div>
          </form>
        </div>

        <div>
          <SectionHead label="Lot finder" meta={`${knownLots.length} lots`} />
          <div className="card">
            <div className="field">
              <label className="field-label">Search lots</label>
              <div className="input-with-icon">
                <IcSearch />
                <input className="input" placeholder="Lot, supplier, product" value={query} onChange={e => setQuery(e.target.value)} />
              </div>
            </div>
            <div className="lot-list">
              {filteredLots.length === 0 && <div className="empty">No lots found yet.</div>}
              {filteredLots.map(lot => (
                <button type="button" className="lot-pick" key={lot.lotId} onClick={() => selectLot(lot)}>
                  <div className="lot-pick-icon"><IcSack /></div>
                  <div>
                    <strong>{lot.lotId}</strong>
                    <span>{lot.party} | {productName(lot.product)} | {fmtQtl(lot.qtl, 1)} qtl</span>
                  </div>
                  <em>{lot.stage}</em>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SectionHead label="Traceability ledger" meta={`${bagCuts.length} bag cut records`} />
      <div className="card flush ledger-wrap">
        <table className="ledger">
          <thead>
            <tr>
              <th>Date</th>
              <th>Lot</th>
              <th>Operation</th>
              <th>Product</th>
              <th>Godown</th>
              <th>Bags</th>
              <th>Net qtl</th>
              <th>Loss</th>
              <th>Vehicle</th>
            </tr>
          </thead>
          <tbody>
            {bagCuts.length === 0 && (
              <tr>
                <td colSpan={9} className="text-soft" style={{ textAlign: 'center', padding: 'var(--s-6)' }}>
                  No bag cut records yet.
                </td>
              </tr>
            )}
            {bagCuts.map(row => (
              <tr key={row.id}>
                <td>{fmtDate(row.date)}</td>
                <td className="mono">{row.lotId}</td>
                <td><span className={`badge ${row.operation === 'dispatch' ? 'paddy' : row.operation === 'repack' ? 'gold' : ''}`}>{operationName(row.operation)}</span></td>
                <td>{productName(row.product)}</td>
                <td>{row.godownName || <span className="text-faint">-</span>}</td>
                <td className="num-cell">{row.netBags} / {row.totalBags}</td>
                <td className="num-cell">{fmtQtl(row.netQtl)}</td>
                <td className="num-cell">{fmtQtl(row.lossQtl)} qtl</td>
                <td>{row.vehicleNumber || <span className="text-faint">-</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
