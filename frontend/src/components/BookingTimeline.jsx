import { colors, radius } from '../theme';

const STAGES = [
  { key: 'Booked', label: 'Booked', icon: '📋' },
  { key: 'Accepted', label: 'Accepted', icon: '✅' },
  { key: 'In Progress', label: 'In Progress', icon: '🔧' },
  { key: 'Completed', label: 'Completed', icon: '🎉' },
];

const STATUS_ORDER = ['Booked', 'Accepted', 'In Progress', 'Completed'];

function BookingTimeline({ booking, onStatusUpdate }) {
  const currentIdx = STATUS_ORDER.indexOf(booking.status);
  const isTerminal = ['Cancelled', 'Rejected'].includes(booking.status);

  if (isTerminal) {
    return (
      <div style={{
        background: booking.status === 'Cancelled' ? '#f3f4f6' : '#fee2e2',
        borderRadius: radius.md, padding: '16px 20px',
        color: booking.status === 'Cancelled' ? colors.gray600 : '#991b1b',
        fontWeight: 600, fontSize: 14,
      }}>
        {booking.status === 'Cancelled' ? '🚫 Booking Cancelled' : `❌ Booking Rejected`}
        {booking.rejection_reason && (
          <div style={{ fontWeight: 400, marginTop: 4, fontSize: 13 }}>
            Reason: {booking.rejection_reason}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
        {STAGES.map((stage, idx) => {
          const done = idx <= currentIdx;
          const active = idx === currentIdx;
          const isLast = idx === STAGES.length - 1;

          return (
            <div key={stage.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Connector + circle row */}
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {idx > 0 && (
                  <div style={{
                    flex: 1, height: 3,
                    background: done ? colors.primary : colors.gray200,
                    transition: 'background 0.3s',
                  }} />
                )}
                <div style={{
                  width: 36, height: 36, borderRadius: radius.full,
                  background: done ? colors.primary : colors.gray200,
                  color: done ? colors.white : colors.gray400,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                  boxShadow: active ? `0 0 0 4px ${colors.primaryBg}` : 'none',
                  transition: 'all 0.3s',
                }}>
                  {stage.icon}
                </div>
                {!isLast && (
                  <div style={{
                    flex: 1, height: 3,
                    background: idx < currentIdx ? colors.primary : colors.gray200,
                    transition: 'background 0.3s',
                  }} />
                )}
              </div>

              {/* Label + timestamp */}
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <div style={{
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  color: done ? colors.primary : colors.gray400,
                }}>
                  {stage.label}
                </div>
                {stage.key === 'In Progress' && booking.start_timestamp && (
                  <div style={{ fontSize: 10, color: colors.gray400, marginTop: 2 }}>
                    {new Date(booking.start_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                {stage.key === 'Completed' && booking.end_timestamp && (
                  <div style={{ fontSize: 10, color: colors.gray400, marginTop: 2 }}>
                    {new Date(booking.end_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status update buttons for providers */}
      {onStatusUpdate && (
        <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {booking.status === 'Accepted' && (
            <button onClick={() => onStatusUpdate('In Progress')} style={actionBtn(colors.warning)}>
              🔧 Start Job
            </button>
          )}
          {booking.status === 'In Progress' && (
            <button onClick={() => onStatusUpdate('Completed')} style={actionBtn(colors.success)}>
              ✅ Mark Complete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const actionBtn = (bg) => ({
  padding: '8px 18px', borderRadius: radius.md, border: 'none',
  background: bg, color: colors.white, fontWeight: 600, fontSize: 13,
  cursor: 'pointer',
});

export default BookingTimeline;
