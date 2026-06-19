import React from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { IcMill, IcCoin, IcSack, IcCheque } from './Icons';

const ACTIONS = [
  { to: '/milling',  label: 'Milling batch',    sub: 'Paddy in, rice out',        Icon: IcMill },
  { to: '/bag-cut',  label: 'Bag cut or lot',   sub: 'Track bags and dispatch',   Icon: IcSack },
  { to: '/sales',    label: 'Sale or dispatch', sub: 'Buyer order and bill',      Icon: IcCoin },
  { to: '/bardana',  label: 'Bag movement',     sub: 'New, old, or returned bag', Icon: IcSack },
  { to: '/payments', label: 'Payment or cheque',sub: 'Receipt, udhaar, or PDC',   Icon: IcCheque },
];

export default function QuickAdd({ onClose }) {
  const navigate = useNavigate();
  return (
    <Modal title="Quick add" kicker="Choose an entry" onClose={onClose}>
      <div className="grid grid-2">
        {ACTIONS.map(a => (
          <button
            key={a.to}
            className="card tight"
            onClick={() => { onClose?.(); navigate(a.to); }}
            style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
          >
            <div className="qnc-icon">
              <a.Icon style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{a.label}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>{a.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
