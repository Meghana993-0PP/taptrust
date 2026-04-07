/**
 * Property-based tests for Payment_Service (Properties 22–25).
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
const { calculateAmount } = require('../../src/services/paymentService');

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

function makePaymentRow(overrides = {}) {
  return {
    id: 1,
    booking_id: 1,
    customer_id: 1,
    amount: 120.0,
    status: 'Completed',
    transaction_ref: 'test-uuid-1234',
    payment_gateway: 'stripe',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Payment Property Tests (Properties 22–25)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.PAYMENT_MODE;
  });

  afterEach(() => {
    delete process.env.PAYMENT_MODE;
  });

  // ── Property 22: Payment charge equals rate times duration ────────────────────
  // Feature: taptrust-platform, Property 22: Payment charge equals rate times duration
  it('Property 22: calculated amount equals hourly_rate × duration_hours', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 500, noNaN: true }),   // hourly_rate
        fc.integer({ min: 1, max: 24 }),               // duration in whole hours
        (hourlyRate, durationHours) => {
          const start = new Date('2025-01-01T08:00:00Z');
          const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

          const amount = calculateAmount(hourlyRate, start.toISOString(), end.toISOString());
          const expected = Math.round(hourlyRate * durationHours * 100) / 100;

          expect(amount).toBeCloseTo(expected, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: taptrust-platform, Property 22 (fallback): flat charge when timestamps missing
  it('Property 22 (fallback): uses hourly_rate as flat charge when timestamps are missing', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 500, noNaN: true }),
        (hourlyRate) => {
          const amount = calculateAmount(hourlyRate, null, null);
          expect(amount).toBeCloseTo(hourlyRate, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 23: Successful payment creates a complete Payment record ──────────
  // Feature: taptrust-platform, Property 23: Successful payment creates a complete Payment record
  it('Property 23: successful payment creates a Payment record with all required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),  // customerId
        fc.integer({ min: 1, max: 9999 }),  // bookingId
        fc.integer({ min: 1, max: 9999 }),  // paymentId
        fc.float({ min: 10, max: 300, noNaN: true }), // hourlyRate
        fc.integer({ min: 1, max: 8 }),     // durationHours
        async (customerId, bookingId, paymentId, hourlyRate, durationHours) => {
          pool.query.mockReset();
          notificationService.createNotification.mockReset();
          notificationService.createNotification.mockResolvedValue(1);

          const start = new Date('2025-06-01T09:00:00Z');
          const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
          const expectedAmount = Math.round(hourlyRate * durationHours * 100) / 100;

          const booking = makeBookingRow({
            id: bookingId,
            customer_id: customerId,
            start_timestamp: start.toISOString(),
            end_timestamp: end.toISOString(),
          });
          const provider = makeProviderRow({ hourly_rate: hourlyRate });
          const payment = makePaymentRow({
            id: paymentId,
            booking_id: bookingId,
            customer_id: customerId,
            amount: expectedAmount,
            status: 'Completed',
            transaction_ref: 'mock-txn-ref',
          });

          pool.query
            .mockResolvedValueOnce([[booking]])              // bookingModel.findById
            .mockResolvedValueOnce([[provider]])             // providerModel.findById
            .mockResolvedValueOnce([{ insertId: paymentId }]) // paymentModel.createPayment
            .mockResolvedValueOnce([[payment]]);             // paymentModel.findById

          const token = makeToken(customerId, 'Customer');
          const res = await request(app)
            .post(`/api/v1/payments/${bookingId}/charge`)
            .set('Authorization', `Bearer ${token}`);

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);

          const p = res.body.data;
          expect(p).toHaveProperty('booking_id');
          expect(p).toHaveProperty('customer_id');
          expect(p).toHaveProperty('amount');
          expect(p).toHaveProperty('transaction_ref');
          expect(p.transaction_ref).not.toBeNull();
          expect(p.status).toBe('Completed');
          expect(p).toHaveProperty('created_at');
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 24: Failed payment preserves booking and payment status ──────────
  // Feature: taptrust-platform, Property 24: Failed payment preserves booking and payment status
  it('Property 24: failed payment leaves booking Completed and creates a Failed payment record', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),  // customerId
        fc.integer({ min: 1, max: 9999 }),  // bookingId
        fc.integer({ min: 1, max: 9999 }),  // paymentId
        async (customerId, bookingId, paymentId) => {
          pool.query.mockReset();
          notificationService.createNotification.mockReset();
          notificationService.createNotification.mockResolvedValue(1);

          // Force gateway failure
          process.env.PAYMENT_MODE = 'fail';

          const booking = makeBookingRow({
            id: bookingId,
            customer_id: customerId,
            status: 'Completed',
          });
          const provider = makeProviderRow();
          const failedPayment = makePaymentRow({
            id: paymentId,
            booking_id: bookingId,
            customer_id: customerId,
            status: 'Failed',
            transaction_ref: null,
          });

          pool.query
            .mockResolvedValueOnce([[booking]])               // bookingModel.findById
            .mockResolvedValueOnce([[provider]])              // providerModel.findById
            .mockResolvedValueOnce([{ insertId: paymentId }]) // paymentModel.createPayment
            .mockResolvedValueOnce([[failedPayment]]);        // paymentModel.findById

          const token = makeToken(customerId, 'Customer');
          const res = await request(app)
            .post(`/api/v1/payments/${bookingId}/charge`)
            .set('Authorization', `Bearer ${token}`);

          // Response indicates failure
          expect(res.body.success).toBe(false);

          // Payment record has Failed status
          expect(res.body.data.status).toBe('Failed');
          expect(res.body.data.transaction_ref).toBeNull();

          // Booking was NOT updated — no updateStatus call
          // Verify pool.query was NOT called with an UPDATE Bookings statement
          const queryCalls = pool.query.mock.calls.map(c => c[0]);
          const bookingUpdated = queryCalls.some(
            q => typeof q === 'string' && q.includes('UPDATE Bookings')
          );
          expect(bookingUpdated).toBe(false);

          delete process.env.PAYMENT_MODE;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 25: Payment records appear in booking history and earnings dashboard
  // Feature: taptrust-platform, Property 25: Payment records appear in booking history and earnings dashboard
  it('Property 25: completed payment is retrievable via receipt endpoint and provider earnings endpoint', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),  // customerId
        fc.integer({ min: 1, max: 9999 }),  // providerUserId
        fc.integer({ min: 1, max: 9999 }),  // bookingId
        fc.float({ min: 10, max: 200, noNaN: true }), // amount
        async (customerId, providerUserId, bookingId, amount) => {
          pool.query.mockReset();
          notificationService.createNotification.mockReset();
          notificationService.createNotification.mockResolvedValue(1);

          const roundedAmount = Math.round(amount * 100) / 100;
          const booking = makeBookingRow({ id: bookingId, customer_id: customerId });
          const payment = makePaymentRow({
            booking_id: bookingId,
            customer_id: customerId,
            amount: roundedAmount,
            status: 'Completed',
          });

          // ── Receipt endpoint ──────────────────────────────────────────────
          pool.query
            .mockResolvedValueOnce([[booking]])   // bookingModel.findById
            .mockResolvedValueOnce([[payment]]);  // paymentModel.findByBookingId

          const customerToken = makeToken(customerId, 'Customer');
          const receiptRes = await request(app)
            .get(`/api/v1/payments/${bookingId}/receipt`)
            .set('Authorization', `Bearer ${customerToken}`);

          expect(receiptRes.status).toBe(200);
          expect(receiptRes.body.success).toBe(true);
          expect(receiptRes.body.data.booking_id).toBe(bookingId);
          expect(receiptRes.body.data.amount).toBe(roundedAmount);
          expect(receiptRes.body.data.status).toBe('Completed');

          // ── Earnings endpoint ─────────────────────────────────────────────
          pool.query.mockReset();

          const professional = { id: 1, user_id: providerUserId };
          const earningsAllTime = {
            total_earnings: roundedAmount,
            completed_jobs: 1,
            average_rating: 4.5,
          };
          const earningsMonthly = {
            total_earnings: roundedAmount,
            completed_jobs: 1,
            average_rating: 4.5,
          };

          pool.query
            .mockResolvedValueOnce([[professional]])    // providerModel.findByUserId
            .mockResolvedValueOnce([[earningsAllTime]]) // all-time query
            .mockResolvedValueOnce([[earningsMonthly]]); // monthly query

          const providerToken = makeToken(providerUserId, 'Provider');
          const earningsRes = await request(app)
            .get('/api/v1/payments/provider/earnings')
            .set('Authorization', `Bearer ${providerToken}`);

          expect(earningsRes.status).toBe(200);
          expect(earningsRes.body.success).toBe(true);
          expect(earningsRes.body.data).toHaveProperty('monthly');
          expect(earningsRes.body.data).toHaveProperty('all_time');
          expect(earningsRes.body.data.all_time).toHaveProperty('total_earnings');
          expect(earningsRes.body.data.all_time).toHaveProperty('completed_jobs');
          expect(earningsRes.body.data.all_time).toHaveProperty('average_rating');
          expect(earningsRes.body.data.monthly).toHaveProperty('total_earnings');
          expect(earningsRes.body.data.monthly).toHaveProperty('completed_jobs');
          expect(earningsRes.body.data.monthly).toHaveProperty('average_rating');
        }
      ),
      { numRuns: 100 }
    );
  });
});
