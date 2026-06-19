// Inline SVG icons, line-style, 24px viewbox. Custom-drawn for the mill aesthetic.
import React from 'react';

const wrap = (props, kids) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {kids}
  </svg>
);

export const IcLedger = (p) => wrap(p, <>
  <path d="M4 4h12a3 3 0 013 3v13H7a3 3 0 01-3-3V4z"/>
  <path d="M7 8h9M7 12h9M7 16h6"/>
  <path d="M4 4v17"/>
</>);

export const IcTruck = (p) => wrap(p, <>
  <path d="M2 7h12v9H2zM14 10h4l3 3v3h-7V10z"/>
  <circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
</>);

export const IcMill = (p) => wrap(p, <>
  <path d="M12 3v6M12 9a4 4 0 110 8 4 4 0 010-8z"/>
  <path d="M12 3l2 2M12 3l-2 2M9 12H3M21 12h-6M14.8 9.2L20 7M9.2 14.8L4 17M14.8 14.8L20 17M9.2 9.2L4 7"/>
</>);

export const IcSack = (p) => wrap(p, <>
  <path d="M9 4h6l1 2h-8l1-2z"/>
  <path d="M8 6c0 0-3 3-3 8a6 6 0 0014 0c0-5-3-8-3-8"/>
  <path d="M10 12h4"/>
</>);

export const IcGrain = (p) => wrap(p, <>
  <path d="M12 2c3 5 3 9 0 14M12 2c-3 5-3 9 0 14"/>
  <path d="M8 8c2 3 4 5 4 8M16 8c-2 3-4 5-4 8"/>
  <path d="M6 13c3 1 5 3 6 7M18 13c-3 1-5 3-6 7"/>
</>);

export const IcCoin = (p) => wrap(p, <>
  <circle cx="12" cy="12" r="9"/>
  <path d="M9 9h5a2 2 0 110 4H9l5 5"/>
</>);

export const IcWhatsapp = (p) => wrap(p, <>
  <path d="M21 12a9 9 0 11-3.4-7l3 .8-.8 3A9 9 0 0121 12z"/>
  <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.5-1.5-2-1-1 1c-1 0-2.5-1.5-2.5-2.5l1-1-1-2L9 9.5z"/>
</>);

export const IcPlus = (p) => wrap(p, <>
  <path d="M12 5v14M5 12h14"/>
</>);

export const IcMore = (p) => wrap(p, <>
  <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
</>);

export const IcCheque = (p) => wrap(p, <>
  <rect x="3" y="6" width="18" height="12" rx="1.5"/>
  <path d="M7 11h6M7 14h4M15 14h2"/>
  <circle cx="17" cy="11" r="1"/>
</>);

export const IcGodown = (p) => wrap(p, <>
  <path d="M3 10l9-6 9 6v10H3V10z"/>
  <path d="M7 14h3v6M14 14h3v6"/>
</>);

export const IcChart = (p) => wrap(p, <>
  <path d="M3 21V3M3 21h18"/>
  <rect x="7" y="13" width="3" height="6"/>
  <rect x="12" y="9" width="3" height="10"/>
  <rect x="17" y="5" width="3" height="14"/>
</>);

export const IcPeople = (p) => wrap(p, <>
  <circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/>
  <path d="M3 20c0-3 3-5 6-5s6 2 6 5M14 20c0-2.5 2-4 4-4s4 1.5 4 4"/>
</>);

export const IcClose = (p) => wrap(p, <>
  <path d="M6 6l12 12M18 6L6 18"/>
</>);

export const IcCheck = (p) => wrap(p, <>
  <path d="M5 13l4 4L19 7"/>
</>);

export const IcPencil = (p) => wrap(p, <>
  <path d="M12 20h9"/>
  <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>
</>);

export const IcSave = (p) => wrap(p, <>
  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
  <path d="M17 21v-8H7v8M7 3v5h8"/>
</>);

export const IcDownload = (p) => wrap(p, <>
  <path d="M12 4v12M6 12l6 6 6-6M4 20h16"/>
</>);

export const IcBell = (p) => wrap(p, <>
  <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z"/>
  <path d="M10 19a2 2 0 004 0"/>
</>);

export const IcSearch = (p) => wrap(p, <>
  <circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>
</>);

export const IcHardHat = (p) => wrap(p, <>
  <path d="M2 14h20"/>
  <path d="M4 14v3a8 8 0 0016 0v-3"/>
  <path d="M12 2v5M8.5 4A8 8 0 004 11.5V14h16v-2.5A8 8 0 0015.5 4"/>
</>);

export const IcReceipt = (p) => wrap(p, <>
  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1V2l-2 1-2-1-2 1-2-1-2 1-2-1z"/>
  <path d="M8 8h8M8 12h8M8 16h5"/>
</>);

export const IcArrowUp = (p) => wrap(p, <>
  <line x1="12" y1="19" x2="12" y2="5" />
  <polyline points="5 12 12 5 19 12" />
</>);

export const IcArrowDown = (p) => wrap(p, <>
  <line x1="12" y1="5" x2="12" y2="19" />
  <polyline points="19 12 12 19 5 12" />
</>);

// Decorative paddy stalk for the sidebar
export const PaddyStalk = (p) => (
  <svg viewBox="0 0 40 220" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" {...p}>
    <path d="M20 220 V40" />
    {[60,90,120,150,180].map((y) => (
      <g key={y}>
        <ellipse cx="14" cy={y} rx="3" ry="6" transform={`rotate(-30 14 ${y})`} fill="currentColor" opacity="0.18"/>
        <ellipse cx="26" cy={y-6} rx="3" ry="6" transform={`rotate(30 26 ${y-6})`} fill="currentColor" opacity="0.18"/>
        <line x1="20" y1={y} x2="14" y2={y}/>
        <line x1="20" y1={y-6} x2="26" y2={y-6}/>
      </g>
    ))}
    <path d="M20 40 q -6 -10 -2 -20" />
    <path d="M20 40 q 6 -10 2 -20" />
    <ellipse cx="16" cy="22" rx="2.5" ry="5" transform="rotate(-25 16 22)" fill="currentColor" opacity="0.25"/>
    <ellipse cx="24" cy="22" rx="2.5" ry="5" transform="rotate(25 24 22)" fill="currentColor" opacity="0.25"/>
  </svg>
);
