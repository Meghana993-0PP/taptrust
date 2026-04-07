import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, radius, shadows } from '../theme';

function NotificationBell({ notifications, unreadCount, markRead }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function handleClick(notif) {
    markRead(notif.id);
    setOpen(false);
    if (notif.link) navigate(notif.link);
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          position: 'relative', padding: 8, borderRadius: radius.full,
          color: colors.gray600, fontSize: 20,
          transition: 'background 0.15s',
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            background: colors.error, color: colors.white,
            borderRadius: radius.full, fontSize: 10, fontWeight: 700,
            minWidth: 16, height: 16, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{
            position: 'fixed', inset: 0, zIndex: 100,
          }} />
          <div style={{
            position: 'absolute', right: 0, top: '110%',
            width: 320, background: colors.white,
            borderRadius: radius.lg, boxShadow: shadows.lg,
            zIndex: 101, overflow: 'hidden',
            border: `1px solid ${colors.gray200}`,
          }}>
            <div style={{
              padding: '12px 16px', borderBottom: `1px solid ${colors.gray100}`,
              fontWeight: 600, fontSize: 14, color: colors.gray800,
            }}>
              Notifications {unreadCount > 0 && (
                <span style={{
                  background: colors.primaryBg, color: colors.primary,
                  borderRadius: radius.full, fontSize: 11, padding: '2px 8px', marginLeft: 6,
                }}>{unreadCount} new</span>
              )}
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: colors.gray400, fontSize: 14 }}>
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    style={{
                      padding: '12px 16px', cursor: 'pointer',
                      background: n.is_read ? colors.white : colors.primaryBg,
                      borderBottom: `1px solid ${colors.gray100}`,
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 13, color: colors.gray800, marginBottom: 2 }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: 11, color: colors.gray400 }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
