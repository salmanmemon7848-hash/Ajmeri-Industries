import React, { useMemo, useState } from 'react';
import Masthead, { SectionHead } from '../components/Masthead';
import { useCollection } from '../hooks/useStore';
import { fmtINR, fmtDate, todayISO } from '../data/constants';
import Modal from '../components/Modal';
import { IcPlus, IcClose } from '../components/Icons';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const PAYMENT_MODES_LIST = ['Cash', 'UPI', 'Cheque', 'Other'];

export default function Payments() {
  const { items: buyers }   = useCollection('buyers');
  const { items: sales }    = useCollection('sales');
  const { items: payments, create: createPayment } = useCollection('payments');
  const { items: cheques,  create: createCheque, edit: editCheque } = useCollection('cheques');

  const [tab, setTab] = useState('ledger');
  const [month, setMonth] = useState(currentMonth());

  // ── Tab 1: Party Ledger ─────────────────────────────────────────────
  const [expandedBuyer, setExpandedBuyer] = useState(null);
  const [payModal, setPayModal] = useState(null); // buyerId or null

  const [payForm, setPayForm] = useState({
    date: todayISO(), amount: '', mode: 'Cash', ref: '', notes: '',
  });
  const setPayField = (k, v) => setPayForm(f => ({ ...f, [k]: v }));

  const buyerLedger = useMemo(() => buyers.map(b => {
    const totalSales = sales
      .filter(s => s.buyerId === b.id)
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const totalReceived = payments
      .filter(p => p.partyId === b.id && p.kind === 'receipt')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const bounced = payments
      .filter(p => p.partyId === b.id && p.kind === 'bounce')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const outstanding = totalSales - totalReceived + bounced;
    return { ...b, totalSales, totalReceived, bounced, outstanding };
  }), [buyers, sales, payments]);

  const submitPayment = (e) => {
    e?.preventDefault();
    if (!payForm.amount || Number(payForm.amount) <= 0) return alert('Enter valid amount');
    createPayment({
      date:      payForm.date,
      partyId:   payModal,
      partyKind: 'buyer',
      kind:      'receipt',
      amount:    Number(payForm.amount),
      mode:      payForm.mode,
      ref:       payForm.ref,
      notes:     payForm.notes,
    });
    setPayForm({ date: todayISO(), amount: '', mode: 'Cash', ref: '', notes: '' });
    setPayModal(null);
  };

  // ── Tab 2: Cheque Register ──────────────────────────────────────────
  const [chequeForm, setChequeForm] = useState({
    partyName:    '',
    partyId:      '',
    chequeNumber: '',
    bank:         '',
    chequeDate:   todayISO(),
    dueDate:      todayISO(),
    amount:       '',
    notes:        '',
  });
  const setChequeField = (k, v) => setChequeForm(f => ({ ...f, [k]: v }));

  const submitCheque = (e) => {
    e?.preventDefault();
    if (!chequeForm.amount || !chequeForm.chequeNumber) return alert('Cheque number and amount required');
    createCheque({
      partyId:      chequeForm.partyId,
      partyName:    chequeForm.partyName,
      number:       chequeForm.chequeNumber,
      bank:         chequeForm.bank,
      chequeDate:   chequeForm.chequeDate,
      dueDate:      chequeForm.dueDate,
      amount:       Number(chequeForm.amount),
      status:       'pending',
      notes:        chequeForm.notes,
    });
    setChequeForm({ partyName:'', partyId:'', chequeNumber:'', bank:'', chequeDate:todayISO(), dueDate:todayISO(), amount:'', notes:'' });
  };

  const updateChequeStatus = (cheque, newStatus) => {
    editCheque(cheque.id, { status: newStatus });
    if (newStatus === 'bounced') {
      // Add reversal record to bring amount back to outstanding
      createPayment({
        date:      todayISO(),
        partyId:   cheque.partyId,
        partyKind: 'buyer',
        kind:      'bounce',
        amount:    Number(cheque.amount),
        mode:      'Cheque',
        ref:       `Cheque ${cheque.number} bounced`,
        notes:     '',
      });
    }
  };

  const today = new Date();
  const isOverdue = (iso) => iso && new Date(iso) < today;

  const sortedCheques = [...cheques].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  // ── Tab 3: Payment Log ──────────────────────────────────────────────
  const monthPayments = useMemo(() =>
    payments.filter(p => p.date && p.date.startsWith(month)),
    [payments, month]
  );

  const buyerName = (id) => buyers.find(b => b.id === id)?.name || '—';

  return (
    <div className="page-enter">
      <Masthead title="Payments" subtitle="Udhaar ledger · Cheque register · Payment log" />

      {/* Tab bar */}
      <div className="pill-tabs">
        {[
          { id: 'ledger',  label: 'Party Ledger' },
          { id: 'cheques', label: 'Cheque Register' },
          { id: 'log',     label: 'Payment Log' },
        ].map(t => (
          <button key={t.id} className={`pill-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>


      {/* ─── TAB 1: PARTY LEDGER ─────────────────────────── */}
      {tab === 'ledger' && (
        <>
          <SectionHead label="Buyer outstanding" meta={`${buyers.length} buyers`} />
          {buyers.length === 0 && <div className="empty">No buyers yet. Add buyers first.</div>}
          {buyerLedger.map(b => (
            <div key={b.id} className="card" style={{ marginBottom: 12 }}>
              <div
                className="row between"
                style={{ cursor: 'pointer' }}
                onClick={() => setExpandedBuyer(expandedBuyer === b.id ? null : b.id)}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{b.name}</div>
                  <div className="text-faint" style={{ fontSize: 12 }}>
                    Sales: {fmtINR(b.totalSales)} · Received: {fmtINR(b.totalReceived)}
                  </div>
                </div>
                <div className="row gap-3" style={{ alignItems: 'center' }}>
                  <span
                    className={`badge ${b.outstanding <= 0 ? 'paddy' : 'rust'}`}
                    style={{ fontSize: 13 }}
                  >
                    {b.outstanding <= 0 ? '✓ Paid' : `Outstanding: ${fmtINR(b.outstanding)}`}
                  </span>
                  <button
                    className="btn btn-primary"
                    onClick={e => { e.stopPropagation(); setPayModal(b.id); }}
                  >
                    <IcPlus style={{ width: 14, height: 14 }} /> Record Payment
                  </button>
                </div>
              </div>

              {/* Expanded transaction history */}
              {expandedBuyer === b.id && (
                <div style={{ marginTop: 16 }}>
                  <div className="card flush ledger-wrap">
                    <table className="ledger">
                      <thead>
                        <tr><th>Date</th><th>Type</th><th>Mode</th><th>Ref</th><th>Amount</th></tr>
                      </thead>
                      <tbody>
                        {payments.filter(p => p.partyId === b.id).length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-soft" style={{ textAlign:'center', padding:'var(--s-4)' }}>
                              No payment records.
                            </td>
                          </tr>
                        )}
                        {payments.filter(p => p.partyId === b.id).map(p => (
                          <tr key={p.id}>
                            <td>{fmtDate(p.date)}</td>
                            <td>
                              <span className={`badge ${p.kind === 'receipt' ? 'paddy' : 'rust'}`}>
                                {p.kind === 'receipt' ? 'Receipt' : 'Bounce'}
                              </span>
                            </td>
                            <td>{p.mode || '—'}</td>
                            <td>{p.ref || <span className="text-faint">—</span>}</td>
                            <td className="num-cell" style={{ fontWeight: 700, color: p.kind === 'bounce' ? 'var(--danger)' : 'inherit' }}>
                              {p.kind === 'bounce' ? '+' : ''}{fmtINR(p.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* ─── TAB 2: CHEQUE REGISTER ──────────────────────── */}
      {tab === 'cheques' && (
        <>
          <SectionHead label="New Cheque" />
          <form className="card" onSubmit={submitCheque}>
            <div className="form-grid">
              <div className="field span-6">
                <label className="field-label">Party (Buyer)</label>
                <input
                  className="input"
                  list="buyers-list-chq"
                  placeholder="Type buyer name…"
                  value={chequeForm.partyName}
                  onChange={e => {
                    const name  = e.target.value;
                    const match = buyers.find(b => b.name.toLowerCase() === name.toLowerCase());
                    setChequeForm(f => ({ ...f, partyName: name, partyId: match ? match.id : '' }));
                  }}
                />
                <datalist id="buyers-list-chq">
                  {buyers.map(b => <option key={b.id} value={b.name} />)}
                </datalist>
              </div>
              <div className="field span-3">
                <label className="field-label">Cheque Number</label>
                <input className="input" placeholder="123456" value={chequeForm.chequeNumber} onChange={e => setChequeField('chequeNumber', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Bank Name</label>
                <input className="input" placeholder="SBI, HDFC…" value={chequeForm.bank} onChange={e => setChequeField('bank', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Cheque Date</label>
                <input className="input" type="date" value={chequeForm.chequeDate} onChange={e => setChequeField('chequeDate', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Due Date</label>
                <input className="input" type="date" value={chequeForm.dueDate} onChange={e => setChequeField('dueDate', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Amount (₹)</label>
                <input className="input num" type="number" placeholder="0" value={chequeForm.amount} onChange={e => setChequeField('amount', e.target.value)} />
              </div>
              <div className="field span-12">
                <label className="field-label">Notes</label>
                <input className="input" placeholder="Optional" value={chequeForm.notes} onChange={e => setChequeField('notes', e.target.value)} />
              </div>
            </div>
            <hr className="rule mt-4" />
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
              <button type="submit" className="btn btn-primary">
                <IcPlus style={{ width: 16, height: 16 }} /> Add Cheque
              </button>
            </div>
          </form>

          <SectionHead label="Cheque calendar" meta="By due date" />
          {sortedCheques.length === 0 && <div className="empty">No cheques logged yet.</div>}
          <div className="grid grid-2">
            {sortedCheques.map(c => {
              const over = isOverdue(c.dueDate) && c.status === 'pending';
              return (
                <div
                  key={c.id}
                  className="card tight"
                  style={{ borderLeft: `3px solid ${over ? 'var(--danger)' : 'var(--accent)'}` }}
                >
                  <div className="row between mb-2">
                    <div className="text-soft" style={{ fontSize: 12 }}>{c.bank} · No. {c.number}</div>
                    <div className="row gap-2">
                      {over && <span className="badge rust dot">OVERDUE</span>}
                      <span className={`badge ${c.status === 'cleared' ? 'paddy' : c.status === 'bounced' ? 'rust' : 'gold'}`}>
                        {c.status === 'cleared' ? 'Cleared' : c.status === 'bounced' ? 'Bounced' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="row between mt-2">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{c.partyName || buyerName(c.partyId)}</div>
                      <div className="text-faint" style={{ fontSize: 12 }}>Due {fmtDate(c.dueDate)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{fmtINR(c.amount)}</div>
                      {c.status === 'pending' && (
                        <div className="row gap-2 mt-2">
                          <button className="btn btn-soft" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => updateChequeStatus(c, 'cleared')}>
                            ✓ Cleared
                          </button>
                          <button className="btn btn-soft" style={{ fontSize: 12, padding: '4px 10px', color: 'var(--danger)' }} onClick={() => updateChequeStatus(c, 'bounced')}>
                            ✕ Bounced
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ─── TAB 3: PAYMENT LOG ──────────────────────────── */}
      {tab === 'log' && (
        <>
          <div className="row between mb-4" style={{ alignItems: 'center' }}>
            <SectionHead label="All payment entries" meta={`${monthPayments.length} this month`} />
            <input className="input" type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 160 }} />
          </div>
          {monthPayments.length === 0 && <div className="empty">No payments for this month.</div>}
          <div className="card flush ledger-wrap">
            <table className="ledger">
              <thead>
                <tr><th>Date</th><th>Party</th><th>Mode</th><th>Amount</th><th>Type</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {monthPayments.length === 0 && (
                  <tr><td colSpan={6} className="text-soft" style={{ textAlign:'center', padding:'var(--s-6)' }}>No entries.</td></tr>
                )}
                {monthPayments.map(p => (
                  <tr key={p.id}>
                    <td>{fmtDate(p.date)}</td>
                    <td style={{ fontWeight: 600 }}>{buyerName(p.partyId)}</td>
                    <td>{p.mode || '—'}</td>
                    <td className="num-cell" style={{ fontWeight: 700 }}>{fmtINR(p.amount)}</td>
                    <td>
                      <span className={`badge ${p.kind === 'receipt' ? 'paddy' : 'rust'}`}>
                        {p.kind === 'receipt' ? 'Receipt' : 'Bounce'}
                      </span>
                    </td>
                    <td>{p.notes || <span className="text-faint">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── Record Payment Modal ─────────────────────────── */}
      {payModal && (
        <Modal
          title="Record Payment"
          kicker={`Buyer: ${buyers.find(b => b.id === payModal)?.name || ''}`}
          onClose={() => setPayModal(null)}
          footer={
            <>
              <button className="btn btn-soft" onClick={() => setPayModal(null)}>
                <IcClose style={{ width: 16, height: 16 }} /> Cancel
              </button>
              <button className="btn btn-primary" onClick={submitPayment}>
                <IcPlus style={{ width: 16, height: 16 }} /> Save
              </button>
            </>
          }
        >
          <form className="form-grid" onSubmit={submitPayment}>
            <div className="field span-6">
              <label className="field-label">Date</label>
              <input className="input" type="date" value={payForm.date} onChange={e => setPayField('date', e.target.value)} />
            </div>
            <div className="field span-6">
              <label className="field-label">Amount (₹)</label>
              <input className="input num" type="number" step="1" placeholder="0" value={payForm.amount} onChange={e => setPayField('amount', e.target.value)} autoFocus />
            </div>
            <div className="field span-6">
              <label className="field-label">Mode</label>
              <div className="segment" style={{ flexWrap: 'wrap' }}>
                {PAYMENT_MODES_LIST.map(m => (
                  <button key={m} type="button" className={payForm.mode === m ? 'on' : ''} onClick={() => setPayField('mode', m)}>{m}</button>
                ))}
              </div>
            </div>
            <div className="field span-6">
              <label className="field-label">Reference / Notes</label>
              <input className="input" placeholder="UTR, cheque no., remarks…" value={payForm.ref} onChange={e => setPayField('ref', e.target.value)} />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
