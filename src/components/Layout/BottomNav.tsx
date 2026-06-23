import { NavLink, useLocation } from 'react-router';
import { LayoutDashboard, Users, Calendar, CheckSquare, LayoutGrid } from 'lucide-react';

const TABS = [
  { to: '/',          Icon: LayoutDashboard, label: 'Home',   end: true  },
  { to: '/employees', Icon: Users,           label: 'People', end: false },
  { to: '/leave',     Icon: Calendar,        label: 'Leave',  end: false },
  { to: '/tasks',     Icon: CheckSquare,     label: 'Tasks',  end: false },
  { to: '/more',      Icon: LayoutGrid,      label: 'More',   end: false },
];

const ACTIVE_COLOR   = '#2563eb';
const INACTIVE_COLOR = '#94a3b8';

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      background: 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(226,232,240,0.9)',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.07)',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'stretch',
      zIndex: 100,
      // only on mobile
    }}
      className="mobile-only"
    >
      {TABS.map(({ to, Icon, label, end }) => {
        const active = end ? pathname === to : pathname.startsWith(to);
        const color  = active ? ACTIVE_COLOR : INACTIVE_COLOR;

        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={{
              flex: '1 1 0',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              textDecoration: 'none',
              color,
              padding: '6px 4px',
              WebkitTapHighlightColor: 'transparent',
              cursor: 'pointer',
              transition: 'color 0.2s',
              userSelect: 'none',
            }}
          >
            {/* Icon pill — blue bg when active */}
            <span style={{
              width: '44px', height: '26px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '13px',
              background: active ? '#eff6ff' : 'transparent',
              transform: active ? 'translateY(-2px)' : 'none',
              transition: 'all 0.2s',
            }}>
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 2}
                color={color}
              />
            </span>

            {/* Label */}
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              lineHeight: 1,
              color,
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}>
              {label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
