import { useState, useEffect } from 'react';
import {
  DollarSign, Clock, CheckCircle, XCircle, Plus, Search, FileText,
  Receipt, X, Loader2, TrendingUp, Building2, Check, Ban, ChevronDown
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { api } from '../api/client';

type ExpenseCategory = 'Travel' | 'Food' | 'Fuel' | 'Hotel' | 'Other';
type ExpenseStatus = 'Pending' | 'Approved' | 'Rejected';

interface Expense {
  id: string;
  employee: string;
  employeeName: string;
  department: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description: string;
  receipt: boolean;
  status: ExpenseStatus;
}

const CAT_COLORS: Record<ExpenseCategory, string> = {
  Travel: 'badge-blue', Food: 'badge-green', Fuel: 'badge-orange',
  Hotel: 'badge-purple', Other: 'badge-gray',
};

const STATUS_COLORS: Record<ExpenseStatus, string> = {
  Pending: 'badge-yellow', Approved: 'badge-green', Rejected: 'badge-red',
};

const BAR_DATA: { category: string; amount: number }[] = [];

const AREA_DATA: { month: string; amount: number }[] = [];

const DEPT_REPORT: { dept: string; total: number; approved: number; count: number }[] = [];

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(13,20,37,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px' }}>
      <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
          ₹{p.value.toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
};

const EMPTY_FORM = { employee: '', category: 'Travel' as ExpenseCategory, amount: '', date: '', description: '' };

export default function Expenses() {
  const [tab, setTab] = useState<'all' | 'pending' | 'reports'>('all');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchExpenses(); }, []);

  async function fetchExpenses() {
    setLoading(true);
    try {
      const data = await api.get<Expense[]>('/expenses');
      setExpenses(data);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }

  const displayed = expenses.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.employeeName.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
    const matchTab = tab === 'all' || (tab === 'pending' && e.status === 'Pending');
    return matchSearch && matchTab;
  });

  const stats = {
    total: expenses.reduce((s, e) => s + e.amount, 0),
    approved: expenses.filter(e => e.status === 'Approved').reduce((s, e) => s + e.amount, 0),
    rejected: expenses.filter(e => e.status === 'Rejected').length,
    pending: expenses.filter(e => e.status === 'Pending').length,
  };

  function updateStatus(id: string, status: ExpenseStatus) {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  }

  async function handleAdd() {
    if (!form.employee || !form.amount || !form.date) return;
    setSaving(true);
    const names: Record<string, string> = { EMP001: 'Rahul Sharma', EMP002: 'Priya Mehta', EMP003: 'Ananya Patel', EMP004: 'Kavya Reddy', EMP005: 'Amit Singh', EMP006: 'Neha Gupta' };
    const newExp: Expense = {
      id: Date.now().toString(), employee: form.employee,
      employeeName: names[form.employee] || form.employee,
      department: 'General', category: form.category,
      amount: Number(form.amount), date: form.date,
      description: form.description, receipt: false, status: 'Pending',
    };
    try { await api.post('/expenses', newExp); } catch {}
    setExpenses(prev => [newExp, ...prev]);
    setSaving(false);
    setShowModal(false);
    setForm(EMPTY_FORM);
  }

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Expense Management</h1>
          <p className="page-subtitle">Track, approve, and report employee expenses</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Expense
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-bar w-fit">
        {(['all', 'pending', 'reports'] as const).map(t => (
          <button key={t} className={`tab-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'all' ? 'All Expenses' : t === 'pending' ? `Pending Approval (${stats.pending})` : 'Reports'}
          </button>
        ))}
      </div>

      {tab !== 'reports' && (
        <>
          {/* Stats */}
          <div className="stat-grid-auto gap-4">
            {[
              { label: 'Total Claimed', value: `₹${(stats.total / 1000).toFixed(1)}K`, icon: DollarSign, color: 'stat-blue', iconCls: 'icon-blue' },
              { label: 'Approved', value: `₹${(stats.approved / 1000).toFixed(1)}K`, icon: CheckCircle, color: 'stat-green', iconCls: 'icon-green' },
              { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'stat-orange', iconCls: 'icon-orange' },
              { label: 'Pending', value: stats.pending, icon: Clock, color: 'stat-purple', iconCls: 'icon-purple' },
            ].map((s, i) => (
              <div key={s.label} className={`stat-card ${s.color} fade-up stagger-${i + 1}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`icon-box ${s.iconCls}`}><s.icon size={20} /></div>
                </div>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
                <p className="text-slate-400 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="glass-card">
            <div className="search-box">
              <Search size={15} className="text-slate-500" />
              <input placeholder="Search by employee, description..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Table */}
          <div className="glass-card !p-0 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center"><Loader2 className="animate-spin text-blue-400 mx-auto mb-3" size={32} /><p className="text-slate-500">Loading...</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Category</th>
                      <th>Amount (INR)</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Receipt</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map(e => (
                      <tr key={e.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="avatar text-xs">{e.employeeName.split(' ').map(n => n[0]).join('')}</div>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{e.employeeName}</p>
                              <p className="text-slate-500 text-xs">{e.department}</p>
                            </div>
                          </div>
                        </td>
                        <td><span className={`badge ${CAT_COLORS[e.category]}`}>{e.category}</span></td>
                        <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>₹{e.amount.toLocaleString('en-IN')}</td>
                        <td className="text-slate-400 text-sm">{e.date}</td>
                        <td className="text-slate-400 text-sm max-w-xs truncate">{e.description}</td>
                        <td>
                          {e.receipt
                            ? <FileText size={16} className="text-blue-400" />
                            : <span className="text-slate-600 text-xs">—</span>
                          }
                        </td>
                        <td><span className={`badge ${STATUS_COLORS[e.status]}`}>{e.status}</span></td>
                        <td>
                          {e.status === 'Pending' && (
                            <div className="flex gap-2">
                              <button className="btn btn-success !px-2 !py-1 text-xs" onClick={() => updateStatus(e.id, 'Approved')}>
                                <Check size={12} /> Approve
                              </button>
                              <button className="btn btn-danger !px-2 !py-1 text-xs" onClick={() => updateStatus(e.id, 'Rejected')}>
                                <Ban size={12} /> Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {displayed.length === 0 && (
                      <tr><td colSpan={8} className="text-center py-10 text-slate-500">No expenses found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'reports' && (
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Bar Chart */}
            <div className="glass-card">
              <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Expenses by Category</h3>
              <p className="text-slate-500 text-xs mb-4">Total claimed amount per category (INR)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={BAR_DATA} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={60} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Trend Area Chart */}
            <div className="glass-card">
              <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Monthly Expense Trend</h3>
              <p className="text-slate-500 text-xs mb-4">Total expenses claimed per month (INR)</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={AREA_DATA}>
                  <defs>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} fill="url(#expGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Report Table */}
          <div className="glass-card !p-0 overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Approved Expenses by Department</h3>
              <p className="text-slate-500 text-xs mt-1">Summary of approved expenses per department — June 2026</p>
            </div>
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Total Claimed</th>
                    <th>Approved Amount</th>
                    <th>Claims Count</th>
                    <th>Approval Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {DEPT_REPORT.map(d => (
                    <tr key={d.dept}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="icon-box icon-blue !w-8 !h-8"><Building2 size={14} /></div>
                          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{d.dept}</span>
                        </div>
                      </td>
                      <td className="text-slate-300">₹{d.total.toLocaleString('en-IN')}</td>
                      <td className="text-green-400 font-semibold">₹{d.approved.toLocaleString('en-IN')}</td>
                      <td className="text-slate-300">{d.count}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="progress-bar flex-1">
                            <div className="progress-fill bg-gradient-to-r from-green-500 to-emerald-400" style={{ width: `${Math.round(d.approved / d.total * 100)}%` }} />
                          </div>
                          <span className="text-green-400 font-semibold text-sm">{Math.round(d.approved / d.total * 100)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FAB — mobile only */}
      <button className="fab mobile-only" onClick={() => setShowModal(true)}><Plus size={22} color="#fff" /></button>

      {/* New Expense Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>New Expense Claim</h2>
              <button className="btn btn-ghost !p-2" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px' }}>
              <div>
                <label className="form-label">Employee</label>
                <select className="input" value={form.employee} onChange={e => setForm(f => ({ ...f, employee: e.target.value }))}>
                  <option value="">Select Employee</option>
                  {['EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005', 'EMP006'].map(id => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}>
                  {(['Travel', 'Food', 'Fuel', 'Hotel', 'Other'] as ExpenseCategory[]).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Amount (INR)</label>
                <input type="number" className="input" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Date</label>
                <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Description</label>
                <textarea className="input" rows={3} placeholder="Purpose and details of expense..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Submit Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
