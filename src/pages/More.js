import React from 'react';
import { useNavigate } from 'react-router-dom';
import Masthead, { SectionHead } from '../components/Masthead';
import { NAV } from '../data/constants';
import { IcLedger, IcMill, IcCoin, IcSack, IcGodown, IcCheque, IcChart, IcPeople, IcHardHat } from '../components/Icons';

const ICON = {
  dashboard: IcLedger, milling: IcMill, sales: IcCoin,
  customers: IcPeople, bardana: IcSack, godown: IcGodown,
  payments: IcCheque, reports: IcChart, machinery: IcHardHat,
  bagcut: IcSack,
};

export default function More() {
  const navigate = useNavigate();
  return (
    <div className="page-enter">
      <Masthead title="All sections" subtitle="Navigate to any page" />
      <SectionHead label="Sections" meta={`${NAV.length} pages`} />
      <div className="grid grid-2">
        {NAV.map(n => {
          const Icon = ICON[n.id] || IcLedger;
          return (
            <button key={n.id} className="card tight" onClick={() => navigate(n.path)} style={{
              textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 20, height: 20 }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{n.label}</div>
                <div className="text-faint" style={{ fontSize: 12 }}>{n.section}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
