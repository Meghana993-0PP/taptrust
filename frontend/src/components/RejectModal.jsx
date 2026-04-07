import { useState } from 'react';
import { colors, radius, shadows } from '../theme';

function RejectModal({ onConfirm, onCancel, title = 'Reject Booking' }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  function handleConfirm() {
    if (!reason.trim()) { setError('Please provide a reason'); return; }
    onConfirm(reason.trim());
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: colors.white, borderRadius: radius.lg,
        boxShadow: shadows.lg, padding: 28, width: '100%', maxWidth: 440,
      }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: colors.gray900 }}>
          {title}
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: colors.gray500 }}>
          Please provide a reason for the rejection.
        </p>

        {error && (
          <div style={{ color: colors.error, fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>
        )}

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Enter rejection reason…"
          style={{
            width: '100%', padding: '10px 12px', borderRadius: radius.md,
            border: `1.5px solid ${colors.gray200}`, fontSize: 14,
            resize: 'vertical', boxSizing: 'border-box', color: colors.gray800,
            marginBottom: 20,
          }}
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '9px 20px', borderRadius: radius.md,
            border: `1.5px solid ${colors.gray200}`, background: colors.white,
            color: colors.gray700, fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button onClick={handleConfirm} style={{
            padding: '9px 20px', borderRadius: radius.md, border: 'none',
            background: colors.error, color: colors.white,
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}>
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}

export default RejectModal;
