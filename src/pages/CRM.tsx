import { useState, useEffect } from 'react';
import {
  Users, TrendingUp, DollarSign, Star, Plus, Search, X, Loader2,
  Phone, Mail, Globe, UserPlus, Target, Activity, ChevronDown, Edit2, Trash2
} from 'lucide-react';
import { api } from '../api/client';

type LeadSource = 'Website' | 'Referral' | 'Cold Call' | 'Social';
type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Negotiation' | 'Won' | 'Lost';

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  value: number;
  assignedTo: string;
  lastFollowUp: string;
  notes: string;
}

const SOURCE_COLORS: Record<LeadSource, string> = {
  Website: 'badge-blue', Referral: 'badge-green', 'Cold Call': 'badge-orange', Social: 'badge-purple',
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  New: 'badge-blue', Contacted: 'badge-cyan', Qualified: 'badge-green',
  Negotiation: 'badge-yellow', Won: 'badge-green', Lost: 'badge-red',
};

const PIPELINE_COLS: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Negotiation', 'Won', 'Lost'];

const PIPELINE_COL_COLORS: Record<LeadStatus, string> = {
  New: '#3b82f6', Contacted: '#06b6d4', Qualified: '#10b981',
  Negotiation: '#eab308', Won: '#34d399', Lost: '#f87171',
};


const EMPTY_FORM = { name: '', company: '', email: '', phone: '', source: 'Website' as LeadSource, status: 'New' as LeadStatus, value: '', assignedTo: '', notes: '' };

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function CRM() {
  const [tab, setTab] = useState<'leads' | 'customers' | 'pipeline'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);

  useEffect(() => { fetchLeads(); }, []);

  async function fetchLeads() {
    setLoading(true);
    try {
      const data = await api.get<Lead[]>('/leads');
      setLeads(data);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    return !q || l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.email.toLowerCase().includes(q);
  });

  const stats = {
    total: leads.length,
    newThisWeek: leads.filter(l => l.status === 'New').length,
    converted: leads.filter(l => l.status === 'Won').length,
    pipeline: leads.filter(l => !['Won', 'Lost'].includes(l.status)).reduce((s, l) => s + l.value, 0),
  };

  async function handleAddLead() {
    if (!form.name || !form.company) return;
    setSaving(true);
    const newLead: Lead = {
      id: Date.now().toString(), name: form.name, company: form.company,
      email: form.email, phone: form.phone, source: form.source, status: form.status,
      value: Number(form.value), assignedTo: form.assignedTo,
      lastFollowUp: new Date().toISOString().slice(0, 10), notes: form.notes,
    };
    try { await api.post('/leads', newLead); } catch {}
    setLeads(prev => [newLead, ...prev]);
    setSaving(false);
    setShowModal(false);
    setForm(EMPTY_FORM);
  }

  function updateLeadStatus(id: string, status: LeadStatus) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    setEditingStatus(null);
  }

  const wonLeads = leads.filter(l => l.status === 'Won');

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">CRM &amp; Sales</h1>
          <p className="page-subtitle">Manage leads, customers, and sales pipeline</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-bar w-fit">
        {(['leads', 'customers', 'pipeline'] as const).map(t => (
          <button key={t} className={`tab-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'leads' ? 'Leads' : t === 'customers' ? 'Customers (Won)' : 'Pipeline'}
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="stat-grid-auto gap-4">
        {[
          { label: 'Total Leads', value: stats.total, icon: Users, color: 'stat-blue', iconCls: 'icon-blue' },
          { label: 'New This Week', value: stats.newThisWeek, icon: UserPlus, color: 'stat-cyan', iconCls: 'icon-cyan' },
          { label: 'Converted (Won)', value: stats.converted, icon: Star, color: 'stat-green', iconCls: 'icon-green' },
          { label: 'Revenue Pipeline', value: `₹${(stats.pipeline / 100000).toFixed(1)}L`, icon: DollarSign, color: 'stat-purple', iconCls: 'icon-purple' },
        ].map((s, i) => (
          <div key={s.label} className={`stat-card ${s.color} fade-up stagger-${i + 1}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`icon-box ${s.iconCls}`}><s.icon size={20} /></div>
            </div>
            <p className="text-3xl font-bold text-white">{s.value}</p>
            <p className="text-slate-400 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Leads Table */}
      {tab === 'leads' && (
        <>
          <div className="glass-card">
            <div className="search-box">
              <Search size={15} className="text-slate-500" />
              <input placeholder="Search leads, company, email..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="glass-card !p-0 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center"><Loader2 className="animate-spin text-blue-400 mx-auto mb-3" size={32} /><p className="text-slate-500">Loading leads...</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th>Contact</th>
                      <th>Source</th>
                      <th>Status</th>
                      <th>Value (INR)</th>
                      <th>Assigned To</th>
                      <th>Last Follow Up</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(l => (
                      <tr key={l.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="avatar">{initials(l.name)}</div>
                            <div>
                              <p className="text-white font-semibold text-sm">{l.name}</p>
                              <p className="text-slate-500 text-xs">{l.company}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-slate-400"><Mail size={11} /> {l.email}</div>
                            <div className="flex items-center gap-1 text-xs text-slate-400"><Phone size={11} /> {l.phone}</div>
                          </div>
                        </td>
                        <td><span className={`badge ${SOURCE_COLORS[l.source]}`}>{l.source}</span></td>
                        <td>
                          {editingStatus === l.id ? (
                            <select className="input !py-1 text-xs w-36"
                              value={l.status}
                              onChange={e => updateLeadStatus(l.id, e.target.value as LeadStatus)}
                              onBlur={() => setEditingStatus(null)}
                              autoFocus>
                              {(['New', 'Contacted', 'Qualified', 'Negotiation', 'Won', 'Lost'] as LeadStatus[]).map(s => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          ) : (
                            <button className={`badge ${STATUS_COLORS[l.status]} cursor-pointer`} onClick={() => setEditingStatus(l.id)}>
                              {l.status} <ChevronDown size={9} />
                            </button>
                          )}
                        </td>
                        <td className="text-white font-semibold">₹{l.value.toLocaleString('en-IN')}</td>
                        <td className="text-slate-300 text-sm">{l.assignedTo}</td>
                        <td className="text-slate-400 text-xs">{l.lastFollowUp}</td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-ghost !px-2 !py-1 text-xs"><Edit2 size={12} /></button>
                            <button className="btn btn-danger !px-2 !py-1 text-xs"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={8} className="text-center py-10 text-slate-500">No leads found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Customers (Won) */}
      {tab === 'customers' && (
        <div className="glass-card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Source</th>
                  <th>Deal Value</th>
                  <th>Assigned To</th>
                  <th>Closed On</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {wonLeads.map(l => (
                  <tr key={l.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar">{initials(l.name)}</div>
                        <div>
                          <p className="text-white font-semibold text-sm">{l.name}</p>
                          <p className="text-slate-500 text-xs">{l.company}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-slate-400"><Mail size={11} /> {l.email}</div>
                        <div className="flex items-center gap-1 text-xs text-slate-400"><Phone size={11} /> {l.phone}</div>
                      </div>
                    </td>
                    <td><span className={`badge ${SOURCE_COLORS[l.source]}`}>{l.source}</span></td>
                    <td className="text-green-400 font-bold">₹{l.value.toLocaleString('en-IN')}</td>
                    <td className="text-slate-300 text-sm">{l.assignedTo}</td>
                    <td className="text-slate-400 text-xs">{l.lastFollowUp}</td>
                    <td className="text-slate-400 text-xs max-w-xs truncate">{l.notes}</td>
                  </tr>
                ))}
                {wonLeads.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-slate-500">No won leads yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pipeline Kanban */}
      {tab === 'pipeline' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {PIPELINE_COLS.map(col => {
              const colLeads = leads.filter(l => l.status === col);
              const colValue = colLeads.reduce((s, l) => s + l.value, 0);
              return (
                <div key={col} className="kanban-col" style={{ minWidth: 240 }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIPELINE_COL_COLORS[col] }} />
                        <span className="text-white text-sm font-bold">{col}</span>
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">₹{(colValue / 1000).toFixed(0)}K</p>
                    </div>
                    <span className="badge badge-gray text-xs">{colLeads.length}</span>
                  </div>

                  <div className="space-y-3">
                    {colLeads.map(l => (
                      <div key={l.id} className="kanban-card touch-card">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="avatar !w-7 !h-7 text-xs">{initials(l.name)}</div>
                            <div>
                              <p className="text-white text-xs font-semibold leading-tight">{l.name}</p>
                              <p className="text-slate-500 text-xs">{l.company}</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-green-400 font-bold text-sm">₹{l.value.toLocaleString('en-IN')}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-slate-500 text-xs">{l.assignedTo}</span>
                          <span className="text-slate-600 text-xs">{l.lastFollowUp}</span>
                        </div>
                      </div>
                    ))}
                    {colLeads.length === 0 && (
                      <div className="text-center py-6 text-slate-600 text-xs">No leads here</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FAB — mobile only */}
      <button className="fab mobile-only" onClick={() => setShowModal(true)}><Plus size={22} color="#fff" /></button>

      {/* Add Lead Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add New Lead</h2>
              <button className="btn btn-ghost !p-2" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Lead Name</label>
                <input className="input" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Company</label>
                <input className="input" placeholder="Company name" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="input" placeholder="email@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input className="input" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Source</label>
                <select className="input" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as LeadSource }))}>
                  {(['Website', 'Referral', 'Cold Call', 'Social'] as LeadSource[]).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as LeadStatus }))}>
                  {(['New', 'Contacted', 'Qualified', 'Negotiation', 'Won', 'Lost'] as LeadStatus[]).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Deal Value (INR)</label>
                <input type="number" className="input" placeholder="0" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Assign To</label>
                <input className="input" placeholder="Sales rep name" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="form-label">Notes</label>
                <textarea className="input" rows={3} placeholder="Initial notes about the lead..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddLead} disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Add Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
