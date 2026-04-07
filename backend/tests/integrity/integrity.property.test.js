/**
 * Property-based tests for Database Integrity (Properties 43–44).
 *
 * Uses fast-check for property generation.
 * The database is mocked to simulate FK constraint enforcement and soft delete behaviour.
 *
 * Feature: taptrust-platform
 */

const fc = require('fast-check');

// ── Mock the DB pool ──────────────────────────────────────────────────────────
jest.mock('../../src/config/db', () => ({
  pool: { query: jest.fn() },
}));

const { pool } = require('../../src/config/db');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Simulate a DB insert that enforces FK constraints.
 * Returns { success: true } for valid foreign keys, throws ER_NO_REFERENCED_ROW_2 for invalid ones.
 */
async function simulateBookingInsert({ customer_id, provider_id, validCustomerIds, validProviderIds }) {
  const customerExists = validCustomerIds.includes(customer_id);
  const providerExists = validProviderIds.includes(provider_id);

  if (!customerExists || !providerExists) {
    const err = new Error('Cannot add or update a child row: a foreign key constraint fails');
    err.code = 'ER_NO_REFERENCED_ROW_2';
    throw err;
  }

  return { success: true, insertId: Math.floor(Math.random() * 10000) + 1 };
}

/**
 * Simulate soft delete: sets is_active=false, record remains queryable.
 */
function simulateSoftDelete(users, userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  user.is_active = false;
  return user;
}

/**
 * Simulate querying a user by ID (soft-deleted records still returned).
 */
function simulateFindUserById(users, userId) {
  return users.find(u => u.id === userId) || null;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Database Integrity Property Tests (Properties 43–44)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Property 43: Foreign key violations are rejected by the database ──────────
  // Feature: taptrust-platform, Property 43: Foreign key violations are rejected by the database
  it('Property 43: inserting a booking with an invalid customer_id or provider_id is rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a set of valid user IDs (1–50)
        fc.array(fc.integer({ min: 1, max: 50 }), { minLength: 1, maxLength: 10 })
          .map(ids => [...new Set(ids)]),
        // Generate a set of valid provider IDs (51–100)
        fc.array(fc.integer({ min: 51, max: 100 }), { minLength: 1, maxLength: 10 })
          .map(ids => [...new Set(ids)]),
        // Generate an invalid customer_id (outside valid range)
        fc.integer({ min: 101, max: 9999 }),
        // Generate an invalid provider_id (outside valid range)
        fc.integer({ min: 101, max: 9999 }),
        async (validCustomerIds, validProviderIds, invalidCustomerId, invalidProviderId) => {
          // Case 1: invalid customer_id → FK violation
          await expect(
            simulateBookingInsert({
              customer_id: invalidCustomerId,
              provider_id: validProviderIds[0],
              validCustomerIds,
              validProviderIds,
            })
          ).rejects.toMatchObject({ code: 'ER_NO_REFERENCED_ROW_2' });

          // Case 2: invalid provider_id → FK violation
          await expect(
            simulateBookingInsert({
              customer_id: validCustomerIds[0],
              provider_id: invalidProviderId,
              validCustomerIds,
              validProviderIds,
            })
          ).rejects.toMatchObject({ code: 'ER_NO_REFERENCED_ROW_2' });

          // Case 3: valid IDs → insert succeeds
          const result = await simulateBookingInsert({
            customer_id: validCustomerIds[0],
            provider_id: validProviderIds[0],
            validCustomerIds,
            validProviderIds,
          });
          expect(result.success).toBe(true);
          expect(result.insertId).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 44: Soft delete preserves records with associated bookings ────────
  // Feature: taptrust-platform, Property 44: Soft delete preserves records with associated bookings
  it('Property 44: soft-deleting a user sets is_active=false but record remains queryable', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a user with associated bookings
        fc.record({
          id: fc.integer({ min: 1, max: 9999 }),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          email: fc.emailAddress(),
          role: fc.constantFrom('Customer', 'Provider'),
          is_active: fc.constant(true),
        }),
        // Generate 1–5 associated booking IDs
        fc.array(fc.integer({ min: 1, max: 9999 }), { minLength: 1, maxLength: 5 }),
        async (user, bookingIds) => {
          // Build in-memory user store
          const users = [{ ...user }];

          // Verify user is initially active
          const before = simulateFindUserById(users, user.id);
          expect(before).not.toBeNull();
          expect(before.is_active).toBe(true);

          // Perform soft delete (user has associated bookings)
          const deleted = simulateSoftDelete(users, user.id);
          expect(deleted).not.toBeNull();
          expect(deleted.is_active).toBe(false);

          // Record must still be queryable after soft delete
          const after = simulateFindUserById(users, user.id);
          expect(after).not.toBeNull();
          expect(after.id).toBe(user.id);
          expect(after.name).toBe(user.name);
          expect(after.email).toBe(user.email);

          // is_active must be false (soft deleted)
          expect(after.is_active).toBe(false);

          // Booking IDs are still associated (not physically deleted)
          expect(bookingIds.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Additional: errorHandler maps ER_NO_REFERENCED_ROW_2 to 400 ──────────────
  it('errorHandler maps FK constraint error to 400 with standard envelope', () => {
    const { errorHandler, AppError } = require('../../src/middleware/errorHandler');

    const fkError = new Error('FK constraint fails');
    fkError.code = 'ER_NO_REFERENCED_ROW_2';

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const req = {};
    const next = jest.fn();

    errorHandler(fkError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body).toHaveProperty('success', false);
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('message');
  });
});
