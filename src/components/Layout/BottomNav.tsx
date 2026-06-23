import { NavLink, useLocation } from 'react-router';
import { LayoutDashboard, Users, Calendar, CheckSquare, LayoutGrid } from 'lucide-react';

const TABS = [
  { to: '/',         icon: LayoutDashboard, label: 'Home',   end: true },
  { to: '/employees',icon: Users,           label: 'People', end: false },
  { to: '/leave',    icon: Calendar,        label: 'Leave',  end: false },
  { to: '/tasks',    icon: CheckSquare,     label: 'Tasks',  end: false },
  { to: '/more',     icon: LayoutGrid,      label: 'More',   end: false },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav mobile-only">
      {TABS.map(({ to, icon: Icon, label, end }) => {
        const isActive = end
          ? location.pathname === to
          : location.pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={`bottom-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="bnav-icon">
              <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
            </span>
            <span className="bnav-label">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
