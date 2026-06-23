import { NavLink } from 'react-router';
import {
  Users, Clock, Calendar, DollarSign, Briefcase, TrendingUp,
  CheckSquare, BookOpen, Target, Package, BarChart3, Wallet,
  HelpCircle, UserCheck, MessageSquare, LineChart, Bot, Settings,
  ChevronRight, Building2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Module {
  to: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
  color: string;
  bg: string;
}

const MODULES: { group: string; items: Module[] }[] = [
  {
    group: 'HR Core',
    items: [
      { to:'/employees',  icon:<Users size={20}/>,       label:'Employees',    sub:'142 active',   color:'#2563eb', bg:'#eff6ff' },
      { to:'/attendance', icon:<Clock size={20}/>,       label:'Attendance',   sub:'Today 83%',    color:'#0891b2', bg:'#ecfeff' },
      { to:'/leave',      icon:<Calendar size={20}/>,    label:'Leave',        sub:'7 pending',    color:'#f59e0b', bg:'#fffbeb' },
      { to:'/payroll',    icon:<DollarSign size={20}/>,  label:'Payroll',      sub:'₹28.5L/mo',    color:'#059669', bg:'#f0fdf4' },
    ],
  },
  {
    group: 'Talent',
    items: [
      { to:'/recruitment', icon:<Briefcase size={20}/>,  label:'Recruitment',  sub:'5 open jobs',  color:'#7c3aed', bg:'#f5f3ff' },
      { to:'/performance', icon:<TrendingUp size={20}/>, label:'Performance',  sub:'Q2 reviews',   color:'#db2777', bg:'#fdf2f8' },
      { to:'/tasks',       icon:<CheckSquare size={20}/>,label:'Tasks',        sub:'34 active',    color:'#ea580c', bg:'#fff7ed' },
      { to:'/training',    icon:<BookOpen size={20}/>,   label:'Training',     sub:'6 courses',    color:'#0891b2', bg:'#ecfeff' },
    ],
  },
  {
    group: 'Business',
    items: [
      { to:'/crm',       icon:<Target size={20}/>,     label:'CRM',         sub:'24 leads',     color:'#059669', bg:'#f0fdf4' },
      { to:'/inventory', icon:<Package size={20}/>,    label:'Inventory',   sub:'6 items',      color:'#7c3aed', bg:'#f5f3ff' },
      { to:'/assets',    icon:<BarChart3 size={20}/>,  label:'Assets',      sub:'Manage all',   color:'#2563eb', bg:'#eff6ff' },
      { to:'/expenses',  icon:<Wallet size={20}/>,     label:'Expenses',    sub:'Track costs',  color:'#ea580c', bg:'#fff7ed' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { to:'/helpdesk',      icon:<HelpCircle size={20}/>,   label:'Helpdesk',   sub:'12 tickets',    color:'#db2777', bg:'#fdf2f8' },
      { to:'/visitors',      icon:<UserCheck size={20}/>,    label:'Visitors',   sub:"Today's log",   color:'#f59e0b', bg:'#fffbeb' },
      { to:'/announcements', icon:<MessageSquare size={20}/>,label:'Communication',sub:'3 new',       color:'#0891b2', bg:'#ecfeff' },
    ],
  },
  {
    group: 'Insights',
    items: [
      { to:'/analytics',    icon:<LineChart size={20}/>, label:'Analytics',    sub:'Live data',    color:'#2563eb', bg:'#eff6ff' },
      { to:'/ai-assistant', icon:<Bot size={20}/>,       label:'AI Assistant', sub:'Ask anything', color:'#7c3aed', bg:'#f5f3ff' },
      { to:'/settings',     icon:<Settings size={20}/>,  label:'Settings',     sub:'Preferences',  color:'#475569', bg:'#f8fafc' },
    ],
  },
];

import React from 'react';

export default function More() {
  const { currentUser } = useApp();

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>

      {/* Profile card — mobile hero */}
      <div style={{
        background:'linear-gradient(135deg,#1e3a8a,#2563eb,#059669)',
        borderRadius:'0 0 28px 28px',
        padding:'20px 16px 28px',
        marginBottom:'20px',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:'-30px', right:'-20px', width:'140px', height:'140px', borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
        <div style={{ display:'flex', alignItems:'center', gap:'14px', position:'relative' }}>
          <div style={{
            width:'52px', height:'52px', borderRadius:'18px',
            background:'rgba(255,255,255,0.2)',
            border:'2px solid rgba(255,255,255,0.4)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'16px', fontWeight:800, color:'#fff',
          }}>
            {currentUser.avatar}
          </div>
          <div>
            <p style={{ fontSize:'17px', fontWeight:800, color:'#fff', lineHeight:1.2 }}>{currentUser.name}</p>
            <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.75)', marginTop:'2px' }}>{currentUser.role}</p>
          </div>
          <NavLink to="/settings" style={{ marginLeft:'auto', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'10px', padding:'8px', display:'flex', textDecoration:'none' }}>
            <Settings size={16} color="#fff" />
          </NavLink>
        </div>

        {/* Quick stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginTop:'20px', position:'relative' }}>
          {[['142','Employees'],['83%','Attendance'],['7','Leaves']].map(([val,lbl]) => (
            <div key={lbl} style={{ textAlign:'center', background:'rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 8px' }}>
              <p style={{ fontSize:'18px', fontWeight:800, color:'#fff', lineHeight:1 }}>{val}</p>
              <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.7)', marginTop:'3px' }}>{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Module groups */}
      <div style={{ padding:'0 var(--mobile-pad, 16px)', display:'flex', flexDirection:'column', gap:'24px' }}>
        {MODULES.map(({ group, items }) => (
          <div key={group}>
            <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'0.08em', color:'#94a3b8', textTransform:'uppercase', marginBottom:'10px' }}>
              {group}
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {items.map(mod => (
                <NavLink
                  key={mod.to}
                  to={mod.to}
                  style={{ textDecoration:'none' }}
                >
                  <div className="touch-card" style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px' }}>
                    <div style={{ width:'44px', height:'44px', borderRadius:'14px', background:mod.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ color:mod.color }}>{mod.icon}</span>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:'14px', fontWeight:600, color:'#0f172a', lineHeight:1.2 }}>{mod.label}</p>
                      <p style={{ fontSize:'12px', color:'#94a3b8', marginTop:'1px' }}>{mod.sub}</p>
                    </div>
                    <ChevronRight size={16} style={{ color:'#cbd5e1', flexShrink:0 }} />
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        {/* App info footer */}
        <div style={{ textAlign:'center', padding:'20px 0', borderTop:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'6px' }}>
            <Building2 size={18} style={{ color:'#2563eb' }} />
            <span style={{ fontSize:'15px', fontWeight:800, background:'linear-gradient(135deg,#2563eb,#7c3aed,#059669)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              NeXHR
            </span>
          </div>
          <p style={{ fontSize:'11px', color:'#94a3b8' }}>Enterprise Suite v2.0 • All modules</p>
        </div>
      </div>
    </div>
  );
}
