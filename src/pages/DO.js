import React, { useMemo, useState } from 'react';
import Masthead, { SectionHead } from '../components/Masthead';
import { useCollection } from '../hooks/useStore';
import { fmtQtl, fmtDate, todayISO } from '../data/constants';
import { IcPlus } from '../components/Icons';

export default function DO() {
  const { items: doOrders, create: createDO, edit: editDO } = useCollection('deliveryOrders');
  const { items: liftings, create: createLifting }          = useCollection('doLiftings');
  const { create: addStock }                                = useCollection('stockAdditions');

  const [tab, setTab] = useState('new');

  // ── Tab 1: New DO form ──────────────────────────────────────────────
  const [doForm, setDoForm] = useState({
    date:            todayISO(),
    doNumber:        '',
    shortagePerTrip: 2,
    notes:           '',
  });
  const [samitis, setSamitis] = useState([{ samitiName: '', allocatedQtl: '' }]);

  const setDoField = (k, v) => setDoForm(f => ({ ...f, [k]: v }));

  const addSamitiRow = () => setSamitis(s => [...s, { samitiName: '', allocatedQtl: '' }]);
  const updateSamiti = (i, k, v) =>
    setSamitis(s => s.map((row, idx) => idx === i ? { ...row, [k]: v } : row));
  const removeSamiti = (i) =>
    setSamitis(s => s.filter((_, idx) => idx !== i));

  const submitDO = (e) => {
    e?.preventDefault();
    if (!doForm.doNumber) return alert('Enter DO Number');
    if (samitis.some(s => !s.samitiName || !s.allocatedQtl)) return alert('Fill all Samiti rows');
    createDO({
      date:            doForm.date,
      doNumber:        doForm.doNumber,
      shortagePerTrip: Number(doForm.shortagePerTrip) || 2,
      samitis:         samitis.map(s => ({ samitiName: s.samitiName, allocatedQtl: Number(s.allocatedQtl) })),
      status:          'active',
      notes:           doForm.notes,
    });
    setDoForm({ date: todayISO(), doNumber: '', shortagePerTrip: 2, notes: '' });
    setSamitis([{ samitiName: '', allocatedQtl: '' }]);
  };

  // ── Tab 2: Log Lifting ──────────────────────────────────────────────
  const activeDOs = useMemo(() => doOrders.filter(d => d.status === 'active'), [doOrders]);

  const [liftForm, setLiftForm] = useState({
    doId:          '',
    samitiName:    '',
    vehicleNumber: '',
    driverName:    '',
    enteredQtl:    '',
    actualQtl:     '',
    notes:         '',
  });
  const setLiftField = (k, v) => setLiftForm(f => ({ ...f, [k]: v }));

  const selectedDO = useMemo(() =>
    doOrders.find(d => d.id === liftForm.doId),
    [doOrders, liftForm.doId]
  );

  const shortage = useMemo(() => {
    const actual  = Number(liftForm.actualQtl  || 0);
    const entered = Number(liftForm.enteredQtl || 0);
    return actual - entered;
  }, [liftForm.actualQtl, liftForm.enteredQtl]);

  const shortageExceeds = selectedDO && shortage < -(Number(selectedDO.shortagePerTrip) || 2);

  const submitLifting = (e) => {
    e?.preventDefault();
    if (!liftForm.doId || !liftForm.samitiName) return alert('Select DO and Samiti');
    if (!liftForm.enteredQtl || !liftForm.actualQtl) return alert('Enter both Entered and Actual qty');

    const rec = createLifting({
      doId:          liftForm.doId,
      date:          todayISO(),
      samitiName:    liftForm.samitiName,
      vehicleNumber: liftForm.vehicleNumber,
      driverName:    liftForm.driverName,
      enteredQtl:    Number(liftForm.enteredQtl),
      actualQtl:     Number(liftForm.actualQtl),
      shortage:      shortage,
      notes:         liftForm.notes,
    });

    // Add entered qty to mill paddy stock
    addStock({
      date:      todayISO(),
      product:   'paddy_sarna',
      qty:       Number(liftForm.enteredQtl),
      newBagQty: 0,
      oldBagQty: 0,
      source:    'do_lifting',
      doId:      liftForm.doId,
      doLiftingId: rec.id,
    });

    setLiftForm(f => ({ ...f, vehicleNumber:'', driverName:'', enteredQtl:'', actualQtl:'', notes:'' }));
  };

  // ── Tab 3: DO Status ────────────────────────────────────────────────
  const getLiftingsForDO = (doId) => liftings.filter(l => l.doId === doId);

  const markComplete = (doId) => {
    editDO(doId, { status: 'completed' });
  };

  // ── Tab 4: Lifting Log ──────────────────────────────────────────────
  const [filterDoId, setFilterDoId] = useState('');
  const filteredLiftings = useMemo(() =>
    filterDoId ? liftings.filter(l => l.doId === filterDoId) : liftings,
    [liftings, filterDoId]
  );

  const doLabel = (id) => {
    const d = doOrders.find(x => x.id === id);
    return d ? `DO ${d.doNumber}` : id;
  };

  return (
    <div className="page-enter">
      <Masthead title="DO Management" subtitle="Delivery Order tracking · Samiti lifting · Shortage log" />

      {/* Tab bar */}
      <div className="segment mb-5">
        {[
          { id: 'new',     label: 'New DO' },
          { id: 'lifting', label: 'Log Lifting' },
          { id: 'status',  label: 'DO Status' },
          { id: 'log',     label: 'Lifting Log' },
        ].map(t => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: NEW DO ──────────────────────────────── */}
      {tab === 'new' && (
        <>
          <SectionHead label="Create Delivery Order" />
          <form className="card" onSubmit={submitDO}>
            <div className="form-grid">
              <div className="field span-3">
                <label className="field-label">Date</label>
                <input className="input" type="date" value={doForm.date} onChange={e => setDoField('date', e.target.value)} />
              </div>
              <div className="field span-5">
                <label className="field-label">DO Number</label>
                <input className="input" placeholder="e.g. DO-2024-001" value={doForm.doNumber} onChange={e => setDoField('doNumber', e.target.value)} />
              </div>
              <div className="field span-4">
                <label className="field-label">Shortage Tolerance / Trip (Qtl)</label>
                <input className="input num" type="number" step="0.5" value={doForm.shortagePerTrip} onChange={e => setDoField('shortagePerTrip', e.target.value)} />
              </div>
            </div>

            <hr className="rule mt-4 mb-4" />
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Samiti Allocations</div>

            {samitis.map((row, i) => (
              <div key={i} className="form-grid mb-3" style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 12 }}>
                <div className="field span-6">
                  <label className="field-label">Samiti Name</label>
                  <input className="input" placeholder="e.g. Gram Samiti Raipur" value={row.samitiName} onChange={e => updateSamiti(i, 'samitiName', e.target.value)} />
                </div>
                <div className="field span-4">
                  <label className="field-label">Allocated Qtl</label>
                  <input className="input num" type="number" step="0.1" placeholder="0.00" value={row.allocatedQtl} onChange={e => updateSamiti(i, 'allocatedQtl', e.target.value)} />
                </div>
                <div className="field span-2" style={{ alignSelf: 'flex-end' }}>
                  {samitis.length > 1 && (
                    <button type="button" className="btn btn-soft" style={{ width: '100%' }} onClick={() => removeSamiti(i)}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button type="button" className="btn btn-soft" onClick={addSamitiRow} style={{ marginBottom: 16 }}>
              <IcPlus style={{ width: 14, height: 14 }} /> Add Samiti
            </button>

            <div className="field span-12">
              <label className="field-label">Notes</label>
              <input className="input" placeholder="Optional" value={doForm.notes} onChange={e => setDoField('notes', e.target.value)} />
            </div>

            <hr className="rule mt-4" />
            <div className="row between mt-3">
              <div className="text-faint" style={{ fontSize: 13 }}>
                {samitis.length} samiti(s) · Total: {fmtQtl(samitis.reduce((s, r) => s + (Number(r.allocatedQtl) || 0), 0))} qtl
              </div>
              <button type="submit" className="btn btn-primary">
                <IcPlus style={{ width: 16, height: 16 }} /> Create DO
              </button>
            </div>
          </form>

          {doOrders.length === 0 && <div className="empty mt-4">No DOs created yet.</div>}
        </>
      )}

      {/* ─── TAB 2: LOG LIFTING ─────────────────────────── */}
      {tab === 'lifting' && (
        <>
          <SectionHead label="Log a lifting trip" />
          {activeDOs.length === 0 && (
            <div className="empty">No active DOs. Create one first.</div>
          )}
          <form className="card" onSubmit={submitLifting}>
            <div className="form-grid">
              <div className="field span-6">
                <label className="field-label">Select DO</label>
                <select className="select" value={liftForm.doId} onChange={e => setLiftField('doId', e.target.value)}>
                  <option value="">— Select active DO —</option>
                  {activeDOs.map(d => (
                    <option key={d.id} value={d.id}>DO {d.doNumber} · {fmtDate(d.date)}</option>
                  ))}
                </select>
              </div>

              <div className="field span-6">
                <label className="field-label">Samiti</label>
                <select className="select" value={liftForm.samitiName} onChange={e => setLiftField('samitiName', e.target.value)} disabled={!selectedDO}>
                  <option value="">— Select samiti —</option>
                  {(selectedDO?.samitis || []).map(s => (
                    <option key={s.samitiName} value={s.samitiName}>{s.samitiName}</option>
                  ))}
                </select>
              </div>

              <div className="field span-3">
                <label className="field-label">Vehicle No.</label>
                <input className="input" placeholder="HR-38-AB-1234" value={liftForm.vehicleNumber} onChange={e => setLiftField('vehicleNumber', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Driver Name</label>
                <input className="input" placeholder="Driver name" value={liftForm.driverName} onChange={e => setLiftField('driverName', e.target.value)} />
              </div>

              <div className="field span-3">
                <label className="field-label">Entered Qty (Qtl)</label>
                <input className="input num" type="number" step="0.1" placeholder="0.00" value={liftForm.enteredQtl} onChange={e => setLiftField('enteredQtl', e.target.value)} />
                <div className="text-faint" style={{ fontSize: 11, marginTop: 4 }}>Written on paper</div>
              </div>
              <div className="field span-3">
                <label className="field-label">Actual Qty (Qtl)</label>
                <input className="input num" type="number" step="0.1" placeholder="0.00" value={liftForm.actualQtl} onChange={e => setLiftField('actualQtl', e.target.value)} />
                <div className="text-faint" style={{ fontSize: 11, marginTop: 4 }}>Physically loaded</div>
              </div>

              {/* Shortage preview */}
              {liftForm.enteredQtl && liftForm.actualQtl && (
                <div className="field span-6">
                  <div
                    className="card tight"
                    style={{
                      background: shortageExceeds ? 'var(--danger-soft, #fff0f0)' : 'var(--accent-soft)',
                      border: `1px solid ${shortageExceeds ? 'var(--danger)' : 'var(--line)'}`,
                      padding: 12,
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      Shortage: <span style={{ color: shortage < 0 ? 'var(--danger)' : 'var(--accent)' }}>
                        {shortage >= 0 ? '+' : ''}{fmtQtl(shortage)} qtl
                      </span>
                    </div>
                    {shortageExceeds && (
                      <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>
                        ⚠ Shortage of {fmtQtl(Math.abs(shortage))} qtl exceeds tolerance of {selectedDO?.shortagePerTrip} qtl
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="field span-12">
                <label className="field-label">Notes</label>
                <input className="input" placeholder="Optional" value={liftForm.notes} onChange={e => setLiftField('notes', e.target.value)} />
              </div>
            </div>
            <hr className="rule mt-4" />
            <div className="row between mt-3">
              <div className="text-faint" style={{ fontSize: 12 }}>Saving will add entered qty to paddy stock automatically.</div>
              <button type="submit" className="btn btn-primary">
                <IcPlus style={{ width: 16, height: 16 }} /> Log Lifting
              </button>
            </div>
          </form>
        </>
      )}

      {/* ─── TAB 3: DO STATUS ───────────────────────────── */}
      {tab === 'status' && (
        <>
          <SectionHead label="Active DOs" meta={`${activeDOs.length} open`} />
          {activeDOs.length === 0 && <div className="empty">No active DOs.</div>}
          <div className="grid grid-2">
            {activeDOs.map(d => {
              const doLiftings = getLiftingsForDO(d.id);
              const totalTrips = doLiftings.length;
              return (
                <div key={d.id} className="card">
                  <div className="row between mb-3">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>DO {d.doNumber}</div>
                      <div className="text-faint" style={{ fontSize: 12 }}>{fmtDate(d.date)} · {totalTrips} trips</div>
                    </div>
                    <span className="badge paddy">Active</span>
                  </div>

                  {(d.samitis || []).map(s => {
                    const lifted  = doLiftings
                      .filter(l => l.samitiName === s.samitiName)
                      .reduce((sum, l) => sum + (Number(l.enteredQtl) || 0), 0);
                    const remaining = Math.max(0, s.allocatedQtl - lifted);
                    const pct       = s.allocatedQtl > 0 ? Math.min(100, (lifted / s.allocatedQtl) * 100) : 0;
                    return (
                      <div key={s.samitiName} style={{ marginBottom: 12 }}>
                        <div className="row between" style={{ fontSize: 13, marginBottom: 4 }}>
                          <strong>{s.samitiName}</strong>
                          <span className="text-faint">{fmtQtl(lifted)} / {fmtQtl(s.allocatedQtl)} qtl</span>
                        </div>
                        <div style={{ background: 'var(--surface-2)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: pct >= 100 ? 'var(--accent)' : 'var(--husk, #c8a84b)',
                            borderRadius: 6,
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                        <div className="text-faint" style={{ fontSize: 11, marginTop: 3 }}>
                          Remaining: {fmtQtl(remaining)} qtl
                        </div>
                      </div>
                    );
                  })}

                  <button className="btn btn-soft" style={{ width: '100%', marginTop: 8 }} onClick={() => markComplete(d.id)}>
                    ✓ Mark Complete
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ─── TAB 4: LIFTING LOG ─────────────────────────── */}
      {tab === 'log' && (
        <>
          <div className="row between mb-4" style={{ alignItems: 'center' }}>
            <SectionHead label="Lifting log" meta={`${liftings.length} trips`} />
            <select className="select" value={filterDoId} onChange={e => setFilterDoId(e.target.value)} style={{ width: 240 }}>
              <option value="">All DOs</option>
              {doOrders.map(d => (
                <option key={d.id} value={d.id}>DO {d.doNumber}</option>
              ))}
            </select>
          </div>

          {filteredLiftings.length === 0 && <div className="empty">No lifting records found.</div>}

          <div className="card flush ledger-wrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Date</th><th>DO No.</th><th>Samiti</th>
                  <th>Vehicle</th><th>Driver</th>
                  <th>Entered Qtl</th><th>Actual Qtl</th><th>Shortage</th>
                </tr>
              </thead>
              <tbody>
                {filteredLiftings.length === 0 && (
                  <tr><td colSpan={8} className="text-soft" style={{ textAlign:'center', padding:'var(--s-6)' }}>No records.</td></tr>
                )}
                {filteredLiftings.map(l => {
                  return (
                    <tr key={l.id}>
                      <td>{fmtDate(l.date)}</td>
                      <td style={{ fontWeight: 600 }}>{doLabel(l.doId)}</td>
                      <td>{l.samitiName}</td>
                      <td className="mono">{l.vehicleNumber || '—'}</td>
                      <td>{l.driverName || '—'}</td>
                      <td className="num-cell">{fmtQtl(l.enteredQtl)}</td>
                      <td className="num-cell">{fmtQtl(l.actualQtl)}</td>
                      <td className="num-cell" style={{ color: l.shortage < -2 ? 'var(--danger)' : 'var(--accent)', fontWeight: 700 }}>
                        {l.shortage >= 0 ? '+' : ''}{fmtQtl(l.shortage)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
