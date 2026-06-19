import React from 'react';

export default function Masthead({ title, subtitle, right, icon }) {
  return (
    <header className="page-header">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1>
          {icon && (
            <span className="page-title-icon">
              {icon}
            </span>
          )}
          {title}
        </h1>
        {subtitle && (
          <div className="sub">
            {subtitle}
          </div>
        )}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </header>
  );
}

export function SectionHead({ label, meta, right }) {
  return (
    <div className="section-head">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="label">{label}</span>
        {meta && <span className="meta">{meta}</span>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
