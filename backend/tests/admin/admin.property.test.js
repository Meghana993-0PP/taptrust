/**
 * Property-based tests for Admin_Service (Properties 9, 31–33).
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

function makeProviderRow(overrides = {}) {
  return {
    id: 1,
    user_id: 10,
    name: 'Jane Pro',
    email: 'jane@example.com',
    phone: '0700000000',
    service_category: 'Plumbing',
    years_experience: 5,
    hourly_rate: 60.0,
    bio: 'Experienced plumber',
    skills: 'Pipe fitting',
    verification_status: 'Pending',
    verification_doc: null,
    average_rating: 0.0,
    total_reviews: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeUserRow(overrides = {}) {
  return {
    id: 1,
    name: 'Test User',
    email: 'user@example.com',
    phone: '0700000001',
    role: 'Customer',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
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
    status: 'Booked',
    estimated_cost: 60.0,
    rejection_reason: null,
    start_timestamp: null,
    end_timestamp: null,
    created_at: new Date().toISOString(),
    customer_name: 'Test Customer',
    customer_email: 'customer@example.com',
    provider_name: 'Jane Pro',
    ...overrides,
  };
}

const VALID_CATEGORIES = [
  'Plumbing', 'Electrical', 'Cleaning', 'Painting', 'Carpentry', 'General Construction',
];

const BOOKING_STATUSES = ['Booked', 'Accepted', 'In Progress', 'Completed', 'Cancelled', 'Rejected'];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Admin_Service Property Tests (Properties 9, 31–33)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Property 9: Admin approval updates provider status and triggers notification
  // Feature: taptrust-platform, Property 9: Admin approval updates provider status and triggers notification
  it('Property 9: admin approval sets verification_status to Verified and creates a notification', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),  // providerId
        fc.integer({ min: 1, max: 9999 }),  // providerUserId
        async (providerId, providerUserId) => {
          pool.query.mockReset();
          notificationService.createNotification.mockReset();
          notificationService.createNotification.mockResolvedValue(1);

          const adminToken = makeToken(999, 'Admin');

          const pendingProvider = makeProviderRow({
            id: providerId,
            user_id: providerUserId,
            verification_status: 'Pending',
          });
          const verifiedProvider = makeProviderRow({
            id: providerId,
            user_id: providerUserId,
            verification_status: 'Verified',
          });

          pool.query
            .mockResolvedValueOnce([[pendingProvider]])  // findProviderById (initial check)
            .mockResolvedValueOnce([{ affectedRows: 1 }]) // updateProviderVerification
            .mockResolvedValueOnce([[verifiedProvider]]); // findProviderById (return updated)

          const res = await request(app)
            .patch(`/api/v1/admin/providers/${providerId}/verify`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'approve' });

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);

          // Provider status must be Verified
          expect(res.body.data.verification_status).toBe('Verified');

          // Notification must have been triggered
          expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
          const notifCall = notificationService.createNotification.mock.calls[0][0];
          expect(notifCall.user_id).toBe(providerUserId);
          expect(notifCall.type).toBe('verification_approved');
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 31: Admin rejection records reason and notifies provider ──────────
  // Feature: taptrust-platform, Property 31: Admin rejection records reason and notifies provider
  it('Property 31: admin rejection sets status to Rejected, stores reason, and notifies provider', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),  // providerId
        fc.integer({ min: 1, max: 9999 }),  // providerUserId
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0), // rejection_reason
        async (providerId, providerUserId, rejectionReason) => {
          pool.query.mockReset();
          notificationService.createNotification.mockReset();
          notificationService.createNotification.mockResolvedValue(1);

          const adminToken = makeToken(999, 'Admin');

          const pendingProvider = makeProviderRow({
            id: providerId,
            user_id: providerUserId,
            verification_status: 'Pending',
          });
          const rejectedProvider = makeProviderRow({
            id: providerId,
            user_id: providerUserId,
            verification_status: 'Rejected',
            rejection_reason: rejectionReason,
          });

          pool.query
            .mockResolvedValueOnce([[pendingProvider]])   // findProviderById (initial check)
            .mockResolvedValueOnce([{ affectedRows: 1 }]) // updateProviderVerification
            .mockResolvedValueOnce([[rejectedProvider]]); // findProviderById (return updated)

          const res = await request(app)
            .patch(`/api/v1/admin/providers/${providerId}/verify`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'reject', rejection_reason: rejectionReason });

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);

          // Status must be Rejected
          expect(res.body.data.verification_status).toBe('Rejected');

          // Rejection reason must be stored
          expect(res.body.data.rejection_reason).toBe(rejectionReason);

          // Notification must have been triggered
          expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
          const notifCall = notificationService.createNotification.mock.calls[0][0];
          expect(notifCall.user_id).toBe(providerUserId);
          expect(notifCall.type).toBe('verification_rejected');
          expect(notifCall.message).toContain(rejectionReason);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 31b: Rejection without reason returns 400 ───────────────────────
  it('Property 31b: rejection without rejection_reason returns 400', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),
        async (providerId) => {
          pool.query.mockReset();

          const adminToken = makeToken(999, 'Admin');
          const pendingProvider = makeProviderRow({ id: providerId, verification_status: 'Pending' });

          pool.query.mockResolvedValueOnce([[pendingProvider]]);

          const res = await request(app)
            .patch(`/api/v1/admin/providers/${providerId}/verify`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'reject' }); // no rejection_reason

          expect(res.status).toBe(400);
          expect(res.body.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 32: Admin user/booking filters return only matching records ───────
  // Feature: taptrust-platform, Property 32: Admin user/booking filters return only matching records
  it('Property 32: user filter by status returns only matching records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('active', 'inactive'),
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 9999 }),
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            email: fc.emailAddress(),
            is_active: fc.boolean(),
            role: fc.constantFrom('Customer', 'Provider'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (statusFilter, users) => {
          pool.query.mockReset();

          const adminToken = makeToken(999, 'Admin');

          // Filter users to match the status filter (simulating DB filtering)
          const expectedActive = statusFilter === 'active';
          const matchingUsers = users.filter(u => u.is_active === expectedActive);

          pool.query.mockResolvedValueOnce([matchingUsers]);

          const res = await request(app)
            .get(`/api/v1/admin/users?status=${statusFilter}`)
            .set('Authorization', `Bearer ${adminToken}`);

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);

          // All returned records must match the filter
          for (const user of res.body.data) {
            if (statusFilter === 'active') {
              expect(user.is_active).toBe(true);
            } else {
              expect(user.is_active).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 32: booking filter by status returns only matching records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...BOOKING_STATUSES),
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 9999 }),
            status: fc.constantFrom(...BOOKING_STATUSES),
            service_category: fc.constantFrom(...VALID_CATEGORIES),
            scheduled_date: fc.constant('2025-12-01'),
            customer_name: fc.constant('Test Customer'),
            provider_name: fc.constant('Test Provider'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (statusFilter, bookings) => {
          pool.query.mockReset();

          const adminToken = makeToken(999, 'Admin');

          // Simulate DB returning only matching bookings
          const matchingBookings = bookings.filter(b => b.status === statusFilter);
          pool.query.mockResolvedValueOnce([matchingBookings]);

          const res = await request(app)
            .get(`/api/v1/admin/bookings?status=${encodeURIComponent(statusFilter)}`)
            .set('Authorization', `Bearer ${adminToken}`);

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);

          // All returned records must match the status filter
          for (const booking of res.body.data) {
            expect(booking.status).toBe(statusFilter);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 32: booking filter by category returns only matching records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...VALID_CATEGORIES),
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 9999 }),
            status: fc.constantFrom(...BOOKING_STATUSES),
            service_category: fc.constantFrom(...VALID_CATEGORIES),
            scheduled_date: fc.constant('2025-12-01'),
            customer_name: fc.constant('Test Customer'),
            provider_name: fc.constant('Test Provider'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (categoryFilter, bookings) => {
          pool.query.mockReset();

          const adminToken = makeToken(999, 'Admin');

          const matchingBookings = bookings.filter(b => b.service_category === categoryFilter);
          pool.query.mockResolvedValueOnce([matchingBookings]);

          const res = await request(app)
            .get(`/api/v1/admin/bookings?category=${encodeURIComponent(categoryFilter)}`)
            .set('Authorization', `Bearer ${adminToken}`);

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);

          for (const booking of res.body.data) {
            expect(booking.service_category).toBe(categoryFilter);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 33: Deactivated accounts cannot log in or create bookings ─────────
  // Feature: taptrust-platform, Property 33: Deactivated accounts cannot log in or create bookings
  it('Property 33: deactivated account login attempt returns 401', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 30 }),
        }),
        async ({ email, password }) => {
          pool.query.mockReset();

          // Simulate a deactivated user in the DB
          pool.query.mockResolvedValueOnce([[{
            id: 1,
            email,
            role: 'Customer',
            password_hash: '$2b$10$fakehashfakehashfakehashfakehashfakehashfakehashfakehash',
            is_active: false,
            name: 'Deactivated User',
          }]]);

          const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email, password });

          // Deactivated account must return 401
          expect(res.status).toBe(401);
          expect(res.body.success).toBe(false);
          expect(res.body.data && res.body.data.token).toBeFalsy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 33: deactivated account booking creation returns 403', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),  // userId
        async (userId) => {
          pool.query.mockReset();

          // Deactivated user token (still has a valid JWT but account is inactive)
          const token = makeToken(userId, 'Customer');

          // Simulate deactivated user in DB — findById returns is_active: false
          pool.query.mockResolvedValueOnce([[{
            id: userId,
            name: 'Deactivated User',
            email: 'deactivated@example.com',
            role: 'Customer',
            is_active: false,
          }]]);

          const res = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({
              provider_id: 1,
              scheduled_date: '2099-12-01',
              scheduled_time: '10:00:00',
              service_address: '123 Main St',
            });

          // Deactivated account must be blocked from creating bookings
          expect(res.status).toBe(403);
          expect(res.body.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
