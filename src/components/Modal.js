import React, { useEffect } from 'react';
import './Modal.css';
import { IcClose } from './Icons';

export default function Modal({ title, kicker, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            {kicker && <div className="modal-kicker">{kicker}</div>}
            <h3>{title}</h3>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <IcClose style={{ width: 20, height: 20 }} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
