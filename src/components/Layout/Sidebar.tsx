import React from 'react';
import { NavLink } from 'react-router';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  DollarSign,
  Briefcase,
  TrendingUp,
  CheckSquare,
  BookOpen,
  Target,
  Package,
  BarChart3,
  Wallet,
  HelpCircle,
  UserCheck,
  MessageSquare,
  Bot,
  Settings,
  ChevronLeft,
  Building2,
  Bell,
  LineChart,
  ShoppingCart,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NavItemDef {
  to: string;
  icon: React.ReactNode;
  label: string;
}

interface NavGroupDef {
  group: string;
  items: NavItemDef[];
}

const navGroups: NavGroupDef[] = [
  {
    group: 'CORE',
    items: [
      { to: '/', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
      { to: '/employees', icon: <Users size={17} />, label: 'Employees' },
      { to: '/attendance', icon: <Clock size={17} />, label: 'Attendance' },
      { to: '/leave', icon: <Calendar size={17} />, label: 'Leave' },
      { to: '/payroll', icon: <DollarSign size={17} />, label: 'Payroll' },
    ],
  },
  {
    group: 'TALENT',
    items: [
      { to: '/recruitment', icon: <Briefcase size={17} />, label: 'Recruitment' },
      { to: '/performance', icon: <TrendingUp size={17} />, label: 'Performance' },
      { to: '/tasks', icon: <CheckSquare size={17} />, label: 'Tasks' },
      { to: '/training', icon: <BookOpen size={17} />, label: 'Training' },
    ],
  },
  {
    group: 'BUSINESS',
    items: [
      { to: '/crm', icon: <Target size={17} />, label: 'CRM' },
      { to: '/inventory', icon: <Package size={17} />, label: 'Inventory' },
      { to: '/assets', icon: <BarChart3 size={17} />, label: 'Assets' },
      { to: '/expenses', icon: <Wallet size={17} />, label: 'Expenses' },
    ],
  },
  {
    group: 'MANAGEMENT',
    items: [
      { to: '/helpdesk', icon: <HelpCircle size={17} />, label: 'Helpdesk' },
      { to: '/visitors', icon: <UserCheck size={17} />, label: 'Visitors' },
      { to: '/announcements', icon: <MessageSquare size={17} />, label: 'Communication' },
    ],
  },
  {
    group: 'INSIGHTS',
    items: [
      { to: '/analytics', icon: <LineChart size={17} />, label: 'Analytics' },
      { to: '/ai-assistant', icon: <Bot size={17} />, label: 'AI Assistant' },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { to: '/settings', icon: <Settings size={17} />, label: 'Settings' },
    ],
  },
];

// Suppress unused import warnings for icons that are imported per spec
void ShoppingCart;

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, currentUser } = useApp();

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          minWidth: '260px',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          background: 'rgba(6,11,24,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          zIndex: 40,
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '24px 20px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              className="icon-box icon-blue"
              style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}
            >
              <Building2 size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="gradient-text"
                style={{
                  fontSize: '21px',
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  lineHeight: 1.1,
                }}
              >
                NeXHR
              </div>
              <div
                style={{
                  fontSize: '9.5px',
                  color: '#64748b',
                  letterSpacing: '1.6px',
                  marginTop: '3px',
                  textTransform: 'uppercase',
                }}
              >
                Enterprise Suite
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ padding: '6px', borderRadius: '8px', flexShrink: 0, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#94a3b8' }}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {navGroups.map((group) => (
            <div key={group.group} style={{ marginBottom: '4px' }}>
              <div
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  letterSpacing: '1.4px',
                  color: '#64748b',
                  padding: '10px 10px 4px',
                  userSelect: 'none',
                }}
              >
                {group.group}
              </div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }: { isActive: boolean }) =>
                    `nav-item${isActive ? ' active' : ''}`
                  }
                  style={{ textDecoration: 'none' }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        opacity: 0.8,
                      }}
                    >
                      {item.icon}
                    </span>
                    <span style={{ fontSize: '13.5px', fontWeight: 500 }}>{item.label}</span>
                  </span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom user section */}
        <div
          style={{
            padding: '14px 14px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          {/* Notification quick-access */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              padding: '8px 10px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Notifications</span>
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <Bell size={15} style={{ color: '#94a3b8' }} />
              <span
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  width: '13px',
                  height: '13px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  fontSize: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                3
              </span>
            </div>
          </div>

          {/* User card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background =
                'rgba(255,255,255,0.07)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background =
                'rgba(255,255,255,0.04)';
            }}
          >
            <div className="avatar" style={{ flexShrink: 0 }}>
              {currentUser.avatar}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#e2e8f0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentUser.name}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentUser.role}
              </div>
            </div>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                flexShrink: 0,
                boxShadow: '0 0 6px #10b981',
              }}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
