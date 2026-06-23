import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import {
  Users, Clock, Calendar, DollarSign, TrendingUp, CheckSquare,
  HelpCircle, Briefcase, ArrowUpRight, ArrowDownRight,
  UserPlus, Gift, Star, Activity, Target, BarChart2, Zap,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, TooltipProps,
} from 'recharts';
import { api } from '../api/client';

// ── Types ────────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalEmployees: number; presentToday: number; pendingLeaves: number;
  openJobs: number; totalTasks: number; monthlyPayroll: number;
  helpdeskTickets: number; revenueTarget: number; revenueActual: number;
}
interface RecentActivity {
  id: string; action: string; user: string; time: string;
  type: 'hire'|'leave'|'payroll'|'ticket'|'task'|'other';
}
interface Birthday { name: string; avatar: string; date: string; dept: string; type: 'birthday'|'anniversary'; }

// ── Chart Tooltip ─────────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'10px 14px', boxShadow:'0 4px 16px rgba(0,0,0,0.1)' }}>
      {label && <p style={{ fontSize:'11px', color:'#94a3b8', marginBottom:'6px', fontWeight:600 }}>{label}</p>}
      {payload.map(e => (
        <div key={e.name} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'2px' }}>
          <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:e.color, flexShrink:0 }} />
          <span style={{ fontSize:'12px', color:'#475569' }}>{e.name}:</span>
          <span style={{ fontSize:'12px', fontWeight:700, color:'#0f172a' }}>
            {typeof e.value === 'number' && (e.name||'').toLowerCase().includes('payroll')
              ? `₹${(e.value/100000).toFixed(1)}L` : e.value}
          </span>
        </div>
      ))}
    </div>
  );
}

const ACT_ICONS: Record<RecentActivity['type'], React.ReactNode> = {
  hire:<UserPlus size={13}/>, leave:<Calendar size={13}/>, payroll:<DollarSign size={13}/>,
  ticket:<HelpCircle size={13}/>, task:<CheckSquare size={13}/>, other:<Activity size={13}/>,
};
const ACT_COLORS: Record<RecentActivity['type'], string> = {
  hire:'icon-green', leave:'icon-yellow', payroll:'icon-blue',
  ticket:'icon-pink', task:'icon-purple', other:'icon-cyan',
};

// ── Quick Actions ─────────────────────────────────────────────────────────────
const QUICK = [
  {label:'Add Employee', icon:<UserPlus size={18}/>, cls:'icon-blue',   link:'/employees'},
  {label:'Approve Leave',icon:<Calendar size={18}/>,cls:'icon-yellow',  link:'/leave'},
  {label:'Run Payroll',  icon:<DollarSign size={18}/>,cls:'icon-green', link:'/payroll'},
  {label:'Post Job',     icon:<Briefcase size={18}/>,cls:'icon-purple', link:'/recruitment'},
  {label:'Add Task',     icon:<CheckSquare size={18}/>,cls:'icon-orange',link:'/tasks'},
  {label:'Analytics',    icon:<BarChart2 size={18}/>,cls:'icon-cyan',   link:'/analytics'},
  {label:'Performance',  icon:<Star size={18}/>,     cls:'icon-pink',   link:'/performance'},
  {label:'Helpdesk',     icon:<HelpCircle size={18}/>,cls:'icon-red',   link:'/helpdesk'},
];

// ── KPI card data builder ─────────────────────────────────────────────────────
function kpiCards(s: DashboardStats) {
  const pct = s.totalEmployees ? Math.round(s.presentToday/s.totalEmployees*100) : 0;
  const rev = s.revenueTarget  ? Math.round(s.revenueActual/s.revenueTarget*100) : 0;
  return [
    {label:'Employees',  value:s.totalEmployees, sub:'Active workforce',        icon:<Users size={18}/>,       clr:'stat-blue',   icl:'icon-blue',   trend:'up'  as const, tv:'+2 this month'},
    {label:'Present',    value:s.presentToday,   sub:`${pct}% attendance`,      icon:<Clock size={18}/>,       clr:'stat-green',  icl:'icon-green',  trend:'up'  as const, tv:'+5 vs yesterday'},
    {label:'Leaves',     value:s.pendingLeaves,  sub:'Pending approval',        icon:<Calendar size={18}/>,   clr:'stat-orange', icl:'icon-yellow', trend:'up'  as const, tv:`${s.pendingLeaves} requests`},
    {label:'Open Jobs',  value:s.openJobs,       sub:'Active postings',         icon:<Briefcase size={18}/>,  clr:'stat-purple', icl:'icon-purple', trend:'up'  as const, tv:'+1 this week'},
    {label:'Tasks',      value:s.totalTasks,     sub:'Active assignments',      icon:<CheckSquare size={18}/>,clr:'stat-orange', icl:'icon-orange', trend:'down'as const, tv:'-3 completed'},
    {label:'Payroll',    value:`₹${(s.monthlyPayroll/100000).toFixed(1)}L`, sub:'June 2026', icon:<DollarSign size={18}/>, clr:'stat-cyan', icl:'icon-cyan', trend:'up' as const, tv:'+1.8%'},
    {label:'Tickets',    value:s.helpdeskTickets,sub:'Open issues',             icon:<HelpCircle size={18}/>, clr:'stat-pink',   icl:'icon-pink',   trend:'down'as const, tv:'-4 resolved'},
    {label:'Revenue',    value:`${rev}%`,        sub:`₹${(s.revenueActual/100000).toFixed(0)}L of ₹${(s.revenueTarget/100000).toFixed(0)}L`, icon:<TrendingUp size={18}/>, clr:'stat-blue', icl:'icon-blue', trend:rev>=80?'up'as const:'down'as const, tv:`${rev}% achieved`},
  ];
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats,      setStats]      = useState<DashboardStats>({ totalEmployees:0, presentToday:0, pendingLeaves:0, openJobs:0, totalTasks:0, monthlyPayroll:0, helpdeskTickets:0, revenueTarget:0, revenueActual:0 });
  const [attendance, setAttendance] = useState<{month:string;present:number;absent:number;leave:number}[]>([]);
  const [payroll,    setPayroll]    = useState<{month:string;amount:number}[]>([]);
  const [depts,      setDepts]      = useState<{name:string;count:number;color:string}[]>([]);
  const [activity,   setActivity]   = useState<RecentActivity[]>([]);
  const [bdays,      setBdays]      = useState<Birthday[]>([]);

  useEffect(() => {
    api.get<{ stats: DashboardStats; monthlyAttendance: {month:string;present:number;absent:number;leave:number}[]; payrollTrend: {month:string;amount:number}[]; departmentHeadcount: {name:string;count:number;color:string}[]; recentActivity: RecentActivity[]; upcomingCelebrations: Birthday[] }>('/dashboard')
      .then(d => {
        setStats(d.stats); setAttendance(d.monthlyAttendance); setPayroll(d.payrollTrend);
        setDepts(d.departmentHeadcount); setActivity(d.recentActivity); setBdays(d.upcomingCelebrations);
      }).catch(() => {});
  }, []);

  const presentPct = stats.totalEmployees ? Math.round(stats.presentToday/stats.totalEmployees*100) : 0;
  const revPct     = stats.revenueTarget  ? Math.round(stats.revenueActual/stats.revenueTarget*100) : 0;
  const today      = new Date().toLocaleDateString('en-IN',{ weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const kpi        = kpiCards(stats);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

      {/* ── HERO BANNER ── */}
      <div className="hero-banner fade-up stagger-1">
        {/* Decorative blobs */}
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'160px', height:'160px', borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-30px', left:'25%', width:'120px', height:'120px', borderRadius:'50%', background:'rgba(16,185,129,0.12)', pointerEvents:'none' }} />

        {/* Content */}
        <div style={{ position:'relative' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'4px 10px', borderRadius:'20px', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.25)', marginBottom:'10px' }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#10b981', boxShadow:'0 0 6px #10b981' }} />
            <span style={{ fontSize:'11px', color:'#6ee7b7', fontWeight:600 }}>System Online</span>
          </div>

          {/* Responsive row: greeting + quick nums */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
            <div>
              <h1 style={{ fontSize:'clamp(18px,4vw,24px)', fontWeight:800, color:'#fff', lineHeight:1.2 }}>
                Good morning, Neha 👋
              </h1>
              <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.65)', marginTop:'4px' }}>{today}</p>
            </div>
            {/* Mini quick stats — desktop only (mobile shows KPI cards below) */}
            <div className="desktop-only" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px' }}>
              {[
                {label:'Present',value:stats.presentToday,color:'#6ee7b7'},
                {label:'On Leave',value:stats.pendingLeaves,color:'#fde68a'},
                {label:'Open Jobs',value:stats.openJobs,color:'#c4b5fd'},
                {label:'Tickets',value:stats.helpdeskTickets,color:'#f9a8d4'},
              ].map(item => (
                <div key={item.label} style={{ padding:'10px 14px', borderRadius:'12px', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.15)', textAlign:'center', minWidth:'64px' }}>
                  <p style={{ fontSize:'20px', fontWeight:800, color:item.color, lineHeight:1 }}>{item.value}</p>
                  <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.65)', marginTop:'3px' }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance progress */}
          <div style={{ marginTop:'16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
              <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.7)' }}>Today's Attendance Rate</span>
              <span style={{ fontSize:'13px', fontWeight:700, color:'#6ee7b7' }}>{presentPct}%</span>
            </div>
            <div style={{ height:'6px', borderRadius:'10px', background:'rgba(255,255,255,0.15)', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:'10px', width:`${presentPct}%`, background:'linear-gradient(90deg,#10b981,#34d399)', transition:'width 1s cubic-bezier(.4,0,.2,1)' }} />
            </div>
            <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)', marginTop:'4px' }}>
              {stats.presentToday} present · {stats.totalEmployees - stats.presentToday} absent/leave
            </p>
          </div>
        </div>
      </div>

      {/* ── MOBILE: 4 quick stat pills ── */}
      <div className="mobile-only scroll-strip" style={{ padding:'0 2px 4px' }}>
        {[
          {label:'Present', value:stats.presentToday, color:'#059669', bg:'#f0fdf4', border:'#bbf7d0'},
          {label:'Leaves',  value:stats.pendingLeaves, color:'#d97706', bg:'#fffbeb', border:'#fde68a'},
          {label:'Jobs',    value:stats.openJobs,      color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe'},
          {label:'Tickets', value:stats.helpdeskTickets, color:'#db2777', bg:'#fdf2f8', border:'#fbcfe8'},
        ].map(p => (
          <div key={p.label} style={{ flexShrink:0, background:p.bg, border:`1px solid ${p.border}`, borderRadius:'14px', padding:'10px 16px', textAlign:'center', minWidth:'80px' }}>
            <p style={{ fontSize:'22px', fontWeight:800, color:p.color, lineHeight:1 }}>{p.value}</p>
            <p style={{ fontSize:'11px', color:p.color, marginTop:'3px', fontWeight:600, opacity:0.8 }}>{p.label}</p>
          </div>
        ))}
      </div>

      {/* ── KPI STAT CARDS ── */}
      <div className="stat-grid-auto fade-up stagger-2" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:'14px' }}>
        {kpi.map(k => (
          <div key={k.label} className={`stat-card ${k.clr}`}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px' }}>
              <div className={`icon-box ${k.icl}`}>{k.icon}</div>
              <span style={{
                display:'flex', alignItems:'center', gap:'3px', fontSize:'10px', fontWeight:600,
                padding:'3px 7px', borderRadius:'20px',
                background: k.trend==='up' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color:       k.trend==='up' ? '#059669' : '#dc2626',
              }}>
                {k.trend==='up' ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}
                {k.tv}
              </span>
            </div>
            <p style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:800, color:'#0f172a', lineHeight:1 }}>{k.value}</p>
            <p style={{ fontSize:'13px', fontWeight:600, color:'#0f172a', marginTop:'5px', opacity:0.85 }}>{k.label}</p>
            <p style={{ fontSize:'11px', color:'#64748b', marginTop:'2px' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="glass-card fade-up stagger-3">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
          <h3 style={{ fontSize:'15px', fontWeight:700, color:'#0f172a' }}>Quick Actions</h3>
          <Zap size={16} style={{ color:'#f59e0b' }} />
        </div>
        {/* Mobile: 4-column icon grid. Desktop: 8-column */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px' }}>
          {QUICK.map(a => (
            <NavLink key={a.label} to={a.link} style={{ textDecoration:'none' }}>
              <div style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:'6px',
                padding:'12px 4px', borderRadius:'14px', background:'#f8fafc',
                border:'1px solid #f1f5f9', transition:'all 0.15s', cursor:'pointer',
              }}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background='#eff6ff';(e.currentTarget as HTMLDivElement).style.borderColor='#bfdbfe';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background='#f8fafc';(e.currentTarget as HTMLDivElement).style.borderColor='#f1f5f9';}}
              >
                <div className={`icon-box ${a.cls}`} style={{ width:'36px', height:'36px', borderRadius:'10px' }}>{a.icon}</div>
                <p style={{ fontSize:'10px', fontWeight:600, color:'#475569', textAlign:'center', lineHeight:1.3 }}>{a.label}</p>
              </div>
            </NavLink>
          ))}
        </div>
      </div>

      {/* ── CHARTS: Attendance + Depts ── */}
      <div className="fade-up stagger-4" style={{ display:'grid', gridTemplateColumns:'minmax(0,2fr) minmax(0,1fr)', gap:'16px' }}>
        {/* Attendance Bar Chart */}
        <div className="glass-card">
          <div style={{ marginBottom:'14px' }}>
            <h3 style={{ fontSize:'15px', fontWeight:700, color:'#0f172a' }}>Monthly Attendance</h3>
            <p style={{ fontSize:'11px', color:'#64748b', marginTop:'2px' }}>Last 6 months (%)</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={attendance} barSize={10} barGap={3}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize:10, fill:'#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize:10, fill:'#94a3b8' }} domain={[0,100]} tickFormatter={v=>`${v}%`} />
              <Tooltip content={<ChartTip />} cursor={{ fill:'rgba(37,99,235,0.04)' }} />
              <Bar dataKey="present" fill="#10b981" radius={[4,4,0,0]} name="Present %" />
              <Bar dataKey="absent"  fill="#ef4444" radius={[4,4,0,0]} name="Absent %" />
              <Bar dataKey="leave"   fill="#f59e0b" radius={[4,4,0,0]} name="Leave %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dept Pie */}
        <div className="glass-card">
          <div style={{ marginBottom:'12px' }}>
            <h3 style={{ fontSize:'14px', fontWeight:700, color:'#0f172a' }}>Departments</h3>
            <p style={{ fontSize:'11px', color:'#64748b', marginTop:'2px' }}>Headcount</p>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={depts} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="count" paddingAngle={3} strokeWidth={0}>
                {depts.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'7px 11px', fontSize:'12px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
                  <span style={{ fontWeight:700, color:payload[0].payload.color }}>{payload[0].name}</span>
                  <span style={{ color:'#475569', marginLeft:'6px' }}>{payload[0].value}</span>
                </div>
              ) : null} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
            {depts.map(d => (
              <div key={d.name} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'10.5px', color:'#475569' }}>
                <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:d.color, flexShrink:0 }} />
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name} ({d.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PAYROLL + ACTIVITY ── */}
      <div className="fade-up stagger-5" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'16px' }}>
        {/* Payroll Line */}
        <div className="glass-card">
          <div style={{ marginBottom:'12px' }}>
            <h3 style={{ fontSize:'15px', fontWeight:700, color:'#0f172a' }}>Payroll Trend</h3>
            <p style={{ fontSize:'11px', color:'#64748b', marginTop:'2px' }}>Monthly cost (₹)</p>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={payroll}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize:10, fill:'#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize:10, fill:'#94a3b8' }} tickFormatter={v=>`₹${(v/100000).toFixed(0)}L`} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'9px 13px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
                  <p style={{ fontSize:'11px', color:'#94a3b8', marginBottom:'3px', fontWeight:600 }}>{label}</p>
                  <p style={{ fontSize:'13px', fontWeight:700, color:'#2563eb' }}>₹{((payload[0].value as number)/100000).toFixed(2)}L</p>
                </div>
              ) : null} cursor={{ stroke:'rgba(37,99,235,0.15)', strokeWidth:1 }} />
              <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2.5}
                dot={{ fill:'#2563eb', r:3, strokeWidth:0 }}
                activeDot={{ r:5, fill:'#60a5fa', strokeWidth:0 }}
                name="Payroll" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Feed */}
        <div className="glass-card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
            <h3 style={{ fontSize:'15px', fontWeight:700, color:'#0f172a' }}>Recent Activity</h3>
            <span className="badge badge-green">Live</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {activity.map((item, idx) => (
              <div key={item.id} style={{ display:'flex', alignItems:'flex-start', gap:'10px', paddingBottom: idx < activity.length-1 ? '10px' : 0, borderBottom: idx < activity.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                <div className={`icon-box ${ACT_COLORS[item.type]}`} style={{ width:'30px', height:'30px', borderRadius:'8px', flexShrink:0 }}>
                  {ACT_ICONS[item.type]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'12.5px', fontWeight:500, color:'#0f172a', lineHeight:1.3 }}>{item.action}</p>
                  <p style={{ fontSize:'11px', color:'#94a3b8', marginTop:'1px' }}>{item.user} · {item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── REVENUE TARGET ── */}
      <div className="glass-card fade-up stagger-5" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'20px', alignItems:'center' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
            <Target size={16} style={{ color:'#64748b' }} />
            <h3 style={{ fontSize:'15px', fontWeight:700, color:'#0f172a' }}>Revenue vs Target — June 2026</h3>
          </div>
          <p style={{ fontSize:'12px', color:'#64748b' }}>
            ₹{(stats.revenueActual/100000).toFixed(0)}L actual vs ₹{(stats.revenueTarget/100000).toFixed(0)}L target
          </p>
        </div>
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
            <span style={{ fontSize:'12px', color:'#475569' }}>Achievement</span>
            <span style={{ fontSize:'14px', fontWeight:800, color: revPct>=80 ? '#059669' : '#d97706' }}>{revPct}%</span>
          </div>
          <div className="progress-bar" style={{ height:'8px' }}>
            <div className="progress-fill" style={{ width:`${Math.min(revPct,100)}%`, background: revPct>=80 ? 'linear-gradient(90deg,#10b981,#06b6d4)' : 'linear-gradient(90deg,#f59e0b,#ef4444)' }} />
          </div>
        </div>
      </div>

      {/* ── BIRTHDAYS + ANNIVERSARIES ── */}
      <div className="fade-up stagger-6" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'16px' }}>
        {/* Birthdays */}
        <div className="glass-card">
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
            <div className="icon-box icon-pink" style={{ width:'30px', height:'30px', borderRadius:'8px' }}><Gift size={14} /></div>
            <h3 style={{ fontSize:'15px', fontWeight:700, color:'#0f172a' }}>Upcoming Birthdays</h3>
            <span className="badge badge-pink" style={{ marginLeft:'auto' }}>This month</span>
          </div>
          {bdays.filter(b=>b.type==='birthday').map(p => (
            <div key={p.name} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
              <div className="avatar">{p.avatar}</div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#0f172a' }}>{p.name}</p>
                <p style={{ fontSize:'11px', color:'#64748b' }}>{p.dept} · {p.date}</p>
              </div>
              <span className="badge badge-pink">🎂</span>
            </div>
          ))}
          {bdays.filter(b=>b.type==='birthday').length===0 && <p style={{ fontSize:'13px', color:'#94a3b8' }}>No birthdays this month</p>}
        </div>

        {/* Anniversaries */}
        <div className="glass-card">
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
            <div className="icon-box icon-purple" style={{ width:'30px', height:'30px', borderRadius:'8px' }}><Star size={14} /></div>
            <h3 style={{ fontSize:'15px', fontWeight:700, color:'#0f172a' }}>Work Anniversaries</h3>
            <span className="badge badge-purple" style={{ marginLeft:'auto' }}>Upcoming</span>
          </div>
          {bdays.filter(b=>b.type==='anniversary').map(p => (
            <div key={p.name} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
              <div className="avatar">{p.avatar}</div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#0f172a' }}>{p.name}</p>
                <p style={{ fontSize:'11px', color:'#64748b' }}>{p.dept} · {p.date}</p>
              </div>
              <span className="badge badge-purple">⭐</span>
            </div>
          ))}
          {bdays.filter(b=>b.type==='anniversary').length===0 && <p style={{ fontSize:'13px', color:'#94a3b8' }}>No anniversaries soon</p>}
        </div>
      </div>

      <div style={{ height:'8px' }} />
    </div>
  );
}
