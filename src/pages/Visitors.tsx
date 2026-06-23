import { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, Clock, CheckCircle, XCircle, X, Loader2 } from 'lucide-react';
import { api } from '../api/client';

interface Visitor {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  purpose: string;
  hostEmployee: string;
  hostDept: string;
  checkIn: string;
  checkOut: string;
  status: 'Checked In' | 'Checked Out' | 'Pre-Registered';
  date: string;
  badge: string;
}

const today = new Date().toISOString().slice(0, 10);
const MOCK: Visitor[] = [
  { id: '1', name: 'Sanjay Kapoor', company: 'TechVentures Pvt Ltd', phone: '9876541230', email: 'sanjay@techventures.com', purpose: 'Business Meeting', hostEmployee: 'Priya Mehta', hostDept: 'Engineering', checkIn: '10:15', checkOut: '12:00', status: 'Checked Out', date: today, badge: 'V-001' },
  { id: '2', name: 'Ananya Shah', company: 'Digital Creatives', phone: '9876541231', email: 'ananya@dc.com', purpose: 'Interview', hostEmployee: 'Neha Gupta', hostDept: 'HR', checkIn: '11:00', checkOut: '', status: 'Checked In', date: today, badge: 'V-002' },
  { id: '3', name: 'Raj Kumar', company: 'Freelance Consultant', phone: '9876541232', email: 'raj@gmail.com', purpose: 'Project Discussion', hostEmployee: 'Amit Singh', hostDept: 'Sales', checkIn: '', checkOut: '', status: 'Pre-Registered', date: today, badge: 'V-003' },
  { id: '4', name: 'Meena Iyer', company: 'FinTech Solutions', phone: '9876541233', email: 'meena@fintech.in', purpose: 'Vendor Meeting', hostEmployee: 'Vikram Joshi', hostDept: 'Marketing', checkIn: '14:30', checkOut: '16:00', status: 'Checked Out', date: today, badge: 'V-004' },
];

const statusBadge: Record<string, string> = {
  'Checked In': 'badge-green', 'Checked Out': 'badge-gray', 'Pre-Registered': 'badge-blue',
};

const purposeColors: Record<string, string> = {
  'Business Meeting': 'badge-blue', Interview: 'badge-purple', 'Vendor Meeting': 'badge-orange',
  'Project Discussion': 'badge-cyan', Delivery: 'badge-yellow', Other: 'badge-gray',
};

export default function Visitors() {
  const [visitors, setVisitors] = useState<Visitor[]>(MOCK);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'All' | 'Checked In' | 'Pre-Registered'>('All');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', purpose: 'Business Meeting', hostEmployee: '', hostDept: 'Engineering' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Visitor[]>('/visitors').then(d => { if (d?.length) setVisitors(d); }).catch(() => {});
  }, []);

  const filtered = visitors.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.company.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === 'All' || v.status === tab;
    return matchSearch && matchTab;
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const badge = `V-${String(visitors.length + 1).padStart(3, '0')}`;
    const visitor: Visitor = {
      id: String(Date.now()), badge, ...form,
      checkIn: '', checkOut: '', status: 'Pre-Registered', date: today,
    };
    try { await api.post('/visitors', visitor); } catch {}
    setVisitors(prev => [visitor, ...prev]);
    setShowModal(false);
    setForm({ name: '', company: '', phone: '', email: '', purpose: 'Business Meeting', hostEmployee: '', hostDept: 'Engineering' });
    setSaving(false);
  }

  async function handleCheckIn(id: string) {
    const time = new Date().toTimeString().slice(0, 5);
    setVisitors(prev => prev.map(v => v.id === id ? { ...v, checkIn: time, status: 'Checked In' } : v));
    try { await api.put(`/visitors/${id}`, { checkIn: time, status: 'Checked In' }); } catch {}
  }

  async function handleCheckOut(id: string) {
    const time = new Date().toTimeString().slice(0, 5);
    setVisitors(prev => prev.map(v => v.id === id ? { ...v, checkOut: time, status: 'Checked Out' } : v));
    try { await api.put(`/visitors/${id}`, { checkOut: time, status: 'Checked Out' }); } catch {}
  }

  const stats = {
    total: visitors.filter(v => v.date === today).length,
    checkedIn: visitors.filter(v => v.status === 'Checked In').length,
    checkedOut: visitors.filter(v => v.status === 'Checked Out').length,
    preReg: visitors.filter(v => v.status === 'Pre-Registered').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="section-header">
        <div>
          <h1 className="page-title">Visitor Management</h1>
          <p className="page-subtitle">Track and manage office visitors</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Register Visitor
        </button>
      </div>

      {/* Stats */}
      <div className="stat-grid-auto" style={{ display: 'grid', gap: '16px' }}>
        {[
          { label: "Today's Visitors", value: stats.total, icon: <UserCheck size={20} />, cls: 'stat-blue', icls: 'icon-blue' },
          { label: 'Currently In', value: stats.checkedIn, icon: <CheckCircle size={20} />, cls: 'stat-green', icls: 'icon-green' },
          { label: 'Checked Out', value: stats.checkedOut, icon: <XCircle size={20} />, cls: 'stat-purple', icls: 'icon-purple' },
          { label: 'Pre-Registered', value: stats.preReg, icon: <Clock size={20} />, cls: 'stat-orange', icls: 'icon-orange' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className={`icon-box ${s.icls}`} style={{ marginBottom: '12px' }}>{s.icon}</div>
            <p style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{s.value}</p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginTop: '4px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
            <Search size={15} style={{ color: '#94a3b8' }} />
            <input placeholder="Search visitor or company..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: '#0f172a', width: '100%' }} />
          </div>
          <div className="tab-bar">
            {(['All', 'Checked In', 'Pre-Registered'] as const).map(t => (
              <button key={t} className={`tab-item${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Badge</th><th>Visitor</th><th>Purpose</th>
                <th>Host</th><th>Check In</th><th>Check Out</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>No visitors found</td></tr>
              ) : filtered.map(v => (
                <tr key={v.id}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '12px', background: '#dbeafe', color: '#1d4ed8', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>{v.badge}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="avatar">{v.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                      <div>
                        <p style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{v.name}</p>
                        <p style={{ fontSize: '11px', color: '#64748b' }}>{v.company}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${purposeColors[v.purpose] || 'badge-gray'}`}>{v.purpose}</span></td>
                  <td><p style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{v.hostEmployee}</p><p style={{ fontSize: '11px', color: '#64748b' }}>{v.hostDept}</p></td>
                  <td style={{ color: v.checkIn ? '#059669' : '#94a3b8', fontWeight: 600 }}>{v.checkIn || '—'}</td>
                  <td style={{ color: v.checkOut ? '#475569' : '#94a3b8', fontWeight: 600 }}>{v.checkOut || '—'}</td>
                  <td><span className={`badge ${statusBadge[v.status]}`}>{v.status}</span></td>
                  <td>
                    {v.status === 'Pre-Registered' && (
                      <button className="btn btn-success" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={() => handleCheckIn(v.id)}>Check In</button>
                    )}
                    {v.status === 'Checked In' && (
                      <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={() => handleCheckOut(v.id)}>Check Out</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button className="fab mobile-only" onClick={() => setShowModal(true)}><Plus size={22} color="#fff"/></button>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ width: '500px', padding: '28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Register Visitor</h2>
              <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label className="form-label">Full Name *</label><input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><label className="form-label">Company</label><input className="input" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label className="form-label">Phone *</label><input className="input" required value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                <div><label className="form-label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              </div>
              <div><label className="form-label">Purpose of Visit</label>
                <select className="input" value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}>
                  {['Business Meeting', 'Interview', 'Vendor Meeting', 'Project Discussion', 'Delivery', 'Other'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label className="form-label">Host Employee *</label><input className="input" required value={form.hostEmployee} onChange={e => setForm(p => ({ ...p, hostEmployee: e.target.value }))} /></div>
                <div><label className="form-label">Department</label>
                  <select className="input" value={form.hostDept} onChange={e => setForm(p => ({ ...p, hostDept: e.target.value }))}>
                    {['Engineering', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
