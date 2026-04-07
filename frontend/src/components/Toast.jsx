import { colors, radius, shadows } from '../theme';

function Toast({ toasts, removeToast }) {
  if (!toasts?.length) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          background: colors.gray800, color: colors.white,
          padding: '12px 16px', borderRadius: radius.md,
          boxShadow: shadows.lg, maxWidth: 320,
          display: 'flex', alignItems: 'center', gap: 12,
          animation: 'slideIn 0.2s ease',
        }}>
          <span style={{ flex: 1, fontSize: 14 }}>🔔 {t.message}</span>
          <button onClick={() => removeToast(t.id)} style={{
            background: 'none', border: 'none', color: colors.gray400,
            cursor: 'pointer', fontSize: 16, padding: 0,
          }}>✕</button>
        </div>
      ))}
    </div>
  );
}

export default Toast;
