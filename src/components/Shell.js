import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { NAV, BOTTOM_NAV } from '../data/constants';
import { hasSupabase } from '../lib/supabase';
import {
  IcLedger, IcTruck, IcMill, IcSack, IcPlus, IcMore,
  IcCheque, IcGodown, IcChart, IcPeople, IcCoin, IcHardHat, IcReceipt,
} from './Icons';

const ICON_FOR = {
  dashboard: IcLedger,
  milling: IcMill,
  sales: IcCoin,
  customers: IcPeople,
  bardana: IcSack,
  godown: IcGodown,
  payments: IcCheque,
  workers: IcHardHat,
  expenses: IcReceipt,
  reports: IcChart,
  stock: IcGodown,
  purchasetracker: IcTruck,
  damage: IcChart,
  hamali: IcHardHat,
  transport: IcTruck,
  do: IcTruck,
  machinery: IcMill,
  bagcut: IcSack,
};

const BN_ICON = {
  dashboard: IcLedger,
  purchasetracker: IcTruck,
  bagcut: IcSack,
  more: IcMore,
};

function groupBySection(items) {
  const map = new Map();
  for (const item of items) {
    if (!map.has(item.section)) map.set(item.section, []);
    map.get(item.section).push(item);
  }
  return Array.from(map.entries());
}

export default function Shell({ children, onQuickAdd }) {
  const navigate = useNavigate();
  const loc = useLocation();
  const grouped = groupBySection(NAV);
  const syncLabel = hasSupabase() ? 'Cloud synced' : 'Local mode';

  return (
    <div className="app">
      <header className="mobile-topbar">
        <div className="mobile-brand">
          <div className="mobile-brand-icon">AI</div>
          <div>
            <div className="mobile-brand-name">Ajmeri Industries</div>
            <div className="mobile-brand-mode">{syncLabel}</div>
          </div>
        </div>
        <button className="mobile-quick" type="button" aria-label="Quick add" onClick={onQuickAdd}>
          <IcPlus />
        </button>
      </header>

      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <span>AI</span>
          </div>
          <div className="sidebar-brand-text">
            <div className="mark">Ajmeri <em>Industries</em></div>
            <div className="est">Rice Mill Manager</div>
          </div>
        </div>

        <div style={{ flex: 1, paddingBottom: 12 }}>
          {grouped.map(([section, items]) => (
            <div key={section}>
              <div className="sidebar-section-label">{section}</div>
              {items.map(item => {
                const Icon = ICON_FOR[item.id] || IcLedger;
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        <div className="sidebar-foot">
          <div className="sync-pill">
            <span className={`sync-dot${hasSupabase() ? '' : ' offline'}`} />
            <span>{syncLabel}</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-xfaint)', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 750 }}>
            Premium workspace
          </div>
        </div>
      </aside>

      <main className="main">
        {children}
      </main>

      <button
        className="fab"
        title="Quick add entry"
        aria-label="Quick add"
        onClick={onQuickAdd}
      >
        <IcPlus style={{ width: 22, height: 22 }} />
      </button>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {BOTTOM_NAV.map(item => {
          if (item.center) {
            return (
              <div key="center" style={{ display: 'flex', justifyContent: 'center' }}>
                <button className="bn-center" aria-label="Quick add" onClick={onQuickAdd}>
                  <IcPlus />
                </button>
              </div>
            );
          }

          const Icon = BN_ICON[item.id] || IcMore;
          const isActive = (item.path === '/' && loc.pathname === '/') ||
            (item.path !== '/' && loc.pathname.startsWith(item.path));

          return (
            <button
              key={item.id}
              className={`bn-item${isActive ? ' active' : ''}`}
              onClick={() => navigate(item.path)}
              type="button"
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
