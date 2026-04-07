/**
 * Property-based tests for Booking_Service (Properties 14–21).
 *
 * Uses fast-check for property generation and supertest for HTTP-level testing.
 * The database (pool) and notification service are mocked.
 *
 * Feature: taptrust-platform
 */

const fc = require('fast-check');
const request = require('supertest');
const jwt = require('jsonwebtoken');

// ── Mock DB pool and notification service before requiring app modules ─────────
jest.mock('../../src/config/db', () => ({
  pool: { query: jest.fn() },
}));

jest.mock('../../src/services/notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue(1),
}));

const { pool } = require('../../src/config/db');
const notificationService = require('../../src/services/notificationService');
const app = require('../../src/app');

const JWT_SECRET = process.env.JWT_SECRET || 'taptrust_dev_secret';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeToken(userId, role) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '24h' });
}

/** Future date string YYYY-MM-DD (days from now) */
function futureDate(daysFromNow = 1) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

/** Past date string YYYY-MM-DD */
function pastDate(daysAgo = 1) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

/** Build a mock provider row (Professionals JOIN Users) */
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
    bio: null,
    skills: null,
    ...overrides,
  };
}

/** Build a mock booking row */
function makeBookingRow(overrides = {}) {
  return {
    id: 1,
    customer_id: 1,
    provider_id: 1,
    service_category: 'Plumbing',
    scheduled_date: futureDate(2),
    scheduled_time: '10:00:00',
    service_address: '123 Main St',
    status: 'Booked',
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

/**
 * Setup pool.query mocks for a successful booking creation:
 * 1. findById (customer user) — returns active user row
 * 2. findById (provider) — returns provider row
 * 3. hasConflict — returns no conflict
 * 4. createBooking INSERT — returns insertId
 * 5. findById (booking) — returns booking row
 * 6. createNotification (customer) — handled by mock
 * 7. createNotification (provider) — handled by mock
 */
function mockSuccessfulCreate(customerId, providerId, bookingId, dateStr, timeStr) {
  const provider = makeProviderRow({ id: providerId, user_id: 99 });
  const booking = makeBookingRow({
    id: bookingId,
    customer_id: customerId,
    provider_id: providerId,
    scheduled_date: dateStr,
    scheduled_time: timeStr,
  });

  pool.query
    .mockResolvedValueOnce([[{ id: customerId, is_active: true }]]) // userModel.findById (customer)
    .mockResolvedValueOnce([[provider]])          // providerModel.findById
    .mockResolvedValueOnce([[]])                  // hasConflict → no conflict
    .mockResolvedValueOnce([{ insertId: bookingId }]) // createBooking INSERT
    .mockResolvedValueOnce([[booking]]);           // findById (booking)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Booking Property Tests (Properties 14–21)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Property 14: Booking creation produces a record with status "Booked" ──────
  // Feature: taptrust-platform, Property 14: Booking creation produces a record with status "Booked"
  it('Property 14: valid booking creation returns status "Booked" with all required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),  // customerId
        fc.integer({ min: 1, max: 9999 }),  // providerId
        fc.integer({ min: 1, max: 9999 }),  // bookingId
        fc.integer({ min: 1, max: 30 }),    // daysFromNow
        fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0), // address
        async (customerId, providerId, bookingId, days, address) => {
          pool.query.mockReset();
          notificationService.createNotification.mockReset();
          notificationService.createNotification.mockResolvedValue(1);

          const dateStr = futureDate(days);
          const timeStr = '10:00:00';

          mockSuccessfulCreate(customerId, providerId, bookingId, dateStr, timeStr);

          const token = makeToken(customerId, 'Customer');
          const res = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({
              provider_id: providerId,
              scheduled_date: dateStr,
              scheduled_time: timeStr,
              service_address: address,
            });

          expect(res.status).toBe(201);
          expect(res.body.success).toBe(true);

          const booking = res.body.data;
          expect(booking.status).toBe('Booked');
          expect(booking).toHaveProperty('customer_id');
          expect(booking).toHaveProperty('provider_id');
          expect(booking).toHaveProperty('service_category');
          expect(booking).toHaveProperty('scheduled_date');
          expect(booking).toHaveProperty('scheduled_time');
          expect(booking).toHaveProperty('service_address');
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 15: Past-date bookings are rejected ──────────────────────────────
  // Feature: taptrust-platform, Property 15: Past-date bookings are rejected
  it('Property 15: booking with past scheduled_date returns 400', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),  // customerId
        fc.integer({ min: 1, max: 9999 }),  // providerId
        fc.integer({ min: 1, max: 365 }),   // daysAgo
        async (customerId, providerId, daysAgo) => {
          pool.query.mockReset();

          const dateStr = pastDate(daysAgo);
          const token = makeToken(customerId, 'Customer');

          const res = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({
              provider_id: providerId,
              scheduled_date: dateStr,
              scheduled_time: '10:00:00',
              service_address: '123 Main St',
            });

          expect(res.status).toBe(400);
          expect(res.body.success).toBe(false);
          expect(res.body.message).toMatch(/future/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 16: Double-booking a provider is rejected ────────────────────────
  // Feature: taptrust-platform, Property 16: Double-booking a provider is rejected
  it('Property 16: booking a provider with an existing Accepted booking at same date+time returns 409', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),  // customerId
        fc.integer({ min: 1, max: 9999 }),  // providerId
        fc.integer({ min: 1, max: 30 }),    // daysFromNow
        async (customerId, providerId, days) => {
          pool.query.mockReset();

          const dateStr = futureDate(days);
          const timeStr = '10:00:00';
          const provider = makeProviderRow({ id: providerId });

          pool.query
            .mockResolvedValueOnce([[{ id: customerId, is_active: true }]]) // userModel.findById (customer)
            .mockResolvedValueOnce([[provider]])   // providerModel.findById
            .mockResolvedValueOnce([[{ id: 99 }]]); // hasConflict → conflict exists

          const token = makeToken(customerId, 'Customer');
          const res = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({
              provider_id: providerId,
              scheduled_date: dateStr,
              scheduled_time: timeStr,
              service_address: '123 Main St',
            });

          expect(res.status).toBe(409);
          expect(res.body.success).toBe(false);
          expect(res.body.message).toMatch(/unavailable/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 17: Booking creation triggers notifications for both parties ──────
  // Feature: taptrust-platform, Property 17: Booking creation triggers notifications for both parties
  it('Property 17: successful booking creation triggers notifications for customer and provider', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),  // customerId
        fc.integer({ min: 1, max: 9999 }),  // providerId
        fc.integer({ min: 1, max: 9999 }),  // bookingId
        fc.integer({ min: 1, max: 30 }),    // daysFromNow
        async (customerId, providerId, bookingId, days) => {
          pool.query.mockReset();
          notificationService.createNotification.mockReset();
          notificationService.createNotification.mockResolvedValue(1);

          const dateStr = futureDate(days);
          const timeStr = '14:00:00';

          mockSuccessfulCreate(customerId, providerId, bookingId, dateStr, timeStr);

          const token = makeToken(customerId, 'Customer');
          const res = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({
              provider_id: providerId,
              scheduled_date: dateStr,
              scheduled_time: timeStr,
              service_address: '456 Oak Ave',
            });

          expect(res.status).toBe(201);
          // Notifications must have been called for both customer and provider
          expect(notificationService.createNotification).toHaveBeenCalledTimes(2);

          const calls = notificationService.createNotification.mock.calls;
          const notifiedUserIds = calls.map(c => c[0].user_id);
          expect(notifiedUserIds).toContain(customerId);
          // Provider's user_id is 99 in makeProviderRow
          expect(notifiedUserIds).toContain(99);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 18: Early cancellation succeeds; late cancellation is rejected ────
  // Feature: taptrust-platform, Property 18: Early cancellation succeeds; late cancellation is rejected
  it('Property 18: cancellation ≥2h before scheduled time succeeds; <2h returns 400', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),  // customerId
        fc.integer({ min: 1, max: 9999 }),  // bookingId
        fc.boolean(),                        // earlyCancel: true = ≥2h, false = <2h
        async (customerId, bookingId, earlyCancel) => {
          pool.query.mockReset();
          notificationService.createNotification.mockReset();
          notificationService.createNotification.mockResolvedValue(1);

          // Build a scheduled time that is either ≥2h or <2h from now
          const now = new Date();
          let scheduledDateTime;
          if (earlyCancel) {
            // 3 hours from now — safe to cancel
            scheduledDateTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
          } else {
            // 30 minutes from now — too late to cancel
            scheduledDateTime = new Date(now.getTime() + 30 * 60 * 1000);
          }

          const scheduledDate = scheduledDateTime.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
          const h = String(scheduledDateTime.getHours()).padStart(2, '0');
          const m = String(scheduledDateTime.getMinutes()).padStart(2, '0');
          const s = String(scheduledDateTime.getSeconds()).padStart(2, '0');
          const scheduledTime = `${h}:${m}:${s}`; // HH:MM:SS in local time

          const booking = makeBookingRow({
            id: bookingId,
            customer_id: customerId,
            status: 'Booked',
            scheduled_date: scheduledDate,
            scheduled_time: scheduledTime,
          });

          if (earlyCancel) {
            // findById (booking) → Booked, then updateStatus, then findById (provider), then findById (updated booking)
            const cancelledBooking = { ...booking, status: 'Cancelled' };
            pool.query
              .mockResolvedValueOnce([[booking]])           // findById
              .mockResolvedValueOnce([{ affectedRows: 1 }]) // updateStatus
              .mockResolvedValueOnce([[makeProviderRow()]])  // findById (provider for notification)
              .mockResolvedValueOnce([[cancelledBooking]]);  // findById (updated)
          } else {
            pool.query.mockResolvedValueOnce([[booking]]);  // findById only
          }

          const token = makeToken(customerId, 'Customer');
          const res = await request(app)
            .delete(`/api/v1/bookings/${bookingId}`)
            .set('Authorization', `Bearer ${token}`);

          if (earlyCancel) {
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('Cancelled');
          } else {
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/2 hours/i);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 19: Booking status machine enforces valid transitions only ────────
  // Feature: taptrust-platform, Property 19: Booking status machine enforces valid transitions only
  it('Property 19: only valid state machine transitions are allowed; invalid ones return 400', async () => {
    const allStatuses = ['Booked', 'Accepted', 'In Progress', 'Completed', 'Cancelled', 'Rejected'];

    // Valid transitions (Provider-driven)
    const validTransitions = [
      { from: 'Booked', to: 'Accepted' },
      { from: 'Booked', to: 'Rejected' },
      { from: 'Accepted', to: 'In Progress' },
      { from: 'In Progress', to: 'Completed' },
    ];

    // Invalid transitions: any (from, to) pair not in the valid set
    const invalidTransitions = [];
    for (const from of allStatuses) {
      for (const to of allStatuses) {
        const isValid = validTransitions.some(t => t.from === from && t.to === to);
        if (!isValid && from !== to) {
          invalidTransitions.push({ from, to });
        }
      }
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...invalidTransitions),
        fc.integer({ min: 1, max: 9999 }),  // providerUserId
        fc.integer({ min: 1, max: 9999 }),  // bookingId
        async ({ from, to }, providerUserId, bookingId) => {
          pool.query.mockReset();

          const professional = { id: 1, user_id: providerUserId, verification_status: 'Verified' };
          const booking = makeBookingRow({
            id: bookingId,
            provider_id: 1,
            status: from,
          });

          pool.query
            .mockResolvedValueOnce([[booking]])        // findById (booking)
            .mockResolvedValueOnce([[professional]]);  // findByUserId (provider)

          const token = makeToken(providerUserId, 'Provider');
          const res = await request(app)
            .patch(`/api/v1/bookings/${bookingId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: to, rejection_reason: to === 'Rejected' ? 'test reason' : undefined });

          expect(res.status).toBe(400);
          expect(res.body.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 20: Status transitions record timestamps and trigger notifications ─
  // Feature: taptrust-platform, Property 20: Status transitions record timestamps and trigger notifications
  it('Property 20: In Progress records start_timestamp; Completed records end_timestamp; both notify customer', async () => {
    const timestampTransitions = [
      { from: 'Accepted', to: 'In Progress', timestampField: 'start_timestamp' },
      { from: 'In Progress', to: 'Completed', timestampField: 'end_timestamp' },
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...timestampTransitions),
        fc.integer({ min: 1, max: 9999 }),  // providerUserId
        fc.integer({ min: 1, max: 9999 }),  // customerId
        fc.integer({ min: 1, max: 9999 }),  // bookingId
        async ({ from, to, timestampField }, providerUserId, customerId, bookingId) => {
          pool.query.mockReset();
          notificationService.createNotification.mockReset();
          notificationService.createNotification.mockResolvedValue(1);

          const professional = { id: 1, user_id: providerUserId, verification_status: 'Verified' };
          const booking = makeBookingRow({
            id: bookingId,
            customer_id: customerId,
            provider_id: 1,
            status: from,
          });
          const updatedBooking = {
            ...booking,
            status: to,
            [timestampField]: new Date().toISOString(),
          };

          pool.query
            .mockResolvedValueOnce([[booking]])         // findById (booking)
            .mockResolvedValueOnce([[professional]])    // findByUserId (provider)
            .mockResolvedValueOnce([{ affectedRows: 1 }]) // updateStatus
            .mockResolvedValueOnce([[updatedBooking]]); // findById (updated)

          const token = makeToken(providerUserId, 'Provider');
          const res = await request(app)
            .patch(`/api/v1/bookings/${bookingId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: to });

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);
          expect(res.body.data[timestampField]).toBeTruthy();

          // Customer must be notified
          expect(notificationService.createNotification).toHaveBeenCalledWith(
            expect.objectContaining({ user_id: customerId })
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 21: Provider rejection requires a reason ─────────────────────────
  // Feature: taptrust-platform, Property 21: Provider rejection requires a reason
  it('Property 21: rejecting a booking without rejection_reason returns 400; with reason succeeds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),  // providerUserId
        fc.integer({ min: 1, max: 9999 }),  // customerId
        fc.integer({ min: 1, max: 9999 }),  // bookingId
        fc.boolean(),                        // hasReason
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0), // reason
        async (providerUserId, customerId, bookingId, hasReason, reason) => {
          pool.query.mockReset();
          notificationService.createNotification.mockReset();
          notificationService.createNotification.mockResolvedValue(1);

          const professional = { id: 1, user_id: providerUserId, verification_status: 'Verified' };
          const booking = makeBookingRow({
            id: bookingId,
            customer_id: customerId,
            provider_id: 1,
            status: 'Booked',
          });

          if (hasReason) {
            const rejectedBooking = { ...booking, status: 'Rejected', rejection_reason: reason };
            pool.query
              .mockResolvedValueOnce([[booking]])           // findById (booking)
              .mockResolvedValueOnce([[professional]])      // findByUserId (provider)
              .mockResolvedValueOnce([{ affectedRows: 1 }]) // updateStatus
              .mockResolvedValueOnce([[rejectedBooking]]);  // findById (updated)
          } else {
            pool.query
              .mockResolvedValueOnce([[booking]])      // findById (booking)
              .mockResolvedValueOnce([[professional]]); // findByUserId (provider)
          }

          const token = makeToken(providerUserId, 'Provider');
          const body = hasReason
            ? { status: 'Rejected', rejection_reason: reason }
            : { status: 'Rejected' };

          const res = await request(app)
            .patch(`/api/v1/bookings/${bookingId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send(body);

          if (hasReason) {
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('Rejected');
            expect(res.body.data.rejection_reason).toBe(reason);
          } else {
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/rejection_reason/i);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
