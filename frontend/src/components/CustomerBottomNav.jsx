/**
 * Customer Bottom Navigation Bar
 * Home | Bookings | Book Now (+) | Messages | Profile
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Home',     icon: '🏠', path: '/customer/search' },
  { label: 'Bookings', icon: '📋', path: '/customer/bookings' },
  { label: 'Book Now', icon: '+',  path: null, center: true },
  { label: 'Messages', icon: '💬', path: '/customer/search' },
  { label: 'Profile',  icon: '👤', path: '/customer/profile' },
];

export default function CustomerBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  if (user?.role !== 'Customer') return null;

  return (
    <>
      {/* Spacer so content isn't hidden behind nav */}
      <div style={{ height: 72 }} />

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: '#fff',
        borderTop: '1px solid #e5e7eb',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        display: 'flex', alignItems: 'center',
        height: 64, paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.path && location.pathname === item.path;

          if (item.center) {
            return (
              <button
                key={item.label}
                onClick={() => navigate('/customer/search')}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'none', border: 'none', cursor: 'pointer',
                  position: 'relative', top: -18,
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.45)',
                  color: '#fff', fontSize: 28, fontWeight: 300,
                  lineHeight: 1,
                }}>
                  +
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#4f46e5',
                  marginTop: 4,
                }}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.label}
              onClick={() => item.path && navigate(item.path)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 0',
              }}
            >
              <span style={{
                fontSize: 22,
                filter: isActive ? 'none' : 'grayscale(1) opacity(0.5)',
              }}>
                {item.icon}
              </span>
              <span style={{
                fontSize: 11, fontWeight: isActive ? 700 : 500,
                color: isActive ? '#4f46e5' : '#6b7280',
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
