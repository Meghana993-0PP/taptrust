/**
 * Property-based tests for Chat_Service (Properties 34–36).
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
    customer_id: 10,
    provider_id: 1,
    service_category: 'Plumbing',
    scheduled_date: '2025-12-01',
    scheduled_time: '10:00:00',
    service_address: '123 Main St',
    status: 'Accepted',
    estimated_cost: 60.0,
    rejection_reason: null,
    start_timestamp: null,
    end_timestamp: null,
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
    user_id: 20,
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

function makeMessageRow(overrides = {}) {
  return {
    id: 1,
    booking_id: 1,
    sender_id: 10,
    receiver_id: 20,
    message_text: 'Hello!',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Chat Property Tests (Properties 34–36)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Property 34: Chat is only accessible to booking participants ──────────────
  // Feature: taptrust-platform, Property 34: Chat is only accessible to booking participants
  it('Property 34: non-participants receive 403 when accessing chat history', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),   // bookingId
        fc.integer({ min: 100, max: 9999 }), // customerId (participant)
        fc.integer({ min: 100, max: 9999 }), // providerUserId (participant)
        fc.integer({ min: 100, max: 9999 }), // outsiderId (non-participant)
        async (bookingId, customerId, providerUserId, outsiderId) => {
          // Ensure outsider is different from both participants
          fc.pre(outsiderId !== customerId && outsiderId !== providerUserId);

          pool.query.mockReset();

          const booking = makeBookingRow({
            id: bookingId,
            customer_id: customerId,
            provider_id: 1,
          });
          const provider = makeProviderRow({ id: 1, user_id: providerUserId });

          // Non-participant request: findById booking, then findById provider
          pool.query
            .mockResolvedValueOnce([[booking]])   // bookingModel.findById
            .mockResolvedValueOnce([[provider]]); // providerModel.findById

          const outsiderToken = makeToken(outsiderId, 'Customer');
          const res = await request(app)
            .get(`/api/v1/chat/${bookingId}/history`)
            .set('Authorization', `Bearer ${outsiderToken}`);

          expect(res.status).toBe(403);
          expect(res.body.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 35: Chat messages are persisted with all required fields ─────────
  // Feature: taptrust-platform, Property 35: Chat messages are persisted with all required fields
  it('Property 35: messages returned from history contain all required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),    // bookingId
        fc.integer({ min: 10000, max: 19999 }), // customerId (distinct range)
        fc.integer({ min: 20000, max: 29999 }), // providerUserId (distinct range)
        fc.array(
          fc.record({
            text: fc.string({ minLength: 1, maxLength: 200 }),
            offsetMs: fc.integer({ min: 0, max: 1000000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (bookingId, customerId, providerUserId, messageInputs) => {
          pool.query.mockReset();

          // customerId is the requester — matches booking.customer_id directly,
          // so isParticipant returns true without calling providerModel.findById
          const booking = makeBookingRow({
            id: bookingId,
            customer_id: customerId,
            provider_id: 1,
          });

          const baseTime = new Date('2025-01-01T00:00:00Z').getTime();
          const messages = messageInputs.map((m, i) => makeMessageRow({
            id: i + 1,
            booking_id: bookingId,
            sender_id: customerId,
            receiver_id: providerUserId,
            message_text: m.text,
            created_at: new Date(baseTime + m.offsetMs).toISOString(),
          }));

          // customer_id === userId → isParticipant returns true immediately
          // so only 2 pool.query calls: findById(booking) + findByBookingId(messages)
          pool.query
            .mockResolvedValueOnce([[booking]])  // bookingModel.findById
            .mockResolvedValueOnce([messages]);  // messageModel.findByBookingId

          const token = makeToken(customerId, 'Customer');
          const res = await request(app)
            .get(`/api/v1/chat/${bookingId}/history`)
            .set('Authorization', `Bearer ${token}`);

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);

          // Every message must have all required fields
          for (const msg of res.body.data) {
            expect(msg).toHaveProperty('sender_id');
            expect(msg).toHaveProperty('receiver_id');
            expect(msg).toHaveProperty('booking_id');
            expect(msg).toHaveProperty('message_text');
            expect(msg).toHaveProperty('created_at');
            expect(msg.booking_id).toBe(bookingId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 36: Chat history is returned ordered by timestamp ascending ──────
  // Feature: taptrust-platform, Property 36: Chat history is returned ordered by timestamp ascending
  it('Property 36: chat history messages are ordered by created_at ascending', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),    // bookingId
        fc.integer({ min: 10000, max: 19999 }), // customerId (distinct range)
        fc.integer({ min: 20000, max: 29999 }), // providerUserId (distinct range)
        fc.array(
          fc.integer({ min: 0, max: 1000000 }),  // timestamp offsets in ms
          { minLength: 2, maxLength: 15 }
        ),
        async (bookingId, customerId, providerUserId, offsets) => {
          pool.query.mockReset();

          // customer_id === userId → isParticipant returns true immediately
          const booking = makeBookingRow({
            id: bookingId,
            customer_id: customerId,
            provider_id: 1,
          });

          const baseTime = new Date('2025-01-01T00:00:00Z').getTime();
          // Sort ascending as DB would return
          const sortedOffsets = [...offsets].sort((a, b) => a - b);
          const messages = sortedOffsets.map((offset, i) => makeMessageRow({
            id: i + 1,
            booking_id: bookingId,
            sender_id: customerId,
            receiver_id: providerUserId,
            message_text: `Message ${i}`,
            created_at: new Date(baseTime + offset).toISOString(),
          }));

          pool.query
            .mockResolvedValueOnce([[booking]])  // bookingModel.findById
            .mockResolvedValueOnce([messages]);  // messageModel.findByBookingId

          const token = makeToken(customerId, 'Customer');
          const res = await request(app)
            .get(`/api/v1/chat/${bookingId}/history`)
            .set('Authorization', `Bearer ${token}`);

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);

          const returned = res.body.data;
          // Verify ascending order
          for (let i = 0; i < returned.length - 1; i++) {
            const curr = new Date(returned[i].created_at).getTime();
            const next = new Date(returned[i + 1].created_at).getTime();
            expect(curr).toBeLessThanOrEqual(next);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
