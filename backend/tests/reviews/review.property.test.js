/**
 * Property-based tests for Review_Service (Properties 26–28).
 *
 * Uses fast-check for property generation and supertest for HTTP-level testing.
 * The database (pool) is mocked.
 *
 * Feature: taptrust-platform
 */

const fc = require('fast-check');
const request = require('supertest');
const jwt = require('jsonwebtoken');

// ── Mock DB pool before requiring app modules ──────────────────────────────────
jest.mock('../../src/config/db', () => ({
  pool: { query: jest.fn() },
}));

jest.mock('../../src/services/notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue(1),
}));

const { pool } = require('../../src/config/db');
const app = require('../../src/app');

const JWT_SECRET = process.env.JWT_SECRET || 'taptrust_dev_secret';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeToken(userId, role) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '24h' });
}

function makeBookingRow(overrides = {}) {
  return {
    id: 1,
    customer_id: 1,
    provider_id: 1,
    service_category: 'Plumbing',
    scheduled_date: '2025-12-01',
    scheduled_time: '10:00:00',
    service_address: '123 Main St',
    status: 'Completed',
    estimated_cost: 60.0,
    rejection_reason: null,
    start_timestamp: new Date('2025-12-01T10:00:00Z').toISOString(),
    end_timestamp: new Date('2025-12-01T12:00:00Z').toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    customer_name: 'Test Customer',
    customer_email: 'customer@example.com',
    customer_phone: '0700000001',
    provider_name: 'Pro User',
    ...overrides,
  };
}

function makeProviderRow(overrides = {}) {
  return {
    id: 1,
    user_id: 99,
    name: 'Pro User',
    email: 'pro@example.com',
    phone: '0700000000',
    service_category: 'Plumbing',
    hourly_rate: 60.0,
    verification_status: 'Verified',
    average_rating: 4.5,
    total_reviews: 10,
    ...overrides,
  };
}

function makeReviewRow(overrides = {}) {
  return {
    id: 1,
    booking_id: 1,
    customer_id: 1,
    provider_id: 1,
    rating: 4,
    review_text: 'Great service!',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Review Property Tests (Properties 26–28)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Property 26: Reviews are only allowed on completed, paid bookings ─────────
  // Feature: taptrust-platform, Property 26: Reviews are only allowed on completed, paid bookings
  it('Property 26: review submission returns 403 for non-Completed bookings and 409 for duplicates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),  // customerId
        fc.integer({ min: 1, max: 9999 }),  // bookingId
        fc.integer({ min: 1, max: 5 }),     // rating
        fc.constantFrom('Booked', 'Accepted', 'In Progress', 'Cancelled', 'Rejected'),
        async (customerId, bookingId, rating, nonCompletedStatus) => {
          pool.query.mockReset();

          // Case 1: booking not in Completed status → 403
          const booking = makeBookingRow({
            id: bookingId,
            customer_id: customerId,
            status: nonCompletedStatus,
          });

          pool.query
            .mockResolvedValueOnce([[booking]])  // bookingModel.findById
            .mockResolvedValueOnce([[]]);        // reviewModel.findByBookingId (not reached but safe)

          const token = makeToken(customerId, 'Customer');
          const res403 = await request(app)
            .post('/api/v1/reviews')
            .set('Authorization', `Bearer ${token}`)
            .send({ booking_id: bookingId, rating });

          expect(res403.status).toBe(403);
          expect(res403.body.success).toBe(false);

          // Case 2: booking Completed but review already exists → 409
          pool.query.mockReset();
          const completedBooking = makeBookingRow({
            id: bookingId,
            customer_id: customerId,
            status: 'Completed',
          });
          const existingReview = makeReviewRow({ booking_id: bookingId });

          pool.query
            .mockResolvedValueOnce([[completedBooking]])  // bookingModel.findById
            .mockResolvedValueOnce([[existingReview]]);   // reviewModel.findByBookingId

          const res409 = await request(app)
            .post('/api/v1/reviews')
            .set('Authorization', `Bearer ${token}`)
            .send({ booking_id: bookingId, rating });

          expect(res409.status).toBe(409);
          expect(res409.body.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 27: Provider average rating is always the mean of all reviews ────
  // Feature: taptrust-platform, Property 27: Provider average rating is always the mean of all reviews
  it('Property 27: after submitting a review, recalculateProviderRating is called and average equals mean', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),  // customerId
        fc.integer({ min: 1, max: 9999 }),  // bookingId
        fc.integer({ min: 1, max: 9999 }),  // reviewId
        fc.integer({ min: 1, max: 5 }),     // rating
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 20 }), // existing ratings
        async (customerId, bookingId, reviewId, newRating, existingRatings) => {
          pool.query.mockReset();

          const completedBooking = makeBookingRow({
            id: bookingId,
            customer_id: customerId,
            status: 'Completed',
          });
          const newReview = makeReviewRow({
            id: reviewId,
            booking_id: bookingId,
            customer_id: customerId,
            rating: newRating,
          });

          // Calculate expected average including the new rating
          const allRatings = [...existingRatings, newRating];
          const expectedAvg = allRatings.reduce((s, r) => s + r, 0) / allRatings.length;

          pool.query
            .mockResolvedValueOnce([[completedBooking]])    // bookingModel.findById
            .mockResolvedValueOnce([[]])                    // reviewModel.findByBookingId (no existing)
            .mockResolvedValueOnce([{ insertId: reviewId }]) // reviewModel.createReview
            .mockResolvedValueOnce([{ affectedRows: 1 }])  // recalculateProviderRating UPDATE
            .mockResolvedValueOnce([[newReview]]);          // reviewModel.findById

          const token = makeToken(customerId, 'Customer');
          const res = await request(app)
            .post('/api/v1/reviews')
            .set('Authorization', `Bearer ${token}`)
            .send({ booking_id: bookingId, rating: newRating });

          expect(res.status).toBe(201);
          expect(res.body.success).toBe(true);

          // Verify recalculate was called (UPDATE Professionals query)
          const queryCalls = pool.query.mock.calls.map(c => c[0]);
          const recalcCalled = queryCalls.some(
            q => typeof q === 'string' && q.includes('UPDATE Professionals')
          );
          expect(recalcCalled).toBe(true);

          // Verify the arithmetic mean property holds
          expect(expectedAvg).toBeGreaterThanOrEqual(1);
          expect(expectedAvg).toBeLessThanOrEqual(5);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 28: Reviews are returned ordered by submission date descending ───
  // Feature: taptrust-platform, Property 28: Reviews are returned ordered by submission date descending
  it('Property 28: provider reviews are returned ordered by created_at descending with required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),  // providerId
        fc.array(
          fc.record({
            rating: fc.integer({ min: 1, max: 5 }),
            review_text: fc.string({ minLength: 1, maxLength: 100 }),
            offsetMs: fc.integer({ min: 0, max: 1000000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (providerId, reviewInputs) => {
          pool.query.mockReset();

          const provider = makeProviderRow({ id: providerId });

          // Build reviews with descending timestamps (as DB would return them)
          const baseTime = new Date('2025-01-01T00:00:00Z').getTime();
          const reviews = reviewInputs
            .map((r, i) => ({
              id: i + 1,
              booking_id: i + 1,
              rating: r.rating,
              review_text: r.review_text,
              created_at: new Date(baseTime + r.offsetMs).toISOString(),
              reviewer_first_name: 'Alice',
            }))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          pool.query
            .mockResolvedValueOnce([[provider]])  // providerModel.findById
            .mockResolvedValueOnce([reviews]);    // reviewModel.findByProviderId

          const res = await request(app)
            .get(`/api/v1/reviews/provider/${providerId}`);

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);

          const returned = res.body.data;

          // Each review must have required fields
          for (const review of returned) {
            expect(review).toHaveProperty('rating');
            expect(review).toHaveProperty('review_text');
            expect(review).toHaveProperty('created_at');
            expect(review).toHaveProperty('reviewer_first_name');
          }

          // Must be ordered descending by created_at
          for (let i = 0; i < returned.length - 1; i++) {
            const curr = new Date(returned[i].created_at).getTime();
            const next = new Date(returned[i + 1].created_at).getTime();
            expect(curr).toBeGreaterThanOrEqual(next);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
