import React, { useState, useMemo } from 'react';
import Masthead, { SectionHead } from '../components/Masthead';
import { useCollection } from '../hooks/useStore';
import { PURCHASE_PRODUCTS, fmtINR, fmtQtl, fmtDate } from '../data/constants';
import { IcPlus } from '../components/Icons';

const STAGES = ['estimate', 'lifting', 'gate_in', 'completed'];
const STAGE_LABELS = {
  estimate:  'Estimate',
  lifting:   'Lifting',
  gate_in:   'Gate In',
  completed: 'Completed',
};
const STAGE_COLORS = {
  estimate:  'gold',
  lifting:   'paddy',
  gate_in:   '',
  completed: 'paddy',
};
const SUPPLIER_TYPES = [
  { id: 'farmer', name: 'Farmer' },
  { id: 'warehouse', name: 'Warehouse' },
  { id: 'procurement_center', name: 'Procurement Center' },
  { id: 'external_supplier', name: 'External Supplier' },
];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthlyTarget() {
  try { return Number(localStorage.getItem('ajmeri.monthlyTarget') || 0); } catch { return 0; }
}
function setMonthlyTarget(v) {
  try { localStorage.setItem('ajmeri.monthlyTarget', String(v)); } catch {}
}

export default function PurchaseTracker() {
  const { items: records, create, edit } = useCollection('purchaseTracker');
  const { items: buyers }               = useCollection('buyers');

  const [tab, setTab]     = useState('overview');
  const [month, setMonth] = useState(currentMonth());
  const [target, setTarget] = useState(getMonthlyTarget);

  // New purchase form
  const [form, setForm] = useState({
    buyerName:     '',
    buyerId:       '',
    supplierType:  'farmer',
    sourceLocation:'',
    lotId:         '',
    product:       'paddy',
    estimatedQtl:  '',
    estimatedRate: '',
    grainSize:     '',
    purityPct:     '',
    weighmentLocation: '',
    notes:         '',
  });
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Inline advance-stage forms keyed by record id
  const [stageData, setStageData] = useState({});
  const setStageFld = (id, k, v) =>
    setStageData(s => ({ ...s, [id]: { ...(s[id] || {}), [k]: v } }));

  const monthRecords = useMemo(
    () => records.filter(r => r.month === month),
    [records, month]
  );

  const completedQtl = monthRecords
    .filter(r => r.stage === 'completed')
    .reduce((s, r) => s + (Number(r.actualQtl) || 0), 0);

  const pct = target > 0 ? Math.min(100, (completedQtl / target) * 100) : 0;

  const stageCounts = useMemo(() => {
    const counts = { estimate: 0, lifting: 0, gate_in: 0, completed: 0 };
    monthRecords.forEach(r => { if (counts[r.stage] !== undefined) counts[r.stage]++; });
    return counts;
  }, [monthRecords]);

  // Submit new purchase
  const submitNew = (e) => {
    e.preventDefault();
    if (!form.buyerName || !form.estimatedQtl) return alert('Buyer name and estimated qty required');
    create({
      month,
      buyerName:     form.buyerName,
      buyerId:       form.buyerId,
      supplierType:  form.supplierType,
      sourceLocation:form.sourceLocation,
      lotId:         form.lotId || `LOT-${Date.now().toString(36).toUpperCase()}`,
      product:       form.product,
      estimatedQtl:  Number(form.estimatedQtl),
      estimatedRate: Number(form.estimatedRate) || 0,
      grainSize:     form.grainSize,
      purityPct:     Number(form.purityPct) || 0,
      weighmentLocation: form.weighmentLocation,
      actualQtl: 0, actualRate: 0, moisturePct: 0,
      liftingDate: '', vehicleNumber: '', gateInAt: '',
      stage: 'estimate',
      notes: form.notes,
    });
    setForm({
      buyerName:'', buyerId:'', supplierType:'farmer', sourceLocation:'', lotId:'',
      product:'paddy', estimatedQtl:'', estimatedRate:'', grainSize:'', purityPct:'',
      weighmentLocation:'', notes:''
    });
  };

  // Advance stage
  const advanceStage = (rec) => {
    const sd      = stageData[rec.id] || {};
    const current = rec.stage;
    if (current === 'estimate') {
      if (!sd.actualQtl || !sd.liftingDate) return alert('Enter actual qty and lifting date');
      edit(rec.id, {
        stage:         'lifting',
        actualQtl:     Number(sd.actualQtl),
        actualRate:    Number(sd.actualRate) || 0,
        moisturePct:   Number(sd.moisturePct) || 0,
        liftingDate:   sd.liftingDate,
        vehicleNumber: sd.vehicleNumber || '',
      });
    } else if (current === 'lifting') {
      edit(rec.id, { stage: 'gate_in', gateInAt: new Date().toISOString(), notes: sd.notes || rec.notes });
    } else if (current === 'gate_in') {
      edit(rec.id, { stage: 'completed' });
    }
    setStageData(s => { const n = { ...s }; delete n[rec.id]; return n; });
  };

  const inProgress = monthRecords.filter(r => r.stage !== 'completed');
  const completed  = monthRecords.filter(r => r.stage === 'completed');

  const handleTargetChange = (v) => {
    setTarget(Number(v));
    setMonthlyTarget(Number(v));
  };

  const productLabel = (id) => PURCHASE_PRODUCTS.find(p => p.id === id)?.name || id || '—';

  return (
    <div className="page-enter">
      <Masthead title="Purchase Tracker" subtitle="5-stage paddy procurement workflow" />

      {/* Tab bar */}
      <div className="segment mb-5">
        {['overview', 'new', 'inprogress', 'completed'].map(t => (
          <button
            key={t}
            className={tab === t ? 'on' : ''}
            onClick={() => setTab(t)}
          >
            {t === 'overview' ? 'Overview' : t === 'new' ? 'New Purchase' : t === 'inprogress' ? 'In Progress' : 'Completed'}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW ────────────────────────────────── */}
      {tab === 'overview' && (
        <>
          <div className="card tight mb-4">
            <div className="form-grid">
              <div className="field span-3">
                <label className="field-label">Month</label>
                <input className="input" type="month" value={month} onChange={e => setMonth(e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Monthly Target (qtl)</label>
                <input
                  className="input num"
                  type="number"
                  placeholder="0"
                  value={target || ''}
                  onChange={e => handleTargetChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="row between mb-2">
              <div style={{ fontWeight: 600, fontSize: 15 }}>Completion Progress</div>
              <div className="mono" style={{ fontSize: 14, fontWeight: 700 }}>
                {fmtQtl(completedQtl)} / {fmtQtl(target)} qtl
              </div>
            </div>
            <div style={{ background: 'var(--surface-2)', borderRadius: 8, height: 14, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: pct >= 100 ? 'var(--accent)' : pct >= 70 ? 'var(--husk)' : 'var(--rust-soft)',
                borderRadius: 8,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div className="text-faint mt-2" style={{ fontSize: 12 }}>{pct.toFixed(1)}% of monthly target achieved</div>
          </div>

          <SectionHead label="Stage breakdown" meta={`${monthRecords.length} total records`} />
          <div className="grid grid-3">
            {STAGES.map(s => (
              <div className="stat" key={s}>
                <div className="stat-label">{STAGE_LABELS[s]}</div>
                <div className="stat-value">{stageCounts[s]}</div>
                <div className="stat-foot text-faint">records</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── NEW PURCHASE ─────────────────────────────── */}
      {tab === 'new' && (
        <>
          <SectionHead label="Create estimate" meta="Stage 1 of 4" />
          <form className="card" onSubmit={submitNew}>
            <div className="form-grid">
              {/* Buyer Name with datalist */}
              <div className="field span-4">
                <label className="field-label">Supplier Name</label>
                <input
                  className="input"
                  list="buyers-list-pt"
                  placeholder="Type or select buyer…"
                  value={form.buyerName}
                  onChange={e => {
                    const name  = e.target.value;
                    const match = buyers.find(b => b.name.toLowerCase() === name.toLowerCase());
                    if (match) setForm(f => ({ ...f, buyerId: match.id, buyerName: match.name }));
                    else       setForm(f => ({ ...f, buyerId: '',       buyerName: name }));
                  }}
                />
                <datalist id="buyers-list-pt">
                  {buyers.map(b => <option key={b.id} value={b.name} />)}
                </datalist>
              </div>

              {/* Product dropdown */}
              <div className="field span-3">
                <label className="field-label">Product</label>
                <select className="select" value={form.product} onChange={e => setField('product', e.target.value)}>
                  {PURCHASE_PRODUCTS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="field span-3">
                <label className="field-label">Supplier Type</label>
                <select className="select" value={form.supplierType} onChange={e => setField('supplierType', e.target.value)}>
                  {SUPPLIER_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="field span-2">
                <label className="field-label">Lot ID</label>
                <input className="input" placeholder="Auto if blank" value={form.lotId} onChange={e => setField('lotId', e.target.value)} />
              </div>

              <div className="field span-3">
                <label className="field-label">Estimated Qty (qtl)</label>
                <input className="input num" type="number" step="0.1" placeholder="0.00" value={form.estimatedQtl} onChange={e => setField('estimatedQtl', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Estimated Rate (₹/qtl)</label>
                <input className="input num" type="number" step="1" placeholder="0" value={form.estimatedRate} onChange={e => setField('estimatedRate', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Source Location</label>
                <input className="input" placeholder="Village, center, warehouse" value={form.sourceLocation} onChange={e => setField('sourceLocation', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Weighment Location</label>
                <input className="input" placeholder="Scale / weighbridge" value={form.weighmentLocation} onChange={e => setField('weighmentLocation', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Grain Size</label>
                <input className="input" placeholder="Long, medium, bold" value={form.grainSize} onChange={e => setField('grainSize', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Purity %</label>
                <input className="input num" type="number" step="0.1" placeholder="0.0" value={form.purityPct} onChange={e => setField('purityPct', e.target.value)} />
              </div>
              <div className="field span-12">
                <label className="field-label">Notes</label>
                <input className="input" placeholder="Optional remarks" value={form.notes} onChange={e => setField('notes', e.target.value)} />
              </div>
            </div>
            <div className="row between mt-4">
              <div className="text-faint" style={{ fontSize: 12 }}>Month: {month}</div>
              <button type="submit" className="btn btn-primary">
                <IcPlus style={{ width: 16, height: 16 }} /> Create Estimate
              </button>
            </div>
          </form>
        </>
      )}

      {/* ─── IN PROGRESS ──────────────────────────────── */}
      {tab === 'inprogress' && (
        <>
          <SectionHead label="Active records" meta={`${inProgress.length} in pipeline`} />
          {inProgress.length === 0 && (
            <div className="empty">No records in progress. Create a new purchase estimate first.</div>
          )}
          <div className="grid grid-2">
            {inProgress.map(rec => {
              const sd = stageData[rec.id] || {};
              return (
                <div key={rec.id} className="card">
                  <div className="row between mb-3">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>
                        {rec.buyerName || rec.farmerName || '—'}
                      </div>
                      <div className="row gap-2 mt-1">
                        <span className={`badge ${STAGE_COLORS[rec.stage]}`}>{STAGE_LABELS[rec.stage]}</span>
                        {rec.product && (
                          <span className="badge gold">{productLabel(rec.product)}</span>
                        )}
                        {rec.lotId && <span className="badge">{rec.lotId}</span>}
                      </div>
                      <div className="text-faint" style={{ fontSize: 12, marginTop: 4 }}>
                        {rec.month} {rec.supplierType ? `· ${SUPPLIER_TYPES.find(t => t.id === rec.supplierType)?.name || rec.supplierType}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="row gap-5 mb-3" style={{ fontSize: 13 }}>
                    <div><span className="text-soft">Est. Qty:</span> <span className="mono">{fmtQtl(rec.estimatedQtl)} qtl</span></div>
                    <div><span className="text-soft">Est. Rate:</span> <span className="mono">{fmtINR(rec.estimatedRate)}</span></div>
                    {rec.moisturePct > 0 && <div><span className="text-soft">Moisture:</span> <span className="mono">{rec.moisturePct}%</span></div>}
                  </div>
                  {(rec.sourceLocation || rec.weighmentLocation || rec.grainSize || rec.purityPct) && (
                    <div className="summary-strip" style={{ marginBottom: 12 }}>
                      <div className="ss-item"><span className="ss-label">Source</span><span className="ss-value" style={{ fontSize: 15 }}>{rec.sourceLocation || '-'}</span></div>
                      <div className="ss-item"><span className="ss-label">Weighment</span><span className="ss-value" style={{ fontSize: 15 }}>{rec.weighmentLocation || '-'}</span></div>
                      <div className="ss-item"><span className="ss-label">Grain</span><span className="ss-value" style={{ fontSize: 15 }}>{rec.grainSize || '-'}</span></div>
                      <div className="ss-item"><span className="ss-label">Purity</span><span className="ss-value" style={{ fontSize: 15 }}>{rec.purityPct ? `${rec.purityPct}%` : '-'}</span></div>
                    </div>
                  )}

                  {rec.stage === 'estimate' && (
                    <div className="form-grid" style={{ marginBottom: 12 }}>
                      <div className="field span-3">
                        <label className="field-label">Actual Qty (qtl)</label>
                        <input className="input num" type="number" step="0.1" placeholder="0.00" value={sd.actualQtl || ''} onChange={e => setStageFld(rec.id, 'actualQtl', e.target.value)} />
                      </div>
                      <div className="field span-3">
                        <label className="field-label">Actual Rate (₹)</label>
                        <input className="input num" type="number" step="1" placeholder="0" value={sd.actualRate || ''} onChange={e => setStageFld(rec.id, 'actualRate', e.target.value)} />
                      </div>
                      <div className="field span-3">
                        <label className="field-label">Moisture %</label>
                        <input className="input num" type="number" step="0.1" placeholder="0.0" value={sd.moisturePct || ''} onChange={e => setStageFld(rec.id, 'moisturePct', e.target.value)} />
                      </div>
                      <div className="field span-3">
                        <label className="field-label">Lifting Date</label>
                        <input className="input" type="date" value={sd.liftingDate || ''} onChange={e => setStageFld(rec.id, 'liftingDate', e.target.value)} />
                      </div>
                      <div className="field span-6">
                        <label className="field-label">Vehicle Number</label>
                        <input className="input" placeholder="e.g. HR-38-AB-1234" value={sd.vehicleNumber || ''} onChange={e => setStageFld(rec.id, 'vehicleNumber', e.target.value)} />
                      </div>
                    </div>
                  )}

                  {rec.stage === 'lifting' && (
                    <div className="field mb-3">
                      <label className="field-label">Gate-in notes (optional)</label>
                      <input className="input" placeholder="Quality check, bags count, etc." value={sd.notes || ''} onChange={e => setStageFld(rec.id, 'notes', e.target.value)} />
                    </div>
                  )}

                  {rec.stage === 'gate_in' && (
                    <div className="card tight" style={{ background: 'var(--accent-soft)', marginBottom: 12, fontSize: 13 }}>
                      Confirm gate-in and mark as completed.
                    </div>
                  )}

                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => advanceStage(rec)}>
                    Advance Stage →
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ─── COMPLETED ────────────────────────────────── */}
      {tab === 'completed' && (
        <>
          <SectionHead label="Completed purchases" meta={`${completed.length} records`} />
          {completed.length === 0 && (
            <div className="empty">No completed purchases yet for {month}.</div>
          )}
          <div className="card flush ledger-wrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Lifting Date</th>
                  <th>Lot ID</th>
                  <th>Buyer</th>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Est. Qtl</th>
                  <th>Actual Qtl</th>
                  <th>Rate (₹)</th>
                  <th>Purity %</th>
                  <th>Moisture %</th>
                  <th>Vehicle</th>
                </tr>
              </thead>
              <tbody>
                {completed.length === 0 && (
                  <tr><td colSpan={11} className="text-soft" style={{ textAlign:'center', padding:'var(--s-6)' }}>No completed records.</td></tr>
                )}
                {completed.map(r => (
                  <tr key={r.id}>
                    <td>{fmtDate(r.liftingDate)}</td>
                    <td className="mono">{r.lotId || '---'}</td>
                    <td style={{ fontWeight: 600 }}>{r.buyerName || r.farmerName || '—'}</td>
                    <td>{SUPPLIER_TYPES.find(t => t.id === r.supplierType)?.name || r.supplierType || '---'}</td>
                    <td><span className="badge gold">{productLabel(r.product)}</span></td>
                    <td className="num-cell">{fmtQtl(r.estimatedQtl)}</td>
                    <td className="num-cell" style={{ fontWeight: 700 }}>{fmtQtl(r.actualQtl)}</td>
                    <td className="num-cell">{fmtINR(r.actualRate)}</td>
                    <td className="num-cell">{r.purityPct ? `${r.purityPct}%` : '---'}</td>
                    <td className="num-cell">{r.moisturePct ? `${r.moisturePct}%` : '—'}</td>
                    <td className="mono">{r.vehicleNumber || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
