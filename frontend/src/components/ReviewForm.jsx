import { useState } from 'react';
import api from '../services/api';
import { colors, radius } from '../theme';

function ReviewForm({ bookingId, providerId, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) { setError('Please select a rating'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/reviews', {
        booking_id: bookingId,
        provider_id: providerId,
        rating,
        review_text: text,
      });
      onSubmitted?.();
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: colors.primaryBg, borderRadius: radius.md,
      padding: 20, border: `1px solid ${colors.primaryLight}`,
    }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, color: colors.gray800 }}>⭐ Leave a Review</h3>

      {error && (
        <div style={{ color: colors.error, fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>
      )}

      {/* Star picker */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.gray700, marginBottom: 8 }}>Rating</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s} type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 28, color: s <= (hovered || rating) ? '#f59e0b' : colors.gray300,
                transition: 'color 0.1s', padding: 0,
              }}
            >★</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.gray700, marginBottom: 6 }}>
          Review (optional)
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Share your experience…"
          style={{
            width: '100%', padding: '10px 12px', borderRadius: radius.md,
            border: `1.5px solid ${colors.gray200}`, fontSize: 14,
            resize: 'vertical', boxSizing: 'border-box', color: colors.gray800,
          }}
        />
      </div>

      <button type="submit" disabled={loading} style={{
        padding: '10px 24px', borderRadius: radius.md, border: 'none',
        background: loading ? colors.gray300 : colors.primary,
        color: colors.white, fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
      }}>
        {loading ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}

export default ReviewForm;
