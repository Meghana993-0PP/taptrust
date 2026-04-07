/**
 * Property-based tests for Notification_Service (Properties 37–39).
 *
 * Uses fast-check for property generation and supertest for HTTP-level testing.
 * The database (pool) is mocked; Socket.io is not required for these tests.
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

const { pool } = require('../../src/config/db');
const app = require('../../src/app');

const JWT_SECRET = process.env.JWT_SECRET || 'taptrust_dev_secret';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeToken(userId, role = 'Customer') {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '24h' });
}

function makeNotification(overrides = {}) {
  return {
    id: 1,
    user_id: 1,
    type: 'booking_created',
    message: 'Your booking has been created.',
    link: '/bookings/1',
    is_read: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Notification Property Tests (Properties 37–39)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Property 37: Notifications are created for all triggering events ──────────
  // Feature: taptrust-platform, Property 37: Notifications are created for all triggering events
  it('Property 37: createNotification inserts a record for every valid event type', async () => {
    const triggeringTypes = [
      'booking_created',
      'booking_accepted',
      'booking_rejected',
      'booking_in_progress',
      'booking_completed',
      'booking_cancelled',
      'payment_confirmed',
      'verification_approved',
      'verification_rejected',
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),          // userId
        fc.constantFrom(...triggeringTypes),          // event type
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0), // message
        fc.option(fc.webUrl(), { nil: null }),        // optional link
        async (userId, type, message, link) => {
          pool.query.mockReset();

          const insertId = Math.floor(Math.random() * 9999) + 1;
          // notificationModel.create → INSERT
          pool.query.mockResolvedValueOnce([{ insertId }]);

          // Call createNotification directly via the service
          const notificationService = require('../../src/services/notificationService');
          const result = await notificationService.createNotification({
            user_id: userId,
            type,
            message,
            link,
          });

          // A record must have been inserted (pool.query called once for INSERT)
          expect(pool.query).toHaveBeenCalledTimes(1);
          expect(pool.query).toHaveBeenCalledWith(
            expect.stringMatching(/INSERT INTO Notifications/i),
            expect.arrayContaining([userId, type, message])
          );
          // Returns the insertId
          expect(result).toBe(insertId);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 38: Unread notification count matches actual unread records ───────
  // Feature: taptrust-platform, Property 38: Unread notification count matches actual unread records
  it('Property 38: GET /notifications/me returns unread_count equal to number of is_read=false records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),   // userId
        fc.integer({ min: 0, max: 20 }),     // total notifications
        fc.integer({ min: 0, max: 20 }),     // unread count (capped to total below)
        async (userId, total, rawUnread) => {
          pool.query.mockReset();

          const unread = Math.min(rawUnread, total);

          // Build notification list: first `unread` are unread, rest are read
          const notifications = Array.from({ length: total }, (_, i) => makeNotification({
            id: i + 1,
            user_id: userId,
            is_read: i >= unread,
          }));

          // Mock: findByUserId → notifications list
          pool.query.mockResolvedValueOnce([notifications]);
          // Mock: countUnread → unread count
          pool.query.mockResolvedValueOnce([[{ cnt: unread }]]);

          const token = makeToken(userId);
          const res = await request(app)
            .get('/api/v1/notifications/me')
            .set('Authorization', `Bearer ${token}`);

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);
          expect(res.body.data.notifications).toHaveLength(total);
          expect(res.body.data.unread_count).toBe(unread);

          // Verify the count matches the actual unread records in the list
          const actualUnread = res.body.data.notifications.filter(n => !n.is_read).length;
          expect(res.body.data.unread_count).toBe(actualUnread);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 39: Marking a notification as read is idempotent ─────────────────
  // Feature: taptrust-platform, Property 39: Marking a notification as read is idempotent
  it('Property 39: marking a notification as read once or multiple times always results in is_read=true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),   // userId
        fc.integer({ min: 1, max: 9999 }),   // notificationId
        fc.boolean(),                         // wasAlreadyRead before this call
        fc.integer({ min: 1, max: 5 }),      // number of times to mark as read
        async (userId, notifId, wasAlreadyRead, times) => {
          const token = makeToken(userId);

          for (let i = 0; i < times; i++) {
            pool.query.mockReset();

            const notification = makeNotification({
              id: notifId,
              user_id: userId,
              is_read: wasAlreadyRead || i > 0, // already read after first call
            });
            const readNotification = { ...notification, is_read: true };

            // findById (ownership check)
            pool.query.mockResolvedValueOnce([[notification]]);
            // markAsRead UPDATE
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            // findById (return updated)
            pool.query.mockResolvedValueOnce([[readNotification]]);

            const res = await request(app)
              .patch(`/api/v1/notifications/${notifId}/read`)
              .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            // is_read must always be true after marking as read
            expect(res.body.data.is_read).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
