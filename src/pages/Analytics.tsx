import { useState } from 'react';
import {
  Users, TrendingDown, Clock, ThumbsUp, DollarSign, Target,
  BarChart2, TrendingUp, Award
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  FunnelChart, Funnel, LabelList
} from 'recharts';

/* ─── Chart data ─── */
const ATTENDANCE_TREND = [
  { month: 'Jan', present: 92, wfh: 5, leave: 3 },
  { month: 'Feb', present: 88, wfh: 8, leave: 4 },
  { month: 'Mar', present: 91, wfh: 6, leave: 3 },
  { month: 'Apr', present: 85, wfh: 10, leave: 5 },
  { month: 'May', present: 90, wfh: 7, leave: 3 },
  { month: 'Jun', present: 93, wfh: 5, leave: 2 },
];

const DEPT_HEADCOUNT = [
  { dept: 'Engineering', count: 28 }, { dept: 'Sales', count: 18 },
  { dept: 'HR', count: 8 }, { dept: 'Design', count: 6 },
  { dept: 'Finance', count: 7 }, { dept: 'Marketing', count: 10 },
  { dept: 'Operations', count: 9 },
];

const LEAVE_PIE = [
  { name: 'Casual', value: 34, color: '#3b82f6' },
  { name: 'Sick', value: 22, color: '#f97316' },
  { name: 'Annual', value: 45, color: '#10b981' },
  { name: 'Maternity', value: 8, color: '#ec4899' },
  { name: 'Paternity', value: 4, color: '#8b5cf6' },
  { name: 'Unpaid', value: 6, color: '#94a3b8' },
];

const HIRING_FUNNEL = [
  { stage: 'Applied', count: 480 },
  { stage: 'Screened', count: 210 },
  { stage: 'Interviewed', count: 85 },
  { stage: 'Offered', count: 32 },
  { stage: 'Joined', count: 24 },
];

const PAYROLL_TREND = [
  { month: 'Jan', amount: 1850000 }, { month: 'Feb', amount: 1920000 },
  { month: 'Mar', amount: 1900000 }, { month: 'Apr', amount: 2050000 },
  { month: 'May', amount: 2100000 }, { month: 'Jun', amount: 2080000 },
];

const REVENUE_TARGET = [
  { month: 'Jan', revenue: 1200000, target: 1500000 },
  { month: 'Feb', revenue: 1850000, target: 1500000 },
  { month: 'Mar', revenue: 1600000, target: 1800000 },
  { month: 'Apr', revenue: 2100000, target: 2000000 },
  { month: 'May', revenue: 1950000, target: 2200000 },
  { month: 'Jun', revenue: 2450000, target: 2200000 },
];

const LEAD_FUNNEL = [
  { stage: 'New Leads', value: 120, fill: '#3b82f6' },
  { stage: 'Contacted', value: 80, fill: '#06b6d4' },
  { stage: 'Qualified', value: 45, fill: '#8b5cf6' },
  { stage: 'Proposal', value: 22, fill: '#f97316' },
  { stage: 'Won', value: 11, fill: '#10b981' },
];

const TOP_PERFORMERS = [
  { name: 'Amit Singh', dept: 'Sales', revenue: 4500000, deals: 8, score: 98 },
  { name: 'Priya Mehta', dept: 'Sales', revenue: 3800000, deals: 7, score: 94 },
  { name: 'Rahul Sharma', dept: 'Engineering', revenue: 0, deals: 15, score: 92 },
  { name: 'Kavya Reddy', dept: 'Design', revenue: 0, deals: 12, score: 88 },
];

/* ─── Dark tooltip ─── */
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(13,20,37,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', fontSize: 12 }}>
      {label && <p style={{ color: '#94a3b8', marginBottom: 6 }}>{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color || '#f1f5f9', fontWeight: 600, marginBottom: 2 }}>
          {p.name}: {typeof p.value === 'number' && p.value > 10000 ? `₹${(p.value / 100000).toFixed(2)}L` : p.value}
        </p>
      ))}
    </div>
  );
};

const AXIS_STYLE = { fill: '#475569', fontSize: 11 };
const GRID_PROPS = { stroke: 'rgba(255,255,255,0.04)', strokeDasharray: '3 3' };

function KpiCard({ label, value, sub, icon: Icon, iconCls }: { label: string; value: string; sub: string; icon: React.ElementType; iconCls: string }) {
  return (
    <div className="glass-card flex items-center gap-4">
      <div className={`icon-box ${iconCls} shrink-0`}><Icon size={20} /></div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-slate-300 text-sm font-semibold">{label}</p>
        <p className="text-slate-500 text-xs">{sub}</p>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [tab, setTab] = useState<'hr' | 'sales' | 'financial' | 'custom'>('hr');

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Executive Analytics</h1>
          <p className="page-subtitle">Data-driven insights across HR, Sales, and Finance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar w-fit">
        {(['hr', 'sales', 'financial', 'custom'] as const).map(t => (
          <button key={t} className={`tab-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'hr' ? 'HR Analytics' : t === 'sales' ? 'Sales' : t === 'financial' ? 'Financial' : 'Custom'}
          </button>
        ))}
      </div>

      {/* ═══ HR ANALYTICS ═══ */}
      {tab === 'hr' && (
        <div className="space-y-6">
          {/* KPI Row */}
          <div className="stat-grid-auto grid gap-4">
            <KpiCard label="Total Headcount" value="86" sub="+4 this month" icon={Users} iconCls="icon-blue" />
            <KpiCard label="Attrition Rate" value="6.2%" sub="Industry avg: 8.5%" icon={TrendingDown} iconCls="icon-orange" />
            <KpiCard label="Avg Tenure" value="2.8 Yrs" sub="Across all employees" icon={Clock} iconCls="icon-purple" />
            <KpiCard label="Offer Acceptance" value="84%" sub="Last 6 months" icon={ThumbsUp} iconCls="icon-green" />
          </div>

          {/* Attendance + Headcount */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px' }}>
            {/* Attendance Trend */}
            <div className="glass-card">
              <h3 className="text-white font-bold mb-1">Attendance Trend</h3>
              <p className="text-slate-500 text-xs mb-4">Monthly attendance breakdown (%) — Jan to Jun 2026</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={ATTENDANCE_TREND}>
                  <defs>
                    <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID_PROPS} vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_STYLE} />
                  <YAxis axisLine={false} tickLine={false} tick={AXIS_STYLE} unit="%" />
                  <Tooltip content={<DarkTooltip />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                  <Area type="monotone" dataKey="present" stroke="#3b82f6" strokeWidth={2} fill="url(#pGrad)" name="Present %" />
                  <Area type="monotone" dataKey="wfh" stroke="#06b6d4" strokeWidth={2} fill="url(#wGrad)" name="WFH %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Dept Headcount */}
            <div className="glass-card">
              <h3 className="text-white font-bold mb-1">Department Headcount</h3>
              <p className="text-slate-500 text-xs mb-4">Current employee distribution</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={DEPT_HEADCOUNT} layout="vertical" barSize={16}>
                  <CartesianGrid {...GRID_PROPS} horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={AXIS_STYLE} />
                  <YAxis type="category" dataKey="dept" axisLine={false} tickLine={false} tick={{ ...AXIS_STYLE, fill: '#94a3b8' }} width={80} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="count" name="Headcount" radius={[0, 8, 8, 0]}>
                    {DEPT_HEADCOUNT.map((_, i) => (
                      <Cell key={i} fill={['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#06b6d4', '#ec4899', '#eab308'][i % 7]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leave + Hiring Funnel + Payroll */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px' }}>
            {/* Leave Distribution */}
            <div className="glass-card">
              <h3 className="text-white font-bold mb-1">Leave Distribution</h3>
              <p className="text-slate-500 text-xs mb-4">By leave type — YTD 2026</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={LEAVE_PIE} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {LEAVE_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {LEAVE_PIE.map(l => (
                  <div key={l.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                    {l.name} ({l.value})
                  </div>
                ))}
              </div>
            </div>

            {/* Hiring Funnel */}
            <div className="glass-card">
              <h3 className="text-white font-bold mb-1">Hiring Funnel</h3>
              <p className="text-slate-500 text-xs mb-4">Recruitment pipeline — 2026</p>
              <div className="space-y-3 mt-4">
                {HIRING_FUNNEL.map((f, i) => {
                  const pct = Math.round((f.count / HIRING_FUNNEL[0].count) * 100);
                  const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f97316', '#10b981'];
                  return (
                    <div key={f.stage}>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300 text-xs">{f.stage}</span>
                        <span className="text-white text-xs font-bold">{f.count}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: colors[i] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payroll Cost */}
            <div className="glass-card">
              <h3 className="text-white font-bold mb-1">Payroll Cost Trend</h3>
              <p className="text-slate-500 text-xs mb-4">Monthly total payroll (INR)</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={PAYROLL_TREND}>
                  <CartesianGrid {...GRID_PROPS} vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_STYLE} />
                  <YAxis axisLine={false} tickLine={false} tick={AXIS_STYLE} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip content={<DarkTooltip />} />
                  <Line type="monotone" dataKey="amount" name="Payroll" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SALES ═══ */}
      {tab === 'sales' && (
        <div className="space-y-6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px' }}>
            {/* Revenue vs Target */}
            <div className="glass-card">
              <h3 className="text-white font-bold mb-1">Revenue vs Target</h3>
              <p className="text-slate-500 text-xs mb-4">Monthly performance (INR) — Jan to Jun 2026</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={REVENUE_TARGET} barSize={20}>
                  <CartesianGrid {...GRID_PROPS} vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_STYLE} />
                  <YAxis axisLine={false} tickLine={false} tick={AXIS_STYLE} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip content={<DarkTooltip />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" name="Target" fill="rgba(139,92,246,0.4)" radius={[4, 4, 0, 0]} stroke="#8b5cf6" strokeWidth={1} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Lead Funnel */}
            <div className="glass-card">
              <h3 className="text-white font-bold mb-1">Lead Conversion Funnel</h3>
              <p className="text-slate-500 text-xs mb-4">Pipeline conversion stages</p>
              <div className="space-y-3 mt-6">
                {LEAD_FUNNEL.map((f, i) => {
                  const pct = Math.round((f.value / LEAD_FUNNEL[0].value) * 100);
                  return (
                    <div key={f.stage}>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300 text-xs">{f.stage}</span>
                        <div className="flex gap-2">
                          <span className="text-white text-xs font-bold">{f.value}</span>
                          <span className="text-slate-500 text-xs">{pct}%</span>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: f.fill }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="glass-card !p-0 overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h3 className="text-white font-bold">Top Performers — H1 2026</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Revenue Generated</th>
                    <th>Deals Closed</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_PERFORMERS.map((p, i) => (
                    <tr key={p.name}>
                      <td>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : 'bg-orange-500/20 text-orange-400'}`}>
                          #{i + 1}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar">{p.name.split(' ').map(n => n[0]).join('')}</div>
                          <span className="text-white font-semibold text-sm">{p.name}</span>
                        </div>
                      </td>
                      <td><span className="badge badge-blue">{p.dept}</span></td>
                      <td className="text-green-400 font-semibold">{p.revenue > 0 ? `₹${(p.revenue / 100000).toFixed(1)}L` : '—'}</td>
                      <td className="text-white">{p.deals}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="progress-bar w-20">
                            <div className="progress-fill" style={{ width: `${p.score}%`, background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)' }} />
                          </div>
                          <span className="text-white font-bold text-sm">{p.score}%</span>
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

      {/* ═══ FINANCIAL ═══ */}
      {tab === 'financial' && (
        <div className="space-y-6">
          <div className="stat-grid-auto grid gap-4">
            {[
              { label: 'Total Payroll Cost', value: '₹20.8L', sub: 'June 2026', icon: DollarSign, iconCls: 'icon-blue' },
              { label: 'Expense Claims', value: '₹3.2L', sub: 'Pending approval ₹0.8L', icon: TrendingUp, iconCls: 'icon-orange' },
              { label: 'Revenue (MTD)', value: '₹24.5L', sub: 'vs Target ₹22L (+11%)', icon: Target, iconCls: 'icon-green' },
              { label: 'Net Profit Est.', value: '₹4.1L', sub: 'After all deductions', icon: BarChart2, iconCls: 'icon-purple' },
            ].map((s, i) => (
              <div key={s.label} className={`glass-card fade-up stagger-${i + 1}`}>
                <div className={`icon-box ${s.iconCls} mb-3`}><s.icon size={20} /></div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-slate-300 text-sm font-semibold mt-1">{s.label}</p>
                <p className="text-slate-500 text-xs">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="glass-card">
            <h3 className="text-white font-bold mb-1">Revenue vs Payroll Cost Trend</h3>
            <p className="text-slate-500 text-xs mb-4">Monthly comparison (INR) — Jan to Jun 2026</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={REVENUE_TARGET.map((r, i) => ({ ...r, payroll: PAYROLL_TREND[i]?.amount || 0 }))}>
                <CartesianGrid {...GRID_PROPS} vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_STYLE} />
                <YAxis axisLine={false} tickLine={false} tick={AXIS_STYLE} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip content={<DarkTooltip />} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} />
                <Line type="monotone" dataKey="payroll" name="Payroll Cost" stroke="#f97316" strokeWidth={2.5} dot={{ fill: '#f97316', r: 4 }} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="target" name="Revenue Target" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ CUSTOM ═══ */}
      {tab === 'custom' && (
        <div className="glass-card py-20 text-center">
          <BarChart2 size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-white font-bold text-lg mb-2">Custom Analytics Builder</h3>
          <p className="text-slate-500 text-sm">Drag-and-drop report builder coming soon. Configure custom KPIs, date ranges, and chart types.</p>
          <button className="btn btn-primary mt-6">Request Access</button>
        </div>
      )}
    </div>
  );
}
