import { useState } from 'react';
import { Menu, Bell, Search, ChevronDown, LogOut, User, Settings, X, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLocation } from 'react-router';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/':             { title: 'Dashboard',     subtitle: "Welcome back, Harsh" },
  '/employees':    { title: 'Employees',     subtitle: 'Manage your workforce' },
  '/attendance':   { title: 'Attendance',    subtitle: 'Daily tracking' },
  '/leave':        { title: 'Leave',         subtitle: 'Requests & approvals' },
  '/payroll':      { title: 'Payroll',       subtitle: 'Run & manage payroll' },
  '/recruitment':  { title: 'Recruitment',   subtitle: 'Hire top talent' },
  '/performance':  { title: 'Performance',   subtitle: 'Reviews & ratings' },
  '/tasks':        { title: 'Tasks',         subtitle: 'Track assignments' },
  '/training':     { title: 'Training',      subtitle: 'Courses & upskilling' },
  '/crm':          { title: 'CRM',           subtitle: 'Client relationships' },
  '/inventory':    { title: 'Inventory',     subtitle: 'Stock management' },
  '/assets':       { title: 'Assets',        subtitle: 'Company equipment' },
  '/expenses':     { title: 'Expenses',      subtitle: 'Claims & tracking' },
  '/helpdesk':     { title: 'Helpdesk',      subtitle: 'Support tickets' },
  '/visitors':     { title: 'Visitors',      subtitle: 'Log & manage' },
  '/announcements':{ title: 'Communication', subtitle: 'Company announcements' },
  '/analytics':    { title: 'Analytics',     subtitle: 'Data-driven insights' },
  '/ai-assistant': { title: 'AI Assistant',  subtitle: 'Powered by AI' },
  '/settings':     { title: 'Settings',      subtitle: 'Your preferences' },
  '/more':         { title: 'All Modules',   subtitle: 'NeXHR Enterprise' },
};

interface Notif {
  id: string; text: string; time: string; read: boolean; type: 'info'|'warning'|'success';
}
const NOTIFS: Notif[] = [
  { id:'1', text:'3 leave requests awaiting approval', time:'2m ago', read:false, type:'warning' },
  { id:'2', text:'June payroll is ready to process',   time:'1h ago', read:false, type:'info' },
  { id:'3', text:'New candidate applied for Senior Dev',time:'3h ago', read:false, type:'success' },
  { id:'4', text:'Monthly report has been generated',  time:'1d ago', read:true,  type:'info' },
];
const NOTIF_COLORS = { info:'#3b82f6', warning:'#f59e0b', success:'#10b981' };

export default function Header() {
  const { currentUser, setSidebarOpen, sidebarOpen, darkMode, toggleDarkMode } = useApp();
  const [showProfile, setShowProfile]   = useState(false);
  const [showNotifs,  setShowNotifs]    = useState(false);
  const [showSearch,  setShowSearch]    = useState(false);
  const [searchVal,   setSearchVal]     = useState('');
  const location = useLocation();

  const pageInfo = pageTitles[location.pathname] ?? { title:'NeXHR', subtitle:'Enterprise Suite' };
  const unread   = NOTIFS.filter(n => !n.read).length;

  /* ── Search Overlay (mobile full-screen, desktop inline) ── */
  const SearchOverlay = () => (
    <div className="search-overlay mobile-only" onClick={() => setShowSearch(false)}>
      <div className="search-overlay-input" onClick={e => e.stopPropagation()}>
        <Search size={18} style={{ color:'#3b82f6', flexShrink:0 }} />
        <input
          autoFocus
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          placeholder="Search employees, modules…"
        />
        <button onClick={() => setShowSearch(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>
          <X size={18} />
        </button>
      </div>
      {/* Quick suggestions */}
      <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
        {['Employees','Leave Management','Payroll','Analytics','Helpdesk'].map(s => (
          <div key={s} style={{ padding:'12px 16px', borderRadius:'12px', background:'#f8fafc', fontSize:'14px', color:'#334155', display:'flex', alignItems:'center', gap:'10px' }}>
            <Search size={14} style={{ color:'#94a3b8' }} />{s}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {showSearch && <SearchOverlay />}

      {/* ── DESKTOP Header ── */}
      <header className="desktop-only" style={{
        height:'64px', display:'flex', alignItems:'center',
        padding:'0 20px', gap:'16px', position:'sticky', top:0, zIndex:20,
        background:'rgba(255,255,255,0.95)', backdropFilter:'blur(20px)',
        borderBottom:'1.5px solid rgba(226,232,240,0.9)',
        boxShadow:'0 1px 8px rgba(0,0,0,0.06)', flexShrink:0,
      }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
          padding:'8px', borderRadius:'10px', flexShrink:0,
          background:'#f1f5f9', border:'1px solid #e2e8f0',
          cursor:'pointer', display:'flex', alignItems:'center', color:'#475569',
        }}>
          <Menu size={18} />
        </button>

        <div style={{ minWidth:0 }}>
          <h1 style={{ fontSize:'15px', fontWeight:700, color:'#0f172a', lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {pageInfo.title}
          </h1>
          <p style={{ fontSize:'11px', color:'#64748b', whiteSpace:'nowrap' }}>{pageInfo.subtitle}</p>
        </div>

        <div className="search-box" style={{ flex:1, maxWidth:'320px', marginLeft:'8px', display:'flex' }}>
          <Search size={15} style={{ color:'#94a3b8', flexShrink:0 }} />
          <input value={searchVal} onChange={e => setSearchVal(e.target.value)} placeholder="Search…" style={{ background:'transparent', border:'none', outline:'none', fontSize:'13px', color:'#0f172a', width:'100%' }} />
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginLeft:'auto', flexShrink:0 }}>
          <div style={{ padding:'6px 12px', borderRadius:'8px', background:'#f8fafc', border:'1px solid #e2e8f0', fontSize:'11.5px', color:'#475569', whiteSpace:'nowrap' }}>
            {new Date().toLocaleDateString('en-IN',{ weekday:'short', day:'numeric', month:'short', year:'numeric' })}
          </div>

          {/* Dark mode toggle */}
          <button onClick={toggleDarkMode} title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'} style={{
            padding:'8px', borderRadius:'10px',
            background: darkMode ? 'rgba(99,130,246,0.12)' : '#f8fafc',
            border:`1px solid ${darkMode ? 'rgba(99,130,246,0.3)' : '#e2e8f0'}`,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            color: darkMode ? '#93c5fd' : '#475569',
            transition:'all 0.2s',
          }}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications */}
          <div style={{ position:'relative' }}>
            <button onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }} style={{
              padding:'8px', borderRadius:'10px', position:'relative',
              background: showNotifs ? '#eff6ff' : '#f8fafc',
              border:`1px solid ${showNotifs ? '#bfdbfe' : '#e2e8f0'}`,
              cursor:'pointer', display:'flex', alignItems:'center', color:'#475569',
            }}>
              <Bell size={18} />
              {unread > 0 && <span style={{ position:'absolute', top:'4px', right:'4px', width:'16px', height:'16px', borderRadius:'50%', background:'#ef4444', fontSize:'9px', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, border:'2px solid #fff' }}>{unread}</span>}
            </button>
            {showNotifs && (
              <div className="glass-card" style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:'320px', zIndex:50, padding:0, overflow:'hidden', borderRadius:'16px' }}>
                <div style={{ padding:'14px 16px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'13px', fontWeight:700, color:'#0f172a' }}>Notifications</span>
                  <span className="badge badge-blue">{unread} new</span>
                </div>
                {NOTIFS.map(n => (
                  <div key={n.id} style={{ padding:'12px 16px', borderBottom:'1px solid #f8fafc', display:'flex', gap:'10px', background: n.read ? 'transparent' : '#eff6ff', cursor:'pointer' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: NOTIF_COLORS[n.type], flexShrink:0, marginTop:'5px', opacity: n.read ? 0.3 : 1 }} />
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:'12.5px', color: n.read ? '#64748b' : '#0f172a', lineHeight:1.4 }}>{n.text}</p>
                      <p style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px' }}>{n.time}</p>
                    </div>
                  </div>
                ))}
                <div style={{ padding:'10px 16px', textAlign:'center', borderTop:'1px solid #f1f5f9' }}>
                  <button style={{ fontSize:'12px', color:'#2563eb', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>View all</button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div style={{ position:'relative' }}>
            <button onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }} style={{
              display:'flex', alignItems:'center', gap:'8px', padding:'6px 10px', borderRadius:'10px',
              background: showProfile ? '#eff6ff' : '#f8fafc',
              border:`1px solid ${showProfile ? '#bfdbfe' : '#e2e8f0'}`,
              cursor:'pointer',
            }}>
              <div className="avatar" style={{ width:'30px', height:'30px', fontSize:'11px' }}>{currentUser.avatar}</div>
              <div style={{ textAlign:'left' }}>
                <p style={{ fontSize:'13px', fontWeight:700, color:'#0f172a', lineHeight:1.2, whiteSpace:'nowrap' }}>{currentUser.name}</p>
                <p style={{ fontSize:'10.5px', color:'#64748b', whiteSpace:'nowrap' }}>{currentUser.role}</p>
              </div>
              <ChevronDown size={13} style={{ color:'#94a3b8', transform: showProfile ? 'rotate(180deg)' : '', transition:'transform 0.2s' }} />
            </button>
            {showProfile && (
              <div className="glass-card" style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:'210px', zIndex:50, padding:0, overflow:'hidden', borderRadius:'14px' }}>
                <div style={{ padding:'14px 16px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:'10px' }}>
                  <div className="avatar">{currentUser.avatar}</div>
                  <div><p style={{ fontSize:'13px', fontWeight:700, color:'#0f172a' }}>{currentUser.name}</p><p style={{ fontSize:'11px', color:'#64748b' }}>{currentUser.role}</p></div>
                </div>
                {[{icon:<User size={14}/>, label:'My Profile'},{icon:<Settings size={14}/>, label:'Settings'}].map(({icon,label}) => (
                  <button key={label} style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'10px 16px', background:'none', border:'none', cursor:'pointer', color:'#475569', fontSize:'13px', textAlign:'left' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background='#f8fafc';}} onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='none';}}>
                    {icon}{label}
                  </button>
                ))}
                <div style={{ borderTop:'1px solid #f1f5f9' }}>
                  <button style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'10px 16px', background:'none', border:'none', cursor:'pointer', color:'#dc2626', fontSize:'13px', textAlign:'left' }}>
                    <LogOut size={14} />Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MOBILE Header ── */}
      <header className="mobile-only mobile-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px' }}>
        {/* Left: Avatar + Title */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1, minWidth:0 }}>
          <div style={{
            width:'36px', height:'36px', borderRadius:'12px', flexShrink:0,
            background:'linear-gradient(135deg,#2563eb,#1d4ed8)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontSize:'12px', fontWeight:800,
          }}>
            HD
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:'15px', fontWeight:700, color:'#0f172a', lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {pageInfo.title}
            </p>
            <p style={{ fontSize:'11px', color:'#64748b' }}>{pageInfo.subtitle}</p>
          </div>
        </div>

        {/* Right: Search + Dark toggle + Bell */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
          <button onClick={() => setShowSearch(true)} style={{
            width:'38px', height:'38px', borderRadius:'12px',
            background:'#f1f5f9', border:'1px solid #e2e8f0',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', color:'#475569',
          }}>
            <Search size={17} />
          </button>

          <button onClick={toggleDarkMode} title={darkMode ? 'Light Mode' : 'Dark Mode'} style={{
            width:'38px', height:'38px', borderRadius:'12px',
            background: darkMode ? 'rgba(99,130,246,0.15)' : '#f1f5f9',
            border: `1px solid ${darkMode ? 'rgba(99,130,246,0.35)' : '#e2e8f0'}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', color: darkMode ? '#93c5fd' : '#475569',
            transition:'all 0.2s',
          }}>
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button onClick={() => setShowNotifs(!showNotifs)} style={{
            width:'38px', height:'38px', borderRadius:'12px', position:'relative',
            background: showNotifs ? '#eff6ff' : '#f1f5f9',
            border:`1px solid ${showNotifs ? '#bfdbfe' : '#e2e8f0'}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', color:'#475569',
          }}>
            <Bell size={17} />
            {unread > 0 && <span style={{ position:'absolute', top:'5px', right:'5px', width:'13px', height:'13px', borderRadius:'50%', background:'#ef4444', fontSize:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, border:'1.5px solid #fff' }}>{unread}</span>}
          </button>
        </div>

        {/* Mobile notification bottom sheet */}
        {showNotifs && (
          <>
            <div className="bottom-sheet-overlay" onClick={() => setShowNotifs(false)} />
            <div className="bottom-sheet mobile-only">
              <div className="bottom-sheet-handle" />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                <span style={{ fontSize:'16px', fontWeight:700, color:'#0f172a' }}>Notifications</span>
                <span className="badge badge-blue">{unread} new</span>
              </div>
              {NOTIFS.map(n => (
                <div key={n.id} style={{ padding:'12px', marginBottom:'8px', borderRadius:'14px', background: n.read ? '#f8fafc' : '#eff6ff', display:'flex', gap:'12px', alignItems:'flex-start' }}>
                  <div style={{ width:'10px', height:'10px', borderRadius:'50%', background: NOTIF_COLORS[n.type], flexShrink:0, marginTop:'4px', opacity: n.read ? 0.4 : 1 }} />
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:'13px', color: n.read ? '#64748b' : '#0f172a', lineHeight:1.4, fontWeight: n.read ? 400 : 500 }}>{n.text}</p>
                    <p style={{ fontSize:'11px', color:'#94a3b8', marginTop:'3px' }}>{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </header>

      {(showProfile || showNotifs) && (
        <div className="fixed inset-0 desktop-only" style={{ zIndex:19 }}
          onClick={() => { setShowProfile(false); setShowNotifs(false); }} />
      )}
    </>
  );
}
