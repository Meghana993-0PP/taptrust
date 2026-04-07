import { useNavigate } from 'react-router-dom';
import { colors, radius, shadows, STATUS_COLORS, formatINR } from '../theme';

function StarRating({ rating }) {
  const stars = Math.round(rating || 0);
  return (
    <span style={{ color: '#f59e0b', fontSize: 14 }}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
      <span style={{ color: colors.gray500, fontSize: 12, marginLeft: 4 }}>
        {Number(rating || 0).toFixed(1)}
      </span>
    </span>
  );
}

function ProviderCard({ provider }) {
  const navigate = useNavigate();
  const badge = STATUS_COLORS[provider.verification_status] || STATUS_COLORS.Pending;

  return (
    <div
      onClick={() => navigate(`/customer/providers/${provider.id}`)}
      style={{
        background: colors.white, borderRadius: radius.lg,
        boxShadow: shadows.card, padding: 20, cursor: 'pointer',
        border: `1px solid ${colors.gray100}`,
        transition: 'transform 0.15s, box-shadow 0.15s',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = shadows.lg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = shadows.card;
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: radius.full,
          background: colors.primaryBg, color: colors.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 18, flexShrink: 0,
        }}>
          {(provider.name || 'P')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: colors.gray900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {provider.name}
          </div>
          <div style={{ fontSize: 12, color: colors.gray500 }}>{provider.service_category}</div>
        </div>
        <span style={{
          background: badge.bg, color: badge.text,
          borderRadius: radius.full, fontSize: 11, padding: '3px 8px', fontWeight: 600,
        }}>
          {provider.verification_status === 'Verified' ? '✓ Verified' : provider.verification_status}
        </span>
      </div>

      {/* Rating */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <StarRating rating={provider.average_rating} />
        <span style={{ fontSize: 12, color: colors.gray400 }}>
          {provider.total_reviews || 0} review{provider.total_reviews !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 12, borderTop: `1px solid ${colors.gray100}`,
      }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 800, color: colors.primary }}>
            {formatINR(provider.hourly_rate || 0)}
          </span>
          <span style={{ fontSize: 12, color: colors.gray400 }}>/hr</span>
        </div>
        <div style={{ fontSize: 12, color: colors.gray500 }}>
          {provider.years_experience} yr{provider.years_experience !== 1 ? 's' : ''} exp
        </div>
      </div>
    </div>
  );
}

export { StarRating };
export default ProviderCard;
