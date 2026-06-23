import { useState } from 'react';
import {
  Building2, Shield, Bell, Calendar, Plug, Users,
  Upload, Save, Plus, Edit2, X, Check,
  Loader2, Trash2, MessageSquare, Phone, BellRing,
  Mail, Video, FileText, Globe
} from 'lucide-react';

type SettingsTab = 'company' | 'policies' | 'roles' | 'notifications' | 'holidays' | 'integrations';

/* ─── Data ─── */
const ROLES = [
  { id: '1', name: 'Super Admin', users: 2, permissions: ['All Modules', 'Settings', 'Delete', 'Reports'] },
  { id: '2', name: 'HR Manager', users: 3, permissions: ['Employees', 'Leave', 'Payroll', 'Recruitment', 'Reports'] },
  { id: '3', name: 'Department Manager', users: 8, permissions: ['Team Attendance', 'Leave Approval', 'Performance'] },
  { id: '4', name: 'Employee', users: 73, permissions: ['Self Service', 'Leave Apply', 'View Payslip'] },
  { id: '5', name: 'Finance', users: 4, permissions: ['Payroll', 'Expenses', 'Reports', 'Analytics'] },
];

const HOLIDAYS_2026 = [
  { id: '1', name: "New Year's Day", date: '2026-01-01', type: 'National' },
  { id: '2', name: 'Republic Day', date: '2026-01-26', type: 'National' },
  { id: '3', name: 'Holi', date: '2026-03-02', type: 'Festival' },
  { id: '4', name: 'Good Friday', date: '2026-04-03', type: 'Optional' },
  { id: '5', name: 'Eid ul-Fitr', date: '2026-04-21', type: 'Festival' },
  { id: '6', name: 'Ambedkar Jayanti', date: '2026-04-14', type: 'National' },
  { id: '7', name: 'Maharashtra Day', date: '2026-05-01', type: 'Regional' },
  { id: '8', name: 'Eid ul-Adha', date: '2026-06-28', type: 'Festival' },
  { id: '9', name: 'Independence Day', date: '2026-08-15', type: 'National' },
  { id: '10', name: 'Ganesh Chaturthi', date: '2026-08-22', type: 'Festival' },
  { id: '11', name: 'Dussehra', date: '2026-10-10', type: 'Festival' },
  { id: '12', name: 'Diwali', date: '2026-10-29', type: 'Festival' },
  { id: '13', name: 'Christmas', date: '2026-12-25', type: 'National' },
];

const HOLIDAY_TYPE_COLORS: Record<string, string> = {
  National: 'badge-blue', Festival: 'badge-orange', Regional: 'badge-purple', Optional: 'badge-gray',
};

const INTEGRATIONS = [
  { id: 'google', name: 'Google Workspace', desc: 'Sync calendar, directory, SSO', icon: Globe, connected: true, color: '#4285f4' },
  { id: 'ms365', name: 'Microsoft 365', desc: 'Teams, Outlook, SharePoint', icon: FileText, connected: false, color: '#0078d4' },
  { id: 'slack', name: 'Slack', desc: 'Notifications, leave alerts, approvals', icon: MessageSquare, connected: true, color: '#611f69' },
  { id: 'zoom', name: 'Zoom', desc: 'Interview scheduling, video calls', icon: Video, connected: false, color: '#2d8cff' },
  { id: 'whatsapp', name: 'WhatsApp Business', desc: 'HR notifications, payslip delivery', icon: Phone, connected: true, color: '#25d366' },
  { id: 'tally', name: 'Tally ERP', desc: 'Payroll accounting, journal entries', icon: FileText, connected: false, color: '#f97316' },
];

const NOTIF_EVENTS = [
  'New Leave Request', 'Leave Approved/Rejected', 'Payroll Processed',
  'New Joining', 'Exit/Resignation', 'Performance Review Due',
  'Expense Claim', 'Birthday / Anniversary', 'Ticket Raised',
];

const PERMISSION_COLORS: Record<string, string> = {
  'All Modules': 'badge-blue', Settings: 'badge-purple', Delete: 'badge-red',
  Reports: 'badge-cyan', Employees: 'badge-green', Leave: 'badge-yellow',
  Payroll: 'badge-orange', Recruitment: 'badge-blue', Analytics: 'badge-purple',
  'Team Attendance': 'badge-cyan', 'Leave Approval': 'badge-green', Performance: 'badge-yellow',
  'Self Service': 'badge-gray', 'Leave Apply': 'badge-blue', 'View Payslip': 'badge-green',
  Expenses: 'badge-orange',
};

const TABS: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
  { key: 'company', label: 'Company Profile', icon: Building2 },
  { key: 'policies', label: 'HR Policies', icon: Shield },
  { key: 'roles', label: 'Roles & Access', icon: Users },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'holidays', label: 'Holidays', icon: Calendar },
  { key: 'integrations', label: 'Integrations', icon: Plug },
];

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
      style={{ background: checked ? '#3b82f6' : 'rgba(255,255,255,0.1)' }}>
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: `translateX(${checked ? '22px' : '4px'})` }}
      />
    </button>
  );
}

export default function Settings() {
  const [tab, setTab] = useState<SettingsTab>('company');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [company, setCompany] = useState({
    name: 'TechCorp India Pvt Ltd', industry: 'Information Technology',
    gst: '27AABCT1234A1Z5', pan: 'AABCT1234A', cin: 'U72200MH2015PTC270234',
    epf: 'MH/BAN/0098765',
    address: '601, Kohinoor Complex, LBS Marg, Kurla West, Mumbai - 400070',
    website: 'https://techcorp.in', email: 'hr@techcorp.in', phone: '+91 22 6789 0123',
  });

  const [policies, setPolicies] = useState({
    probationPeriod: '6', noticePeriod: '60', workingHours: '9',
    wfhDaysPerWeek: '2', casualLeave: '10', sickLeave: '8', annualLeave: '15',
    maternityLeave: '180', paternityLeave: '15',
  });

  const [editRole, setEditRole] = useState<typeof ROLES[0] | null>(null);
  const [roles, setRoles] = useState(ROLES);

  const [holidays, setHolidays] = useState(HOLIDAYS_2026);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '', type: 'National' });

  const [notifSettings, setNotifSettings] = useState<Record<string, Record<string, boolean>>>(
    Object.fromEntries(NOTIF_EVENTS.map(e => [e, { email: true, sms: false, whatsapp: true, push: true }]))
  );

  const [integrations, setIntegrations] = useState(INTEGRATIONS);

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  }

  function addHoliday() {
    if (!newHoliday.name || !newHoliday.date) return;
    setHolidays(prev =>
      [...prev, { id: Date.now().toString(), ...newHoliday }].sort((a, b) => a.date.localeCompare(b.date))
    );
    setShowHolidayModal(false);
    setNewHoliday({ name: '', date: '', type: 'National' });
  }

  function toggleIntegration(id: string) {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
  }

  function toggleNotif(event: string, channel: string) {
    setNotifSettings(prev => ({
      ...prev,
      [event]: { ...prev[event], [channel]: !prev[event][channel] }
    }));
  }

  return (
    <div className="fade-up space-y-6">
      <div className="section-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure company profile, policies, and system preferences</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="glass-card !p-3 md:w-56 shrink-0 h-fit">
          <nav className="flex md:flex-col md:space-y-1 overflow-x-auto scroll-strip gap-1 md:gap-0">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`shrink-0 md:w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  tab === t.key
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}>
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">

          {/* Company Profile */}
          {tab === 'company' && (
            <div className="glass-card space-y-5">
              <div className="flex items-center gap-4 pb-5 border-b border-white/5">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>TC</div>
                <div className="flex-1">
                  <h2 className="text-white font-bold text-lg">{company.name}</h2>
                  <p className="text-slate-400 text-sm">{company.industry}</p>
                </div>
                <button className="btn btn-ghost"><Upload size={14} /> Upload Logo</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px' }}>
                <div>
                  <label className="form-label">Company Name</label>
                  <input className="input" value={company.name} onChange={e => setCompany(c => ({ ...c, name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Industry</label>
                  <input className="input" value={company.industry} onChange={e => setCompany(c => ({ ...c, industry: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">GST Number</label>
                  <input className="input" value={company.gst} onChange={e => setCompany(c => ({ ...c, gst: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">PAN Number</label>
                  <input className="input" value={company.pan} onChange={e => setCompany(c => ({ ...c, pan: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">CIN Number</label>
                  <input className="input" value={company.cin} onChange={e => setCompany(c => ({ ...c, cin: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">EPF Number</label>
                  <input className="input" value={company.epf} onChange={e => setCompany(c => ({ ...c, epf: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Registered Address</label>
                  <textarea className="input" rows={2} value={company.address} onChange={e => setCompany(c => ({ ...c, address: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Website</label>
                  <input className="input" value={company.website} onChange={e => setCompany(c => ({ ...c, website: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">HR Email</label>
                  <input className="input" value={company.email} onChange={e => setCompany(c => ({ ...c, email: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input className="input" value={company.phone} onChange={e => setCompany(c => ({ ...c, phone: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {/* HR Policies */}
          {tab === 'policies' && (
            <div className="space-y-4">
              <div className="glass-card">
                <h3 className="text-white font-bold mb-4">General Policies</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px' }}>
                  <div>
                    <label className="form-label">Probation Period (months)</label>
                    <input type="number" className="input" value={policies.probationPeriod}
                      onChange={e => setPolicies(p => ({ ...p, probationPeriod: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Notice Period (days)</label>
                    <input type="number" className="input" value={policies.noticePeriod}
                      onChange={e => setPolicies(p => ({ ...p, noticePeriod: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Working Hours per Day</label>
                    <input type="number" className="input" value={policies.workingHours}
                      onChange={e => setPolicies(p => ({ ...p, workingHours: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">WFH Days per Week (max)</label>
                    <input type="number" className="input" value={policies.wfhDaysPerWeek}
                      onChange={e => setPolicies(p => ({ ...p, wfhDaysPerWeek: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="glass-card">
                <h3 className="text-white font-bold mb-4">Leave Quotas (days per year)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px' }}>
                  {[
                    { key: 'casualLeave', label: 'Casual Leave' },
                    { key: 'sickLeave', label: 'Sick Leave' },
                    { key: 'annualLeave', label: 'Annual Leave' },
                    { key: 'maternityLeave', label: 'Maternity Leave' },
                    { key: 'paternityLeave', label: 'Paternity Leave' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="form-label">{f.label}</label>
                      <input type="number" className="input" value={policies[f.key as keyof typeof policies]}
                        onChange={e => setPolicies(p => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Roles & Access */}
          {tab === 'roles' && (
            <div className="glass-card !p-0 overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-white font-bold">Roles &amp; Permissions</h3>
                <button className="btn btn-ghost text-xs"><Plus size={13} /> Add Role</button>
              </div>
              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr><th>Role Name</th><th>Users</th><th>Permissions</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {roles.map(r => (
                      <tr key={r.id}>
                        <td className="text-white font-semibold">{r.name}</td>
                        <td><span className="badge badge-gray">{r.users} users</span></td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {r.permissions.map(p => (
                              <span key={p} className={`badge ${PERMISSION_COLORS[p] || 'badge-gray'}`}>{p}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => setEditRole(r)}>
                            <Edit2 size={12} /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            <div className="glass-card !p-0 overflow-hidden">
              <div className="p-5 border-b border-white/5">
                <h3 className="text-white font-bold">Notification Preferences</h3>
                <p className="text-slate-500 text-xs mt-1">Configure when and how HR events trigger notifications</p>
              </div>
              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th><div className="flex items-center gap-1"><Mail size={12} /> Email</div></th>
                      <th><div className="flex items-center gap-1"><MessageSquare size={12} /> SMS</div></th>
                      <th><div className="flex items-center gap-1"><Phone size={12} /> WhatsApp</div></th>
                      <th><div className="flex items-center gap-1"><BellRing size={12} /> Push</div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {NOTIF_EVENTS.map(event => (
                      <tr key={event}>
                        <td className="text-slate-200 font-medium text-sm">{event}</td>
                        {(['email', 'sms', 'whatsapp', 'push'] as const).map(ch => (
                          <td key={ch}>
                            <ToggleSwitch
                              checked={notifSettings[event]?.[ch] ?? false}
                              onChange={() => toggleNotif(event, ch)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Holidays */}
          {tab === 'holidays' && (
            <>
              <div className="flex justify-end mb-4">
                <button className="btn btn-primary" onClick={() => setShowHolidayModal(true)}>
                  <Plus size={16} /> Add Holiday
                </button>
              </div>
              <div className="glass-card !p-0 overflow-hidden">
                <div className="p-5 border-b border-white/5">
                  <h3 className="text-white font-bold">Holiday Calendar 2026</h3>
                  <p className="text-slate-500 text-xs mt-1">{holidays.length} holidays configured</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="premium-table">
                    <thead>
                      <tr><th>#</th><th>Holiday Name</th><th>Date</th><th>Day</th><th>Type</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {holidays.map((h, i) => (
                        <tr key={h.id}>
                          <td className="text-slate-500 text-xs">{i + 1}</td>
                          <td className="text-white font-semibold text-sm">{h.name}</td>
                          <td className="text-slate-300 text-sm">
                            {new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="text-slate-400 text-sm">
                            {new Date(h.date).toLocaleDateString('en-IN', { weekday: 'long' })}
                          </td>
                          <td><span className={`badge ${HOLIDAY_TYPE_COLORS[h.type]}`}>{h.type}</span></td>
                          <td>
                            <button className="btn btn-danger !px-2 !py-1 text-xs"
                              onClick={() => setHolidays(prev => prev.filter(x => x.id !== h.id))}>
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Integrations */}
          {tab === 'integrations' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {integrations.map(intg => (
                <div key={intg.id} className="glass-card touch-card flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: intg.color + '22', border: `1px solid ${intg.color}44` }}>
                    <intg.icon size={22} style={{ color: intg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{intg.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{intg.desc}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className={`w-2 h-2 rounded-full ${intg.connected ? 'bg-green-500' : 'bg-slate-600'}`} />
                      <span className={`text-xs font-semibold ${intg.connected ? 'text-green-400' : 'text-slate-500'}`}>
                        {intg.connected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleIntegration(intg.id)}
                    className={`btn text-xs shrink-0 ${intg.connected ? 'btn-danger' : 'btn-primary'}`}>
                    {intg.connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Edit Role Modal */}
      {editRole && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditRole(null)}>
          <div className="modal-box w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Edit Role: {editRole.name}</h2>
              <button className="btn btn-ghost !p-2" onClick={() => setEditRole(null)}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">Role Name</label>
                <input className="input" value={editRole.name}
                  onChange={e => setEditRole(r => r ? { ...r, name: e.target.value } : null)} />
              </div>
              <div>
                <label className="form-label">Current Permissions</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editRole.permissions.map(p => (
                    <span key={p} className={`badge ${PERMISSION_COLORS[p] || 'badge-gray'} cursor-pointer`}>
                      {p}
                      <span className="ml-1 opacity-60">×</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button className="btn btn-ghost" onClick={() => setEditRole(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                setRoles(prev => prev.map(r => r.id === editRole.id ? editRole : r));
                setEditRole(null);
              }}>
                <Save size={14} /> Save Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Holiday Modal */}
      {showHolidayModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowHolidayModal(false)}>
          <div className="modal-box w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Add Holiday</h2>
              <button className="btn btn-ghost !p-2" onClick={() => setShowHolidayModal(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="form-label">Holiday Name</label>
                <input className="input" placeholder="e.g. Diwali"
                  value={newHoliday.name} onChange={e => setNewHoliday(h => ({ ...h, name: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Date</label>
                <input type="date" className="input"
                  value={newHoliday.date} onChange={e => setNewHoliday(h => ({ ...h, date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Type</label>
                <select className="input" value={newHoliday.type}
                  onChange={e => setNewHoliday(h => ({ ...h, type: e.target.value }))}>
                  {['National', 'Festival', 'Regional', 'Optional'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button className="btn btn-ghost" onClick={() => setShowHolidayModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addHoliday}>
                <Plus size={14} /> Add Holiday
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
