import { useState, useEffect } from 'react';
import {
  Users, TrendingDown, Clock, ThumbsUp, DollarSign, Target,
  BarChart2, TrendingUp, Award
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  FunnelChart, Funnel, LabelList
} from 'recharts';
import { api } from '../api/client';
import type { Employee, LeaveRequest, AttendanceRecord, PayrollRecord, Candidate, PerformanceReview } from '../types/index';

/* ─── Dark tooltip ─── */
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(13,20,37,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', fontSize: 12 }}>
      {label && <p style={{ color: '#94a3b8', marginBottom: 6 }}>{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color || 'var(--text-primary)', fontWeight: 600, marginBottom: 2 }}>
          {p.name}: {typeof p.value === 'number' && p.value > 10000 ? `₹${(p.value / 100000).toFixed(2)}L` : p.value}
        </p>
      ))}
    </div>
  );
};

const AXIS_STYLE = { fill: '#475569', fontSize: 11 };
const GRID_PROPS = { stroke: 'rgba(255,255,255,0.04)', strokeDasharray: '3 3' };

const LEAVE_COLORS: Record<string, string> = {
  Casual: '#3b82f6',
  Sick: '#f97316',
  Annual: '#10b981',
  Maternity: '#ec4899',
  Paternity: '#8b5cf6',
  Unpaid: '#94a3b8',
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const EmptyChart = () => (
  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
    <p style={{ textAlign: 'center', fontSize: 13 }}>No data yet — add records via Google Sheets</p>
  </div>
);

function KpiCard({ label, value, sub, icon: Icon, iconCls }: { label: string; value: string; sub: string; icon: React.ElementType; iconCls: string }) {
  return (
    <div className="glass-card flex items-center gap-4">
      <div className={`icon-box ${iconCls} shrink-0`}><Icon size={20} /></div>
      <div>
        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-slate-500 text-sm font-semibold">{label}</p>
        <p className="text-slate-500 text-xs">{sub}</p>
      </div>
    </div>
  );
}

/* ─── Derived data helpers ─── */

function computeDeptHeadcount(employees: Employee[]) {
  const map: Record<string, number> = {};
  for (const e of employees) {
    const dept = e.department || 'Unknown';
    map[dept] = (map[dept] || 0) + 1;
  }
  return Object.entries(map).map(([dept, count]) => ({ dept, count }));
}

function computeLeavePie(leaves: LeaveRequest[]) {
  const map: Record<string, number> = {};
  for (const l of leaves) {
    const type = l.leaveType || 'Other';
    map[type] = (map[type] || 0) + 1;
  }
  return Object.entries(map).map(([name, value]) => ({
    name,
    value,
    color: LEAVE_COLORS[name] || '#64748b',
  }));
}

function computeHiringFunnel(candidates: Candidate[]) {
  // Map each stage to a numeric rank so we know how far along a candidate is
  const stageRank: Record<string, number> = {
    Applied: 0,
    Screening: 1,
    Interview: 2,
    Technical: 2,
    'HR Round': 2,
    Offer: 3,
    Hired: 4,
    Rejected: -1,
  };

  const total = candidates.length;
  let screening = 0, interviewed = 0, offered = 0, hired = 0;
  for (const c of candidates) {
    const rank = stageRank[c.stage] ?? -1;
    if (rank >= 1) screening++;
    if (rank >= 2) interviewed++;
    if (rank >= 3) offered++;
    if (rank >= 4) hired++;
  }
  return [
    { stage: 'Applied', count: total },
    { stage: 'Screening', count: screening },
    { stage: 'Interviewed', count: interviewed },
    { stage: 'Offered', count: offered },
    { stage: 'Hired', count: hired },
  ];
}

function computePayrollTrend(payroll: PayrollRecord[]) {
  const map: Record<string, number> = {};
  for (const p of payroll) {
    const monthKey = p.month || 'Unknown';
    map[monthKey] = (map[monthKey] || 0) + (Number(p.netSalary) || 0);
  }
  return Object.entries(map)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function computeAttendanceTrend(attendance: AttendanceRecord[]) {
  // group by month
  const map: Record<string, { present: number; wfh: number; total: number }> = {};
  for (const a of attendance) {
    if (!a.date) continue;
    const d = new Date(a.date);
    if (isNaN(d.getTime())) continue;
    const key = MONTH_LABELS[d.getMonth()];
    if (!map[key]) map[key] = { present: 0, wfh: 0, total: 0 };
    map[key].total++;
    const status = a.status || '';
    if (status === 'Present') map[key].present++;
    else if (status === 'Work From Home') map[key].wfh++;
  }
  return Object.entries(map).map(([month, v]) => ({
    month,
    present: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
    wfh: v.total > 0 ? Math.round((v.wfh / v.total) * 100) : 0,
  }));
}

function reviewScore(r: PerformanceReview): number {
  // Use rating (1-5 scale → convert to 0-100) or average goal scores if present
  if (r.goals && r.goals.length > 0) {
    const avg = r.goals.reduce((s, g) => s + (g.score || 0), 0) / r.goals.length;
    if (avg > 0) return Math.round(avg);
  }
  // rating is typically 1–5; scale to 0–100
  return r.rating ? Math.round((r.rating / 5) * 100) : 0;
}

function computeTopPerformers(reviews: PerformanceReview[]) {
  return [...reviews]
    .sort((a, b) => reviewScore(b) - reviewScore(a))
    .slice(0, 4)
    .map(r => ({
      name: r.employeeName || 'Unknown',
      dept: r.department || '—',
      revenue: 0,
      deals: 0,
      score: reviewScore(r),
    }));
}

function computeAvgAttendance(attendance: AttendanceRecord[]) {
  if (!attendance.length) return 0;
  const present = attendance.filter(a => a.status === 'Present').length;
  return Math.round((present / attendance.length) * 100);
}

export default function Analytics() {
  const [tab, setTab] = useState<'hr' | 'sales' | 'financial' | 'custom'>('hr');
  const [isLoading, setIsLoading] = useState(true);

  // Raw API data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [empRes, leaveRes, attRes, payRes, candRes, perfRes] = await Promise.allSettled([
        api.get<Employee[]>('/employees'),
        api.get<LeaveRequest[]>('/leave'),
        api.get<AttendanceRecord[]>('/attendance'),
        api.get<PayrollRecord[]>('/payroll'),
        api.get<Candidate[]>('/candidates'),
        api.get<PerformanceReview[]>('/performance'),
      ]);
      if (empRes.status === 'fulfilled') setEmployees(empRes.value ?? []);
      if (leaveRes.status === 'fulfilled') setLeaveRequests(leaveRes.value ?? []);
      if (attRes.status === 'fulfilled') setAttendance(attRes.value ?? []);
      if (payRes.status === 'fulfilled') setPayroll(payRes.value ?? []);
      if (candRes.status === 'fulfilled') setCandidates(candRes.value ?? []);
      if (perfRes.status === 'fulfilled') setPerformanceReviews(perfRes.value ?? []);
      setIsLoading(false);
    };
    load();
  }, []);

  // Derived / computed chart data
  const deptHeadcount = computeDeptHeadcount(employees);
  const leavePie = computeLeavePie(leaveRequests);
  const hiringFunnel = computeHiringFunnel(candidates);
  const payrollTrend = computePayrollTrend(payroll);
  const attendanceTrend = computeAttendanceTrend(attendance);
  const topPerformers = computeTopPerformers(performanceReviews);

  // Revenue / lead funnel have no API equivalent — show empty state
  const revenueTarget: { month: string; revenue: number; target: number }[] = [];
  const leadFunnel: { stage: string; value: number; fill: string }[] = [];

  // KPI stats
  const totalEmployees = employees.length;
  const inactiveCount = employees.filter(e => e.status === 'Resigned').length;
  const attritionRate = totalEmployees > 0 ? ((inactiveCount / totalEmployees) * 100).toFixed(1) : '0.0';
  const avgAttendance = computeAvgAttendance(attendance);

  if (isLoading) {
    return (
      <div className="space-y-6 fade-up">
        <div className="section-header">
          <div>
            <h1 className="page-title">Executive Analytics</h1>
            <p className="page-subtitle">Data-driven insights across HR, Sales, and Finance</p>
          </div>
        </div>
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          Loading analytics data…
        </div>
      </div>
    );
  }

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
            <KpiCard
              label="Total Headcount"
              value={String(totalEmployees)}
              sub={totalEmployees > 0 ? 'Active in system' : 'No employees loaded'}
              icon={Users}
              iconCls="icon-blue"
            />
            <KpiCard
              label="Attrition Rate"
              value={`${attritionRate}%`}
              sub="Inactive / Terminated"
              icon={TrendingDown}
              iconCls="icon-orange"
            />
            <KpiCard
              label="Avg Attendance"
              value={attendance.length > 0 ? `${avgAttendance}%` : '—'}
              sub="Present across all records"
              icon={Clock}
              iconCls="icon-purple"
            />
            <KpiCard
              label="eNPS"
              value={performanceReviews.length > 0 ? `${Math.round(performanceReviews.reduce((s, r) => s + reviewScore(r), 0) / performanceReviews.length)}` : '—'}
              sub="Avg performance score"
              icon={ThumbsUp}
              iconCls="icon-green"
            />
          </div>

          {/* Attendance + Headcount */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px' }}>
            {/* Attendance Trend */}
            <div className="glass-card">
              <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Attendance Trend</h3>
              <p className="text-slate-500 text-xs mb-4">Monthly attendance breakdown (%)</p>
              {attendanceTrend.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={attendanceTrend}>
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
              )}
            </div>

            {/* Dept Headcount */}
            <div className="glass-card">
              <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Department Headcount</h3>
              <p className="text-slate-500 text-xs mb-4">Current employee distribution</p>
              {deptHeadcount.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deptHeadcount} layout="vertical" barSize={16}>
                    <CartesianGrid {...GRID_PROPS} horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={AXIS_STYLE} />
                    <YAxis type="category" dataKey="dept" axisLine={false} tickLine={false} tick={{ ...AXIS_STYLE, fill: '#94a3b8' }} width={80} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="count" name="Headcount" radius={[0, 8, 8, 0]}>
                      {deptHeadcount.map((_, i) => (
                        <Cell key={i} fill={['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#06b6d4', '#ec4899', '#eab308'][i % 7]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Leave + Hiring Funnel + Payroll */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px' }}>
            {/* Leave Distribution */}
            <div className="glass-card">
              <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Leave Distribution</h3>
              <p className="text-slate-500 text-xs mb-4">By leave type — YTD</p>
              {leavePie.length === 0 ? <EmptyChart /> : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={leavePie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                        {leavePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip content={<DarkTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {leavePie.map(l => (
                      <div key={l.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                        {l.name} ({l.value})
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Hiring Funnel */}
            <div className="glass-card">
              <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Hiring Funnel</h3>
              <p className="text-slate-500 text-xs mb-4">Recruitment pipeline</p>
              {hiringFunnel.length === 0 || hiringFunnel[0].count === 0 ? <EmptyChart /> : (
                <div className="space-y-3 mt-4">
                  {hiringFunnel.map((f, i) => {
                    const pct = Math.round((f.count / hiringFunnel[0].count) * 100);
                    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f97316', '#10b981'];
                    return (
                      <div key={f.stage}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{f.stage}</span>
                          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{f.count}</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%`, background: colors[i] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payroll Cost */}
            <div className="glass-card">
              <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Payroll Cost Trend</h3>
              <p className="text-slate-500 text-xs mb-4">Monthly total payroll (INR)</p>
              {payrollTrend.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={payrollTrend}>
                    <CartesianGrid {...GRID_PROPS} vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_STYLE} />
                    <YAxis axisLine={false} tickLine={false} tick={AXIS_STYLE} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                    <Tooltip content={<DarkTooltip />} />
                    <Line type="monotone" dataKey="amount" name="Payroll" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
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
              <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Revenue vs Target</h3>
              <p className="text-slate-500 text-xs mb-4">Monthly performance (INR)</p>
              {revenueTarget.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={revenueTarget} barSize={20}>
                    <CartesianGrid {...GRID_PROPS} vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_STYLE} />
                    <YAxis axisLine={false} tickLine={false} tick={AXIS_STYLE} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                    <Tooltip content={<DarkTooltip />} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                    <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" name="Target" fill="rgba(139,92,246,0.4)" radius={[4, 4, 0, 0]} stroke="#8b5cf6" strokeWidth={1} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Lead Funnel */}
            <div className="glass-card">
              <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Lead Conversion Funnel</h3>
              <p className="text-slate-500 text-xs mb-4">Pipeline conversion stages</p>
              {leadFunnel.length === 0 ? <EmptyChart /> : (
                <div className="space-y-3 mt-6">
                  {leadFunnel.map((f, i) => {
                    const pct = Math.round((f.value / leadFunnel[0].value) * 100);
                    return (
                      <div key={f.stage}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{f.stage}</span>
                          <div className="flex gap-2">
                            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{f.value}</span>
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
              )}
            </div>
          </div>

          {/* Top Performers */}
          <div className="glass-card !p-0 overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Top Performers</h3>
            </div>
            {topPerformers.length === 0 ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <p style={{ textAlign: 'center', fontSize: 13 }}>No data yet — add records via Google Sheets</p>
              </div>
            ) : (
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
                    {topPerformers.map((p, i) => (
                      <tr key={p.name}>
                        <td>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-slate-400/20 text-slate-500' : 'bg-orange-500/20 text-orange-400'}`}>
                            #{i + 1}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="avatar">{p.name.split(' ').map((n: string) => n[0]).join('')}</div>
                            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                          </div>
                        </td>
                        <td><span className="badge badge-blue">{p.dept}</span></td>
                        <td className="text-green-400 font-semibold">{p.revenue > 0 ? `₹${(p.revenue / 100000).toFixed(1)}L` : '—'}</td>
                        <td style={{ color: 'var(--text-primary)' }}>{p.deals || '—'}</td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="progress-bar w-20">
                              <div className="progress-fill" style={{ width: `${p.score}%`, background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)' }} />
                            </div>
                            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{p.score}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ FINANCIAL ═══ */}
      {tab === 'financial' && (
        <div className="space-y-6">
          <div className="stat-grid-auto grid gap-4">
            {[
              {
                label: 'Total Payroll Cost',
                value: payrollTrend.length > 0
                  ? `₹${(payrollTrend[payrollTrend.length - 1].amount / 100000).toFixed(1)}L`
                  : '—',
                sub: payrollTrend.length > 0 ? `${payrollTrend[payrollTrend.length - 1].month}` : 'No data',
                icon: DollarSign,
                iconCls: 'icon-blue',
              },
              {
                label: 'Expense Claims',
                value: '—',
                sub: 'No expense API data',
                icon: TrendingUp,
                iconCls: 'icon-orange',
              },
              {
                label: 'Revenue (MTD)',
                value: '—',
                sub: 'No revenue API data',
                icon: Target,
                iconCls: 'icon-green',
              },
              {
                label: 'Net Profit Est.',
                value: '—',
                sub: 'No profit API data',
                icon: BarChart2,
                iconCls: 'icon-purple',
              },
            ].map((s, i) => (
              <div key={s.label} className={`glass-card fade-up stagger-${i + 1}`}>
                <div className={`icon-box ${s.iconCls} mb-3`}><s.icon size={20} /></div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
                <p className="text-slate-500 text-sm font-semibold mt-1">{s.label}</p>
                <p className="text-slate-500 text-xs">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="glass-card">
            <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Payroll Cost Trend</h3>
            <p className="text-slate-500 text-xs mb-4">Monthly payroll (INR)</p>
            {payrollTrend.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={payrollTrend}>
                  <CartesianGrid {...GRID_PROPS} vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_STYLE} />
                  <YAxis axisLine={false} tickLine={false} tick={AXIS_STYLE} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip content={<DarkTooltip />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                  <Line type="monotone" dataKey="amount" name="Payroll Cost" stroke="#f97316" strokeWidth={2.5} dot={{ fill: '#f97316', r: 4 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ═══ CUSTOM ═══ */}
      {tab === 'custom' && (
        <div className="glass-card py-20 text-center">
          <BarChart2 size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Custom Analytics Builder</h3>
          <p className="text-slate-500 text-sm">Drag-and-drop report builder coming soon. Configure custom KPIs, date ranges, and chart types.</p>
          <button className="btn btn-primary mt-6">Request Access</button>
        </div>
      )}
    </div>
  );
}
