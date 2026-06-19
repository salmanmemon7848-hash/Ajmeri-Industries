import React, { useMemo, useState } from 'react';
import Masthead, { SectionHead } from '../components/Masthead';
import { useCollection } from '../hooks/useStore';
import { fmtDate, fmtINR, todayISO } from '../data/constants';
import { IcHardHat, IcMill, IcPlus } from '../components/Icons';

const SERVICE_TYPES = [
  { id: 'preventive', name: 'Preventive' },
  { id: 'repair', name: 'Repair' },
  { id: 'amc', name: 'AMC Visit' },
  { id: 'breakdown', name: 'Breakdown' },
];

const STATUS = [
  { id: 'running', name: 'Running' },
  { id: 'service_due', name: 'Service Due' },
  { id: 'stopped', name: 'Stopped' },
];

const daysUntil = (iso) => {
  if (!iso) return null;
  const now = new Date(todayISO());
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  return Math.ceil((then - now) / 86400000);
};

export default function Machinery() {
  const { items, create, edit } = useCollection('machinery');
  const [tab, setTab] = useState('add');
  const [serviceMachineId, setServiceMachineId] = useState('');
  const [form, setForm] = useState({
    name: '',
    serialNo: '',
    provider: '',
    amcStart: todayISO(),
    amcEnd: '',
    amcCost: '',
    serviceFrequencyDays: '90',
    status: 'running',
    notes: '',
  });
  const [service, setService] = useState({
    date: todayISO(),
    type: 'preventive',
    problem: '',
    solution: '',
    cost: '',
    downtimeHours: '',
    provider: '',
  });

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const setServiceField = (key, value) => setService(f => ({ ...f, [key]: value }));

  const stats = useMemo(() => {
    const expiring = items.filter(m => {
      const d = daysUntil(m.amcEnd);
      return d !== null && d <= 30;
    }).length;
    const stopped = items.filter(m => m.status === 'stopped').length;
    const serviceCost = items.reduce((sum, m) => (
      sum + (m.services || []).reduce((s, x) => s + (Number(x.cost) || 0), 0)
    ), 0);
    const downtime = items.reduce((sum, m) => (
      sum + (m.services || []).reduce((s, x) => s + (Number(x.downtimeHours) || 0), 0)
    ), 0);
    return { expiring, stopped, serviceCost, downtime };
  }, [items]);

  const submitMachine = (e) => {
    e.preventDefault();
    if (!form.name) return alert('Machine name required');
    create({
      ...form,
      amcCost: Number(form.amcCost) || 0,
      serviceFrequencyDays: Number(form.serviceFrequencyDays) || 0,
      services: [],
    });
    setForm({
      name: '',
      serialNo: '',
      provider: '',
      amcStart: todayISO(),
      amcEnd: '',
      amcCost: '',
      serviceFrequencyDays: '90',
      status: 'running',
      notes: '',
    });
  };

  const submitService = (e) => {
    e.preventDefault();
    if (!serviceMachineId) return alert('Select a machine');
    const machine = items.find(m => m.id === serviceMachineId);
    if (!machine) return;
    const entry = {
      id: `svc-${Date.now()}`,
      ...service,
      cost: Number(service.cost) || 0,
      downtimeHours: Number(service.downtimeHours) || 0,
    };
    edit(machine.id, {
      services: [entry, ...(machine.services || [])],
      provider: entry.provider || machine.provider,
      status: entry.type === 'breakdown' ? 'stopped' : 'running',
      lastServiceDate: entry.date,
    });
    setService({
      date: todayISO(),
      type: 'preventive',
      problem: '',
      solution: '',
      cost: '',
      downtimeHours: '',
      provider: '',
    });
  };

  return (
    <div className="page-enter">
      <Masthead title="Machinery" subtitle="AMC, repair history, downtime and service reminders" icon={<IcHardHat style={{ width: 20, height: 20 }} />} />

      <div className="grid grid-4 mb-5">
        <div className="stat">
          <div className="stat-label">Machines</div>
          <div className="stat-value">{items.length}</div>
          <div className="stat-foot text-faint">Registered assets</div>
        </div>
        <div className="stat gold">
          <div className="stat-label">AMC alerts</div>
          <div className="stat-value">{stats.expiring}</div>
          <div className="stat-foot text-faint">Expiring within 30 days</div>
        </div>
        <div className="stat">
          <div className="stat-label">Service cost</div>
          <div className="stat-value" style={{ fontSize: 22 }}>{fmtINR(stats.serviceCost, { short: true })}</div>
          <div className="stat-foot text-faint">All recorded repairs</div>
        </div>
        <div className="stat">
          <div className="stat-label">Downtime</div>
          <div className="stat-value">{stats.downtime}<span className="unit">h</span></div>
          <div className="stat-foot text-faint">Total stopped hours</div>
        </div>
      </div>

      <div className="segment mb-5">
        {[
          { id: 'add', label: 'Machine' },
          { id: 'service', label: 'Service' },
          { id: 'list', label: 'Records' },
        ].map(t => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} type="button" onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'add' && (
        <>
          <SectionHead label="Machine AMC record" meta="Create machine profile" />
          <form className="card" onSubmit={submitMachine}>
            <div className="form-grid">
              <div className="field span-4">
                <label className="field-label">Machine Name</label>
                <input className="input" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Polisher, dryer, boiler" />
              </div>
              <div className="field span-4">
                <label className="field-label">Serial / Code</label>
                <input className="input" value={form.serialNo} onChange={e => setField('serialNo', e.target.value)} placeholder="Optional" />
              </div>
              <div className="field span-4">
                <label className="field-label">Status</label>
                <select className="select" value={form.status} onChange={e => setField('status', e.target.value)}>
                  {STATUS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="field span-4">
                <label className="field-label">AMC Provider</label>
                <input className="input" value={form.provider} onChange={e => setField('provider', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">AMC Start</label>
                <input className="input" type="date" value={form.amcStart} onChange={e => setField('amcStart', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">AMC End</label>
                <input className="input" type="date" value={form.amcEnd} onChange={e => setField('amcEnd', e.target.value)} />
              </div>
              <div className="field span-2">
                <label className="field-label">AMC Cost</label>
                <input className="input num" type="number" value={form.amcCost} onChange={e => setField('amcCost', e.target.value)} />
              </div>
              <div className="field span-4">
                <label className="field-label">Service Frequency Days</label>
                <input className="input num" type="number" value={form.serviceFrequencyDays} onChange={e => setField('serviceFrequencyDays', e.target.value)} />
              </div>
              <div className="field span-8">
                <label className="field-label">Notes</label>
                <input className="input" value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Reminder, warranty, service terms" />
              </div>
            </div>
            <div className="row between mt-4 wrap">
              <div className="text-faint" style={{ fontSize: 12 }}>AMC reminders appear in Records when expiry is near.</div>
              <button type="submit" className="btn btn-primary"><IcPlus style={{ width: 16, height: 16 }} /> Save Machine</button>
            </div>
          </form>
        </>
      )}

      {tab === 'service' && (
        <>
          <SectionHead label="Repair or service entry" meta="Append history to a machine" />
          <form className="card" onSubmit={submitService}>
            <div className="form-grid">
              <div className="field span-4">
                <label className="field-label">Machine</label>
                <select className="select" value={serviceMachineId} onChange={e => setServiceMachineId(e.target.value)}>
                  <option value="">Select machine</option>
                  {items.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="field span-3">
                <label className="field-label">Date</label>
                <input className="input" type="date" value={service.date} onChange={e => setServiceField('date', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Type</label>
                <select className="select" value={service.type} onChange={e => setServiceField('type', e.target.value)}>
                  {SERVICE_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="field span-2">
                <label className="field-label">Cost</label>
                <input className="input num" type="number" value={service.cost} onChange={e => setServiceField('cost', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Downtime Hours</label>
                <input className="input num" type="number" step="0.5" value={service.downtimeHours} onChange={e => setServiceField('downtimeHours', e.target.value)} />
              </div>
              <div className="field span-3">
                <label className="field-label">Provider</label>
                <input className="input" value={service.provider} onChange={e => setServiceField('provider', e.target.value)} />
              </div>
              <div className="field span-6">
                <label className="field-label">Problem</label>
                <input className="input" value={service.problem} onChange={e => setServiceField('problem', e.target.value)} />
              </div>
              <div className="field span-12">
                <label className="field-label">Solution Applied</label>
                <input className="input" value={service.solution} onChange={e => setServiceField('solution', e.target.value)} />
              </div>
            </div>
            <div className="row between mt-4 wrap">
              <div className="text-faint" style={{ fontSize: 12 }}>Breakdown entries mark the machine as stopped.</div>
              <button type="submit" className="btn btn-primary"><IcPlus style={{ width: 16, height: 16 }} /> Add Service</button>
            </div>
          </form>
        </>
      )}

      {tab === 'list' && (
        <>
          <SectionHead label="Machine records" meta={`${items.length} machines`} />
          {items.length === 0 && <div className="empty">No machines yet. Add your first machine AMC record.</div>}
          <div className="grid grid-2">
            {items.map(m => {
              const due = daysUntil(m.amcEnd);
              const totalCost = (m.services || []).reduce((s, x) => s + (Number(x.cost) || 0), 0);
              const downtime = (m.services || []).reduce((s, x) => s + (Number(x.downtimeHours) || 0), 0);
              return (
                <div key={m.id} className="card">
                  <div className="row between mb-3">
                    <div className="row gap-3">
                      <div className="qnc-icon"><IcMill style={{ width: 20, height: 20 }} /></div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{m.name}</div>
                        <div className="text-faint" style={{ fontSize: 12 }}>{m.serialNo || 'No serial'} · {m.provider || 'No provider'}</div>
                      </div>
                    </div>
                    <span className={`status-pill ${m.status === 'stopped' ? 'stopped' : m.status === 'service_due' ? 'pending' : 'running'}`}>
                      {STATUS.find(s => s.id === m.status)?.name || m.status}
                    </span>
                  </div>
                  <div className="summary-strip" style={{ marginBottom: 12 }}>
                    <div className="ss-item"><span className="ss-label">AMC End</span><span className="ss-value" style={{ fontSize: 16 }}>{m.amcEnd ? fmtDate(m.amcEnd) : '-'}</span></div>
                    <div className="ss-item"><span className="ss-label">Service Cost</span><span className="ss-value" style={{ fontSize: 16 }}>{fmtINR(totalCost, { short: true })}</span></div>
                    <div className="ss-item"><span className="ss-label">Downtime</span><span className="ss-value" style={{ fontSize: 16 }}>{downtime}h</span></div>
                  </div>
                  {due !== null && due <= 30 && (
                    <div className="warn-box mb-3">AMC renewal {due < 0 ? 'overdue' : `due in ${due} days`}.</div>
                  )}
                  {(m.services || []).length === 0 ? (
                    <div className="text-faint" style={{ fontSize: 12 }}>No service history yet.</div>
                  ) : (
                    <div className="ledger-wrap">
                      <table className="ledger">
                        <thead>
                          <tr><th>Date</th><th>Type</th><th>Cost</th><th>Downtime</th></tr>
                        </thead>
                        <tbody>
                          {(m.services || []).slice(0, 4).map(s => (
                            <tr key={s.id}>
                              <td>{fmtDate(s.date)}</td>
                              <td>{SERVICE_TYPES.find(t => t.id === s.type)?.name || s.type}</td>
                              <td className="num-cell">{fmtINR(s.cost)}</td>
                              <td className="num-cell">{s.downtimeHours || 0}h</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
