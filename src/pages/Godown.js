import React, { useMemo, useState } from 'react';
import Masthead, { SectionHead } from '../components/Masthead';
import { useCollection } from '../hooks/useStore';
import { BY_PRODUCTS, fmtQtl, fmtDate, todayISO } from '../data/constants';
import { IcGodown, IcPlus, IcPencil, IcSave, IcCheck, IcClose } from '../components/Icons';

/* ─── helpers ───────────────────────────────────────── */
function capacityBadge(pct) {
  if (pct > 90) return { cls: 'badge rust',  label: '⚠️ ALERT' };
  if (pct > 75) return { cls: 'badge gold',  label: '🟡 HIGH' };
  return          { cls: 'badge paddy', label: 'Normal' };
}

/* Per-godown + per-product tracker card with inline edit */
function GodownCard({ g, byprod, paddyIn, capacityPct, capacityBadgeInfo, onSave, onCancel, editing, editData, onEditChange }) {
  const totalStock = byprod.reduce((s, x) => s + x.qtl, 0) + paddyIn;

  return (
    <div className="card">
      <div className="row between mb-3">
        <div className="row gap-3">
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--accent-soft)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IcGodown style={{ width: 20, height: 20 }} />
          </div>
          {editing ? (
            <div style={{ flex: 1 }}>
              <input
                className="input"
                value={editData.name}
                onChange={e => onEditChange('name', e.target.value)}
                placeholder="Godown name"
                style={{ marginBottom: 6, fontSize: 16, fontWeight: 600 }}
              />
              <div className="row gap-2">
                <input
                  className="input num"
                  type="number"
                  step="1"
                  value={editData.capacityQtl}
                  onChange={e => onEditChange('capacityQtl', e.target.value)}
                  placeholder="Capacity (qtl)"
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={onSave} title="Save">
                  <IcSave style={{ width: 14, height: 14 }} />
                </button>
                <button className="btn btn-soft" onClick={onCancel} title="Cancel">
                  <IcClose style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{g.name}</div>
              <div className="text-faint" style={{ fontSize: 12 }}>
                {g.capacityQtl ? `Capacity: ${fmtQtl(g.capacityQtl)} qtl` : 'No capacity set'}
              </div>
            </div>
          )}
        </div>
        <div className="row gap-2">
          {!editing && <span className="badge paddy">Active</span>}
          {!editing && (
            <button className="btn btn-soft" onClick={onEditChange} title="Edit" style={{ padding: '6px 10px' }}>
              <IcPencil style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </div>

      {/* Capacity usage bar */}
      {g.capacityQtl > 0 && (
        <>
          <div className="row between mb-1" style={{ fontSize: 12 }}>
            <span className="text-soft">Usage</span>
            <span className="mono">
              {fmtQtl(totalStock)} / {fmtQtl(g.capacityQtl)} qtl
              {' · '}
              <span className={capacityBadgeInfo.cls.replace('badge ', '')} style={{ fontWeight: 600 }}>
                {capacityPct.toFixed(1)}%
              </span>
            </span>
          </div>
          <div style={{ background: 'var(--surface-2)', borderRadius: 8, height: 8, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{
              height: '100%',
              width: `${capacityPct}%`,
              background: capacityPct > 90 ? 'var(--rust)' : capacityPct > 75 ? 'var(--husk)' : 'var(--accent)',
              borderRadius: 8,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </>
      )}

      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--text-soft)' }}>
        Stock by product (qtl)
      </div>
      {byprod.map(bp => {
        const max = Math.max(1, ...byprod.map(x => x.qtl), paddyIn);
        const pct = (bp.qtl / max) * 100;
        return (
          <div className="stock-row" key={bp.id}>
            <div className="lbl">{bp.name}</div>
            <div className="meter">
              <span
                className={bp.id === 'rice' ? 'alt' : ''}
                style={{ width: `${Math.max(4, pct)}%` }}
              />
            </div>
            <div className="val">{fmtQtl(bp.qtl, 1)}</div>
          </div>
        );
      })}
      {paddyIn > 0 && (() => {
        const max = Math.max(1, ...byprod.map(x => x.qtl), paddyIn);
        const pct = (paddyIn / max) * 100;
        return (
          <div className="stock-row" key="__paddy__">
            <div className="lbl">Paddy</div>
            <div className="meter">
              <span style={{ width: `${Math.max(4, pct)}%` }} />
            </div>
            <div className="val">{fmtQtl(paddyIn, 1)}</div>
          </div>
        );
      })()}

      <hr className="rule mt-3" />
      <div className="row between mt-3" style={{ fontSize: 13 }}>
        <span className="text-soft">Total stock here</span>
        <span className="mono" style={{ fontWeight: 700 }}>{fmtQtl(totalStock)} qtl</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   GODOWN PAGE
   ════════════════════════════════════════════════════════ */
export default function Godown() {
  /* ─── existing collections ───────────────────────── */
  const { items: godowns, create: createGodown, edit: editGodown } = useCollection('godowns');
  const { items: purchases } = useCollection('purchases');
  const { items: milling }   = useCollection('milling');
  const { items: sales }     = useCollection('sales');
  const { items: additions } = useCollection('stockAdditions');

  /* ─── new collections ────────────────────────────── */
  const { items: bins,           create: createBin }           = useCollection('bins');
  const { items: stockTransfers, create: createTransfer }      = useCollection('stockTransfers');

  /* ─── tab state ──────────────────────────────────── */
  const [tab, setTab] = useState('godowns');

  /* ─── add-godown form ────────────────────────────── */
  const [gForm, setGForm] = useState({ name: '', capacityQtl: '' });
  const [gError, setGError] = useState('');
  const setGField = (k, v) => { setGForm(f => ({ ...f, [k]: v })); setGError(''); };

  /* ─── capacity edit state ─────────────────────────  */
  const [capacityEdits, setCapacityEdits] = useState({});

  /* ─── per-godown edit state ──────────────────────── */
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', capacityQtl: '' });

  const startEdit = (g) => {
    setEditingId(g.id);
    setEditData({ name: g.name || '', capacityQtl: g.capacityQtl ?? '' });
  };
  const setEditField = (k, v) => setEditData(d => ({ ...d, [k]: v }));
  const saveEdit = () => {
    if (!editData.name.trim()) return;
    editGodown(editingId, {
      name: editData.name.trim(),
      capacityQtl: Number(editData.capacityQtl) || 0,
    });
    setEditingId(null);
  };

  /* ─── bin form ───────────────────────────────────── */
  const [binForm, setBinForm] = useState({
    godownId: '', binCode: '', maxCapacityQtl: '', productName: '', currentQtl: '', status: 'active',
  });
  const setBinField = (k, v) => setBinForm(f => ({ ...f, [k]: v }));

  /* ─── transfer form ──────────────────────────────── */
  const [trForm, setTrForm] = useState({
    date: todayISO(), productName: '', qtl: '',
    fromGodownId: '', toGodownId: '', reason: '', notes: '',
  });
  const setTrField = (k, v) => setTrForm(f => ({ ...f, [k]: v }));

  /* ═══ Per-godown + per-product stock view ═════════ */
  const view = useMemo(() => {
    // Total paddy available = purchases + manual stockAdditions (paddy)
    const totalPaddyBought  = purchases.reduce((s, p) => s + (Number(p.qtl) || 0), 0);
    const totalPaddyAdded   = additions
      .filter(a => a.product === 'paddy')
      .reduce((s, a) => s + (Number(a.qty) || 0), 0);
    const totalPaddyIn      = totalPaddyBought + totalPaddyAdded;

    // Total finished goods (milling out + manual additions) and total sold
    const totalMillingOut = (id) => milling.reduce((s, m) => s + (Number(m[`${id}Qtl`]) || 0), 0);
    const totalAddOf = (id) => additions.filter(a => a.product === id).reduce((s, a) => s + (Number(a.qty) || 0), 0);
    const totalSoldOf = (id) => sales
      .filter(s => s.product === id)
      .reduce((sum, s) => {
        const q = Number(s.qty || 0);
        return sum + (s.unit === 'qtl' ? q : q * 0.5);
      }, 0);

    return godowns.map(g => {
      // Paddy share: by qty purchased into this godown (manual adds have no godownId yet)
      const paddyInThis = purchases
        .filter(p => p.godownId === g.id)
        .reduce((s, p) => s + (Number(p.qtl) || 0), 0);
      const sharePaddy = totalPaddyIn > 0 ? paddyInThis / totalPaddyIn : 0;

      // Per-product stock (rice, broken, rafi, bran, husk) — distributed by paddy share
      const byprod = BY_PRODUCTS.map(bp => {
        const produced = (totalMillingOut(bp.id) + totalAddOf(bp.id)) * sharePaddy;
        const sold     = totalSoldOf(bp.id) * sharePaddy;
        return { ...bp, qtl: Math.max(0, produced - sold) };
      });

      return { ...g, paddyIn: paddyInThis, byprod };
    });
  }, [godowns, purchases, milling, sales, additions]);

  /* ═══ Capacity tab: compute current stock from transfers ═══ */
  const godownCurrentStock = useMemo(() => {
    const map = {};
    godowns.forEach(g => { map[g.id] = 0; });
    stockTransfers.forEach(t => {
      const q = Number(t.qtl) || 0;
      if (map[t.toGodownId]   !== undefined) map[t.toGodownId]   += q;
      if (map[t.fromGodownId] !== undefined) map[t.fromGodownId] -= q;
    });
    return map;
  }, [godowns, stockTransfers]);

  /* ─── save capacity (tab) ───────────────────────── */
  const saveCapacity = (godownId) => {
    const cap = Number(capacityEdits[godownId]);
    if (!cap || isNaN(cap)) return;
    editGodown(godownId, { capacityQtl: cap });
    setCapacityEdits(s => { const n = { ...s }; delete n[godownId]; return n; });
  };

  /* ─── submit add godown ─────────────────────────── */
  const submitAddGodown = (e) => {
    e?.preventDefault();
    const name = gForm.name.trim();
    if (!name) { setGError('Name is required.'); return; }
    if (godowns.some(g => g.name.toLowerCase() === name.toLowerCase())) {
      setGError('A godown with this name already exists.');
      return;
    }
    createGodown({
      name,
      capacityQtl: Number(gForm.capacityQtl) || 0,
      createdAt: Date.now(),
    });
    setGForm({ name: '', capacityQtl: '' });
  };

  /* ─── submit bin ─────────────────────────────────── */
  const submitBin = (e) => {
    e.preventDefault();
    if (!binForm.godownId || !binForm.binCode || !binForm.maxCapacityQtl)
      return alert('Godown, bin code and max capacity are required');
    createBin({
      godownId: binForm.godownId,
      binCode: binForm.binCode,
      maxCapacityQtl: Number(binForm.maxCapacityQtl),
      currentQtl: Number(binForm.currentQtl) || 0,
      productName: binForm.productName,
      status: binForm.status,
    });
    setBinForm(f => ({ ...f, binCode: '', maxCapacityQtl: '', currentQtl: '', productName: '' }));
  };

  /* ─── submit transfer ────────────────────────────── */
  const submitTransfer = (e) => {
    e.preventDefault();
    if (!trForm.productName || !trForm.qtl || !trForm.fromGodownId || !trForm.toGodownId)
      return alert('Product, qty, from and to godown are required');
    if (trForm.fromGodownId === trForm.toGodownId)
      return alert('From and To godown must be different');
    createTransfer({
      date: trForm.date,
      productName: trForm.productName,
      qtl: Number(trForm.qtl),
      fromGodownId: trForm.fromGodownId,
      toGodownId: trForm.toGodownId,
      reason: trForm.reason,
      notes: trForm.notes,
    });
    setTrForm(f => ({
      ...f, productName: '', qtl: '', fromGodownId: '', toGodownId: '', reason: '', notes: '',
    }));
  };

  /* ─── bins grouped by godown ─────────────────────── */
  const binsByGodown = useMemo(() => {
    const map = {};
    godowns.forEach(g => { map[g.id] = { godown: g, bins: [] }; });
    bins.forEach(b => {
      if (map[b.godownId]) map[b.godownId].bins.push(b);
    });
    return Object.values(map);
  }, [godowns, bins]);

  /* ─── godown name lookup ─────────────────────────── */
  const godownName = (id) => godowns.find(g => g.id === id)?.name || id;

  return (
    <div className="page-enter">
      <Masthead title="Godown Stock" subtitle="Stock by location, capacity, bins, and transfers" />

      {/* Tab bar */}
      <div className="segment mb-5">
        {['godowns', 'capacity', 'bins', 'transfers'].map(t => (
          <button
            key={t}
            className={`seg-btn${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ═══ TAB: GODOWNS (existing UI + add form + edit) ═══════════════ */}
      {tab === 'godowns' && (
        <>
          {/* Inline Add Godown form */}
          <SectionHead label="Add godown" meta="Quick add — name & capacity" />
          <form className="card" onSubmit={submitAddGodown}>
            <div className="form-grid">
              <div className="field span-8">
                <label className="field-label">Godown name</label>
                <input
                  className="input"
                  placeholder="e.g. Old Mill Godown, Plot B Storage"
                  value={gForm.name}
                  onChange={e => setGField('name', e.target.value)}
                  autoFocus
                />
              </div>
              <div className="field span-4">
                <label className="field-label">Capacity (qtl)</label>
                <input
                  className="input num"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  value={gForm.capacityQtl}
                  onChange={e => setGField('capacityQtl', e.target.value)}
                />
              </div>
            </div>
            {gError && (
              <div style={{ color: 'var(--rust)', fontSize: 13, marginTop: 6 }}>{gError}</div>
            )}
            <div className="row between mt-4">
              <div className="text-faint" style={{ fontSize: 12 }}>
                <strong>{godowns.length}</strong> godown{godowns.length === 1 ? '' : 's'} configured
              </div>
              <button type="submit" className="btn btn-primary">
                <IcPlus style={{ width: 16, height: 16 }} /> Add Godown
              </button>
            </div>
          </form>

          <SectionHead label="By godown" meta="Live stock across locations" />

          {godowns.length === 0 ? (
            <div className="empty">
              No godowns yet. Use the form above to add your first one.
            </div>
          ) : (
            <div className="grid grid-2">
              {view.map(g => {
                const totalStock = g.byprod.reduce((s, x) => s + x.qtl, 0) + g.paddyIn;
                const cap = Number(g.capacityQtl ?? 0);
                const pct = cap > 0 ? Math.min(100, (totalStock / cap) * 100) : 0;
                const badge = capacityBadge(pct);
                const isEditing = editingId === g.id;
                return (
                  <GodownCard
                    key={g.id}
                    g={g}
                    byprod={g.byprod}
                    paddyIn={g.paddyIn}
                    capacityPct={pct}
                    capacityBadgeInfo={badge}
                    editing={isEditing}
                    editData={editData}
                    onEditChange={(...args) => {
                      if (args.length === 1) {
                        // called as startEdit (no field args from button)
                        startEdit(g);
                      } else {
                        const [k, v] = args;
                        setEditField(k, v);
                      }
                    }}
                    onSave={saveEdit}
                    onCancel={() => setEditingId(null)}
                  />
                );
              })}
            </div>
          )}

          <SectionHead label="FIFO ageing" meta="Coming next round" />
          <div className="empty">
            Lot-wise FIFO ageing view is on the roadmap. Purchase log already captures lot date and godown.
          </div>
        </>
      )}

      {/* ═══ TAB: CAPACITY ════════════════════════════ */}
      {tab === 'capacity' && (
        <>
          <SectionHead label="Godown capacity" meta="Edit capacity and track usage" />
          <div className="grid grid-2">
            {godowns.map(g => {
              const cap    = Number(capacityEdits[g.id] ?? g.capacityQtl ?? 0);
              const stockQ = godownCurrentStock[g.id] ?? 0;
              const usedPct = cap > 0 ? Math.min(100, (stockQ / cap) * 100) : 0;
              const badge  = capacityBadge(usedPct);
              return (
                <div key={g.id} className="card">
                  <div className="row between mb-3">
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{g.name}</div>
                    {cap > 0 && <span className={badge.cls}>{badge.label}</span>}
                  </div>

                  {/* Capacity input */}
                  <div className="field mb-3">
                    <label className="field-label">Capacity (qtl)</label>
                    <div className="row gap-3">
                      <input
                        className="input num"
                        type="number"
                        step="1"
                        placeholder="Enter capacity"
                        value={capacityEdits[g.id] ?? g.capacityQtl ?? ''}
                        onChange={e =>
                          setCapacityEdits(s => ({ ...s, [g.id]: e.target.value }))
                        }
                        style={{ flex: 1 }}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={() => saveCapacity(g.id)}
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Usage bar */}
                  {cap > 0 && (
                    <>
                      <div className="row between mb-1" style={{ fontSize: 13 }}>
                        <span className="text-soft">Current stock</span>
                        <span className="mono">{fmtQtl(stockQ)} / {fmtQtl(cap)} qtl</span>
                      </div>
                      <div style={{ background: 'var(--surface-2)', borderRadius: 8, height: 12, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${usedPct}%`,
                          background: usedPct > 90
                            ? 'var(--rust)'
                            : usedPct > 75
                              ? 'var(--husk)'
                              : 'var(--accent)',
                          borderRadius: 8,
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                      <div className="text-faint mt-1" style={{ fontSize: 12 }}>
                        {usedPct.toFixed(1)}% utilised
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {godowns.length === 0 && (
            <div className="empty">No godowns found. Add godowns above using the form on the Godowns tab.</div>
          )}
        </>
      )}

      {/* ═══ TAB: BINS ════════════════════════════════ */}
      {tab === 'bins' && (
        <>
          <SectionHead label="Add bin" />
          <form className="card" onSubmit={submitBin}>
            <div className="form-grid">
              <div className="field span-4">
                <label className="field-label">Godown</label>
                <select className="input select" value={binForm.godownId} onChange={e => setBinField('godownId', e.target.value)}>
                  <option value="">— Select godown —</option>
                  {godowns.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="field span-4">
                <label className="field-label">Bin Code</label>
                <input className="input" placeholder="e.g. A-01" value={binForm.binCode} onChange={e => setBinField('binCode', e.target.value)} />
              </div>
              <div className="field span-4">
                <label className="field-label">Max Capacity (qtl)</label>
                <input className="input num" type="number" step="0.1" placeholder="0.00" value={binForm.maxCapacityQtl} onChange={e => setBinField('maxCapacityQtl', e.target.value)} />
              </div>
              <div className="field span-4">
                <label className="field-label">Current Qty (qtl)</label>
                <input className="input num" type="number" step="0.1" placeholder="0.00" value={binForm.currentQtl} onChange={e => setBinField('currentQtl', e.target.value)} />
              </div>
              <div className="field span-4">
                <label className="field-label">Product Name</label>
                <input className="input" placeholder="e.g. Rice, Paddy" value={binForm.productName} onChange={e => setBinField('productName', e.target.value)} />
              </div>
              <div className="field span-4">
                <label className="field-label">Status</label>
                <select className="input select" value={binForm.status} onChange={e => setBinField('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="empty">Empty</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
            <div className="row between mt-4">
              <div />
              <button type="submit" className="btn btn-primary">
                <IcPlus style={{ width: 16, height: 16 }} /> Add Bin
              </button>
            </div>
          </form>

          <SectionHead label="Bins by godown" meta={`${bins.length} total bins`} />
          {binsByGodown.map(({ godown, bins: gBins }) => (
            gBins.length > 0 && (
              <div key={godown.id} style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: 'var(--text-soft)' }}>
                  {godown.name}
                </div>
                <div className="grid grid-3">
                  {gBins.map(b => {
                    const usedPct = b.maxCapacityQtl > 0
                      ? Math.min(100, (b.currentQtl / b.maxCapacityQtl) * 100)
                      : 0;
                    return (
                      <div key={b.id} className="card tight">
                        <div className="row between mb-2">
                          <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 15 }}>{b.binCode}</div>
                          <span className={`badge ${b.status === 'active' ? 'paddy' : b.status === 'empty' ? '' : 'gold'}`}>
                            {b.status}
                          </span>
                        </div>
                        <div className="text-soft" style={{ fontSize: 12, marginBottom: 6 }}>{b.productName || 'No product'}</div>
                        <div className="row between" style={{ fontSize: 13 }}>
                          <span>{fmtQtl(b.currentQtl)} / {fmtQtl(b.maxCapacityQtl)} qtl</span>
                          <span className="text-faint">{usedPct.toFixed(0)}%</span>
                        </div>
                        <div style={{ background: 'var(--surface-2)', borderRadius: 6, height: 8, overflow: 'hidden', marginTop: 6 }}>
                          <div style={{
                            height: '100%',
                            width: `${usedPct}%`,
                            background: usedPct > 90 ? 'var(--rust)' : 'var(--accent)',
                            borderRadius: 6,
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ))}
          {bins.length === 0 && (
            <div className="empty">No bins added yet. Create bins using the form above.</div>
          )}
        </>
      )}

      {/* ═══ TAB: TRANSFERS ═══════════════════════════ */}
      {tab === 'transfers' && (
        <>
          <SectionHead label="New transfer" />
          <form className="card" onSubmit={submitTransfer}>
            <div className="form-grid">
              <div className="field span-3">
                <label className="field-label">Date</label>
                <input className="input" type="date" value={trForm.date} onChange={e => setTrField('date', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Product</label>
                <input className="input" placeholder="e.g. Rice, Paddy, Bran" value={trForm.productName} onChange={e => setTrField('productName', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Qty (qtl)</label>
                <input className="input num" type="number" step="0.1" placeholder="0.00" value={trForm.qtl} onChange={e => setTrField('qtl', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Reason</label>
                <input className="input" placeholder="e.g. Space constraint" value={trForm.reason} onChange={e => setTrField('reason', e.target.value)} />
              </div>
              <div className="field span-6">
                <label className="field-label">From Godown</label>
                <select className="input select" value={trForm.fromGodownId} onChange={e => setTrField('fromGodownId', e.target.value)}>
                  <option value="">— Select source —</option>
                  {godowns.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="field span-6">
                <label className="field-label">To Godown</label>
                <select className="input select" value={trForm.toGodownId} onChange={e => setTrField('toGodownId', e.target.value)}>
                  <option value="">— Select destination —</option>
                  {godowns.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="field span-12">
                <label className="field-label">Notes</label>
                <input className="input" placeholder="Optional remarks" value={trForm.notes} onChange={e => setTrField('notes', e.target.value)} />
              </div>
            </div>
            <div className="row between mt-4">
              <div />
              <button type="submit" className="btn btn-primary">
                <IcPlus style={{ width: 16, height: 16 }} /> Record Transfer
              </button>
            </div>
          </form>

          <SectionHead label="Transfer ledger" meta={`${stockTransfers.length} transfers`} />
          <div className="card flush ledger-wrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Qty (qtl)</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {stockTransfers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-soft" style={{ textAlign: 'center', padding: 'var(--s-6)' }}>
                      No transfers recorded yet.
                    </td>
                  </tr>
                )}
                {stockTransfers.map(t => (
                  <tr key={t.id}>
                    <td>{fmtDate(t.date)}</td>
                    <td style={{ fontWeight: 600 }}>{t.productName}</td>
                    <td className="num-cell mono">{fmtQtl(t.qtl)}</td>
                    <td>{godownName(t.fromGodownId)}</td>
                    <td>{godownName(t.toGodownId)}</td>
                    <td className="text-soft">{t.reason || '—'}</td>
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
