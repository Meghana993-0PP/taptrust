import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import Toast from './Toast';
import { useSocket } from '../hooks/useSocket';
import { useNotifications } from '../hooks/useNotifications';
import { colors, shadows, radius } from '../theme';

const NAV = {
  Customer: [], // Customer uses bottom nav instead of sidebar
  Provider: [
    { to: '/provider/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/provider/requests', icon: '📥', label: 'Requests' },
    { to: '/provider/jobs', icon: '🔧', label: 'Active Jobs' },
    { to: '/provider/earnings', icon: '💰', label: 'Earnings' },
  ],
  Admin: [
    { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/admin/verification', icon: '✅', label: 'Verification' },
    { to: '/admin/users', icon: '👥', label: 'Users' },
    { to: '/admin/bookings', icon: '📋', label: 'Bookings' },
    { to: '/admin/complaints', icon: '⚠️', label: 'Complaints' },
  ],
};

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();
  const { notifications, unreadCount, toasts, removeToast, markRead } = useNotifications(socket);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = NAV[user?.role] || [];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const sidebarStyle = {
    width: 240,
    background: `linear-gradient(180deg, ${colors.primaryDark} 0%, ${colors.primary} 100%)`,
    color: colors.white,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    flexShrink: 0,
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 200,
    transition: 'transform 0.25s ease',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.gray50 }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 199, display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar — hidden for Customer (they use bottom nav) */}
      {user?.role !== 'Customer' && <aside style={{
        ...sidebarStyle,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', borderBottom: 'rgba(255,255,255,0.15) 1px solid' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/logo.png"
              alt="TapTrust"
              style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8, background: '#fff', padding: 2 }}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
              TapTrust
            </div>
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            {user?.role} Portal
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: radius.md,
                marginBottom: 4, textDecoration: 'none',
                fontSize: 14, fontWeight: 500,
                color: isActive ? colors.primaryDark : 'rgba(255,255,255,0.85)',
                background: isActive ? colors.white : 'transparent',
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.15)',
        }}>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || user?.email || 'User'}
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: colors.white, padding: '8px 14px', borderRadius: radius.md,
              cursor: 'pointer', fontSize: 13, width: '100%', textAlign: 'left',
              transition: 'background 0.15s',
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>}
      {/* Main content */}
      <div style={{ flex: 1, marginLeft: user?.role !== 'Customer' ? 240 : 0, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top header */}
        {user?.role === 'Customer' ? (
          <header style={{ position: 'sticky', top: 0, zIndex: 50 }}>
            {/* Single white nav bar — no dark top bar */}
            <div style={{ background: colors.white, borderBottom: `1px solid ${colors.gray100}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: shadows.sm }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/logo.png" alt="TapTrust" style={{ width: 36, height: 36, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
                <div>
                  <div style={{ fontWeight: 900, fontSize: 17, color: colors.primary, letterSpacing: '-0.5px', lineHeight: 1 }}>TapTrust</div>
                  <div style={{ fontSize: 9, color: colors.gray400, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Home Services</div>
                </div>
              </div>
              <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {[
                  { label: 'Home', path: '/customer/search' },
                  { label: 'Services', path: '/customer/search' },
                  { label: 'My Bookings', path: '/customer/bookings' },
                  { label: 'Profile', path: '/customer/profile' },
                ].map(item => {
                  const isActive = location.pathname === item.path || (item.label === 'Home' && location.pathname === '/customer/search');
                  return (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.path)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '8px 16px', position: 'relative',
                        fontSize: 14, fontWeight: isActive ? 700 : 500,
                        color: isActive ? colors.primary : colors.gray600,
                        transition: 'color 0.15s',
                      }}
                    >
                      {item.label}
                      {isActive && (
                        <svg viewBox="0 0 60 8" style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '80%', height: 8 }}>
                          <path d="M2,6 Q15,1 30,5 Q45,9 58,4" stroke={colors.primary} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                        </svg>
                      )}
                    </button>
                  );
                })}
                {/* Notification bell */}
                <div style={{ marginLeft: 8 }}>
                  <NotificationBell notifications={notifications} unreadCount={unreadCount} markRead={markRead} />
                </div>
              </nav>
            </div>
          </header>
        ) : (
          <header style={{
            background: colors.white, borderBottom: `1px solid ${colors.gray200}`,
            padding: '0 24px', height: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: shadows.sm, position: 'sticky', top: 0, zIndex: 50,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setSidebarOpen((o) => !o)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: colors.gray600, marginRight: 4 }} className="hamburger">☰</button>
              <img src="/logo.png" alt="TapTrust" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
              <span style={{ fontWeight: 800, fontSize: 18, color: colors.primary, letterSpacing: '-0.5px' }}>TapTrust</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <NotificationBell notifications={notifications} unreadCount={unreadCount} markRead={markRead} />
            </div>
          </header>
        )}
        {/* Page content */}
        <main style={{ flex: 1, padding: user?.role === 'Customer' ? 0 : 24 }}>
          {children}
        </main>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />

      <style>{`
        @media (max-width: 768px) {
          .hamburger { display: block !important; }
          .mobile-overlay { display: block !important; }
        }
      `}</style>
    </div>
  );
}

export default Layout;
