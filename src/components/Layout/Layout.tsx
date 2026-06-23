import { Outlet } from 'react-router';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import { useApp } from '../../context/AppContext';

export default function Layout() {
  const { sidebarOpen } = useApp();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Animated background */}
      <div className="app-bg" />

      {/* Desktop sidebar — hidden on mobile via CSS */}
      <div className="desktop-sidebar">
        <Sidebar />
      </div>

      {/* Main content */}
      <div
        className="main-content-area"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0,
          marginLeft: sidebarOpen ? '260px' : '0',
          transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <Header />
        <main
          style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation — hidden on desktop via CSS */}
      <BottomNav />
    </div>
  );
}
