import React, { useCallback, useMemo, useState } from 'react';
import Masthead, { SectionHead } from '../components/Masthead';
import { useCollection } from '../hooks/useStore';
import { fmtINR, fmtDate, todayISO } from '../data/constants';
import { IcPlus, IcHardHat } from '../components/Icons';

export default function Workers() {
  const { items: workers, create: createWorker } = useCollection('workers');
  const { items: payments, create: createPayment } = useCollection('workerPayments');

  const [tab, setTab] = useState('list');
  const [selectedId, setSelectedId] = useState(null);

  const [wForm, setWForm] = useState({ name: '', phone: '', address: '', dailyRate: '' });
  const [pForm, setPForm] = useState({ workerId: '', date: todayISO(), kind: 'advance', amount: '', daysWorked: '', notes: '' });

  const setWField = (k, v) => setWForm(f => ({ ...f, [k]: v }));
  const setPField = (k, v) => setPForm(f => ({ ...f, [k]: v }));

  const submitWorker = (e) => {
    e?.preventDefault();
    if (!wForm.name.trim()) return alert('Enter worker name');
    if (!wForm.dailyRate || Number(wForm.dailyRate) <= 0) return alert('Enter a valid daily rate');
    createWorker({ name: wForm.name.trim(), phone: wForm.phone.trim(), address: wForm.address.trim(), dailyRate: Number(wForm.dailyRate) });
    setWForm({ name: '', phone: '', address: '', dailyRate: '' });
  };

  const submitPayment = (e) => {
    e?.preventDefault();
    if (!pForm.workerId) return alert('Select a worker');
    if (!pForm.amount || Number(pForm.amount) <= 0) return alert('Enter payment amount');
    createPayment({
      workerId: pForm.workerId,
      date: pForm.date,
      kind: pForm.kind,
      amount: Number(pForm.amount),
      daysWorked: pForm.kind === 'salary' ? Number(pForm.daysWorked) || 0 : 0,
      notes: pForm.notes.trim(),
    });
    setPForm(f => ({ ...f, amount: '', daysWorked: '', notes: '' }));
  };

  const getWorkerPayments = (wId) => payments.filter(p => p.workerId === wId);
  const totalPaid = (wId) => getWorkerPayments(wId).reduce((s, p) => s + Number(p.amount || 0), 0);

  const selected = workers.find(w => w.id === selectedId);
  const selectedPayments = selected ? getWorkerPayments(selected.id).slice().sort((a, b) => b.date.localeCompare(a.date)) : [];

  const currentMonth = todayISO().slice(0, 7);
  const monthPayments = (wId) => getWorkerPayments(wId).filter(p => p.date.startsWith(currentMonth));
  const monthAdvances = useCallback((wId) => monthPayments(wId).filter(p => p.kind === 'advance').reduce((s, p) => s + Number(p.amount || 0), 0), [payments, currentMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const computedSalary = useMemo(() => {
    if (!pForm.workerId || pForm.kind !== 'salary') return 0;
    const w = workers.find(x => x.id === pForm.workerId);
    if (!w) return 0;
    return (Number(pForm.daysWorked) || 0) * w.dailyRate;
  }, [pForm.workerId, pForm.kind, pForm.daysWorked, workers]);

  const pendingAfterAdvances = useMemo(() => {
    if (!pForm.workerId || pForm.kind !== 'salary') return 0;
    return Math.max(0, computedSalary - monthAdvances(pForm.workerId));
  }, [computedSalary, pForm.workerId, pForm.kind, monthAdvances]);

  return (
    <div className="page-enter">
      <Masthead title="Workers" subtitle="Manage staff wages and payments" />

      <div className="segment mb-5">
        <button className={tab === 'list' ? 'on' : ''} onClick={() => setTab('list')}>Worker list</button>
        <button className={tab === 'add' ? 'on' : ''} onClick={() => setTab('add')}>Add worker</button>
        <button className={tab === 'pay' ? 'on' : ''} onClick={() => setTab('pay')}>Log payment</button>
      </div>

      {tab === 'add' && (
        <>
          <SectionHead label="Add new worker" />
          <form className="card" onSubmit={submitWorker}>
            <div className="form-grid">
              <div className="field span-6">
                <label className="field-label">Name</label>
                <input className="input" placeholder="Worker name" value={wForm.name} onChange={(e) => setWField('name', e.target.value)} />
              </div>
              <div className="field span-6">
                <label className="field-label">Phone</label>
                <input className="input" type="tel" inputMode="numeric" placeholder="10-digit mobile" value={wForm.phone} onChange={(e) => setWField('phone', e.target.value)} />
              </div>
              <div className="field span-6">
                <label className="field-label">Address / Village</label>
                <input className="input" placeholder="Village, district" value={wForm.address} onChange={(e) => setWField('address', e.target.value)} />
              </div>
              <div className="field span-6">
                <label className="field-label">Daily wage rate (₹/day)</label>
                <input className="input num" type="number" step="1" placeholder="0" value={wForm.dailyRate} onChange={(e) => setWField('dailyRate', e.target.value)} />
              </div>
            </div>
            <hr className="rule mt-4" />
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="submit" className="btn btn-primary"><IcPlus style={{ width: 16, height: 16 }} /> Add Worker</button>
            </div>
          </form>
        </>
      )}

      {tab === 'pay' && (
        <>
          <SectionHead label="Log payment" meta="Advance or monthly salary" />
          <form className="card" onSubmit={submitPayment}>
            <div className="form-grid">
              <div className="field span-4">
                <label className="field-label">Worker</label>
                <select className="select" value={pForm.workerId} onChange={(e) => setPField('workerId', e.target.value)}>
                  <option value="">— Select worker —</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="field span-4">
                <label className="field-label">Date</label>
                <input className="input" type="date" value={pForm.date} onChange={(e) => setPField('date', e.target.value)} />
              </div>
              <div className="field span-4">
                <label className="field-label">Payment type</label>
                <div className="segment">
                  <button type="button" className={pForm.kind === 'advance' ? 'on' : ''} onClick={() => setPField('kind', 'advance')}>Advance</button>
                  <button type="button" className={pForm.kind === 'salary' ? 'on' : ''} onClick={() => setPField('kind', 'salary')}>Monthly salary</button>
                </div>
              </div>

              {pForm.kind === 'salary' && (
                <div className="field span-6">
                  <label className="field-label">Days worked this month</label>
                  <input className="input num" type="number" step="1" placeholder="0" value={pForm.daysWorked} onChange={(e) => setPField('daysWorked', e.target.value)} />
                  {pForm.workerId && (
                    <div className="card tight mt-3" style={{ background: 'var(--surface-2)' }}>
                      <div className="row between" style={{ fontSize: 13 }}>
                        <span className="text-soft">Gross wages</span>
                        <span className="mono" style={{ fontWeight: 600 }}>{fmtINR(computedSalary)}</span>
                      </div>
                      <div className="row between" style={{ fontSize: 13, marginTop: 4 }}>
                        <span className="text-soft">Advances this month</span>
                        <span className="mono" style={{ color: 'var(--rust)' }}>−{fmtINR(monthAdvances(pForm.workerId))}</span>
                      </div>
                      <hr className="rule mt-2 mb-2" />
                      <div className="row between" style={{ fontSize: 14, fontWeight: 700 }}>
                        <span>Net to pay</span>
                        <span className="mono" style={{ color: 'var(--accent)' }}>{fmtINR(pendingAfterAdvances)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className={pForm.kind === 'salary' ? 'field span-6' : 'field span-6'}>
                <label className="field-label">Amount paid (₹)</label>
                <input className="input num" type="number" step="1" placeholder="0" value={pForm.amount} onChange={(e) => setPField('amount', e.target.value)} />
                {pForm.kind === 'salary' && pendingAfterAdvances > 0 && (
                  <button type="button" className="field-hint" style={{ color: 'var(--accent)', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}
                    onClick={() => setPField('amount', String(pendingAfterAdvances))}>
                    Fill net to pay ↑
                  </button>
                )}
              </div>

              <div className="field span-12">
                <label className="field-label">Notes</label>
                <input className="input" placeholder="Optional remarks" value={pForm.notes} onChange={(e) => setPField('notes', e.target.value)} />
              </div>
            </div>
            <hr className="rule mt-4" />
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="submit" className="btn btn-primary"><IcPlus style={{ width: 16, height: 16 }} /> Record Payment</button>
            </div>
          </form>
        </>
      )}

      {tab === 'list' && (
        <>
          <div className="grid grid-3 mb-5">
            <div className="stat">
              <div className="stat-label">Total workers</div>
              <div className="stat-value">{workers.length}</div>
              <div className="stat-foot text-faint">on payroll</div>
            </div>
            <div className="stat gold">
              <div className="stat-label">Paid this month</div>
              <div className="stat-value">₹{fmtINR(payments.filter(p => p.date.startsWith(currentMonth)).reduce((s, p) => s + Number(p.amount || 0), 0), { short: true }).replace('₹','')}</div>
              <div className="stat-foot">{payments.filter(p => p.date.startsWith(currentMonth)).length} payments</div>
            </div>
            <div className="stat gold">
              <div className="stat-label">Total paid (all time)</div>
              <div className="stat-value">₹{fmtINR(payments.reduce((s, p) => s + Number(p.amount || 0), 0), { short: true }).replace('₹','')}</div>
              <div className="stat-foot">{payments.length} transactions</div>
            </div>
          </div>

          {workers.length === 0 ? (
            <div className="empty">No workers added yet. Use the "Add worker" tab to add your first worker.</div>
          ) : (
            <div className="grid grid-2">
              {workers.map(w => {
                const thisMonthPaid = monthPayments(w.id).reduce((s, p) => s + Number(p.amount || 0), 0);
                const isSelected = selectedId === w.id;
                return (
                  <div key={w.id}>
                    <div
                      className="card tight"
                      style={{ cursor: 'pointer', borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent' }}
                      onClick={() => setSelectedId(isSelected ? null : w.id)}
                    >
                      <div className="row between">
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{w.name}</div>
                          <div className="text-faint" style={{ fontSize: 12, marginTop: 2 }}>{w.address || '—'} · {w.phone || '—'}</div>
                        </div>
                        <IcHardHat style={{ width: 20, height: 20, color: 'var(--text-soft)' }} />
                      </div>
                      <div className="row between mt-3" style={{ fontSize: 13 }}>
                        <div>
                          <div className="text-soft">Daily rate</div>
                          <div className="mono" style={{ fontWeight: 600 }}>{fmtINR(w.dailyRate)}/day</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="text-soft">This month paid</div>
                          <div className="mono" style={{ fontWeight: 600, color: 'var(--accent)' }}>{fmtINR(thisMonthPaid)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="text-soft">All time paid</div>
                          <div className="mono" style={{ fontWeight: 600 }}>{fmtINR(totalPaid(w.id))}</div>
                        </div>
                      </div>
                    </div>

                    {isSelected && selectedPayments.length > 0 && (
                      <div className="card flush ledger-wrap" style={{ marginTop: 4 }}>
                        <table className="ledger">
                          <thead>
                            <tr><th>Date</th><th>Type</th><th>Days</th><th>Amount</th><th>Notes</th></tr>
                          </thead>
                          <tbody>
                            {selectedPayments.map(p => (
                              <tr key={p.id}>
                                <td>{fmtDate(p.date)}</td>
                                <td><span className={`badge ${p.kind === 'salary' ? 'paddy' : 'gold'}`}>{p.kind === 'salary' ? 'Salary' : 'Advance'}</span></td>
                                <td className="num-cell">{p.daysWorked || <span className="text-faint">—</span>}</td>
                                <td className="num-cell" style={{ fontWeight: 700 }}>{fmtINR(p.amount)}</td>
                                <td>{p.notes || <span className="text-faint">—</span>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {isSelected && selectedPayments.length === 0 && (
                      <div className="empty" style={{ margin: '4px 0 0' }}>No payments recorded for {w.name} yet.</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
