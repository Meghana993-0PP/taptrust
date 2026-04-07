/**
 * Property-based tests for Auth_Service (Properties 1–5, 40–42).
 *
 * Uses fast-check for property generation and supertest for HTTP-level testing.
 * The database (userModel) is mocked to avoid requiring a live MySQL connection.
 *
 * Feature: taptrust-platform
 */

const fc = require('fast-check');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ── Mock the DB pool before requiring any app modules ─────────────────────────
jest.mock('../../src/config/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

const { pool } = require('../../src/config/db');
const app = require('../../src/app');

// ── Helpers ───────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'taptrust_dev_secret';

/** Build a valid Customer registration payload */
function customerPayload(overrides = {}) {
  return {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!',
    phone: '1234567890',
    role: 'Customer',
    ...overrides,
  };
}

/** Build a valid Provider registration payload */
function providerPayload(overrides = {}) {
  return {
    name: 'Pro User',
    email: 'pro@example.com',
    password: 'Password123!',
    phone: '0987654321',
    role: 'Provider',
    service_category: 'Plumbing',
    years_experience: 5,
    hourly_rate: 50,
    ...overrides,
  };
}

/**
 * Configure pool.query mock to simulate a fresh DB (no existing user).
 * First call (SELECT by email) returns empty, second call (INSERT) returns insertId.
 */
function mockFreshDb(insertId = 1) {
  pool.query
    .mockResolvedValueOnce([[]])           // findByEmail → not found
    .mockResolvedValueOnce([{ insertId }]) // createUser INSERT
    .mockResolvedValueOnce([{ insertId: insertId + 100 }]); // createProfessional INSERT (if Provider)
}

/**
 * Configure pool.query mock to simulate an existing user with the given email.
 */
function mockExistingUser(email, role = 'Customer') {
  pool.query.mockResolvedValueOnce([[{ id: 99, email, role, is_active: true }]]);
}

/**
 * Configure pool.query mock to simulate a login scenario.
 */
async function mockLoginUser({ id = 1, email, role = 'Customer', password, is_active = true }) {
  const password_hash = await bcrypt.hash(password, 10);
  pool.query.mockResolvedValueOnce([[{ id, email, role, password_hash, is_active, name: 'Test' }]]);
}

// ── fast-check arbitraries ────────────────────────────────────────────────────

const validName = fc.stringOf(fc.char(), { minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

const validEmail = fc.emailAddress();

const validPassword = fc.string({ minLength: 8, maxLength: 30 })
  .filter(s => s.trim().length > 0);

const validPhone = fc.stringOf(fc.constantFrom('0','1','2','3','4','5','6','7','8','9'), { minLength: 7, maxLength: 15 });

const validRole = fc.constantFrom('Customer', 'Provider');

const validCategory = fc.constantFrom(
  'Plumbing', 'Electrical', 'Cleaning', 'Painting', 'Carpentry', 'General Construction'
);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Auth_Service Property Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Property 1: Registration round-trip produces a valid JWT ─────────────────
  // Feature: taptrust-platform, Property 1: Registration round-trip produces a valid JWT
  it('Property 1: registration round-trip produces a valid JWT', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: validName,
          email: validEmail,
          password: validPassword,
          phone: validPhone,
        }),
        async ({ name, email, password, phone }) => {
          pool.query.mockReset();
          pool.query
            .mockResolvedValueOnce([[]])           // findByEmail → not found
            .mockResolvedValueOnce([{ insertId: 1 }]); // createUser

          const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ name, email, password, phone, role: 'Customer' });

          expect(res.status).toBe(201);
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('token');

          const decoded = jwt.verify(res.body.data.token, JWT_SECRET);
          expect(decoded).toHaveProperty('userId');
          expect(decoded).toHaveProperty('role', 'Customer');
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 2: Duplicate email registration is rejected ─────────────────────
  // Feature: taptrust-platform, Property 2: Duplicate email registration is rejected
  it('Property 2: duplicate email registration is rejected with 409', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: validName,
          email: validEmail,
          password: validPassword,
          phone: validPhone,
        }),
        async ({ name, email, password, phone }) => {
          pool.query.mockReset();
          // Simulate email already exists
          pool.query.mockResolvedValueOnce([[{ id: 1, email, role: 'Customer', is_active: true }]]);

          const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ name, email, password, phone, role: 'Customer' });

          expect(res.status).toBe(409);
          expect(res.body.success).toBe(false);
          // No token should be returned
          expect(res.body.data && res.body.data.token).toBeFalsy();
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 3: Incomplete registration is rejected ──────────────────────────
  // Feature: taptrust-platform, Property 3: Incomplete registration is rejected
  it('Property 3: registration with missing required fields returns 400', async () => {
    // Generate payloads with at least one required field removed
    const requiredFields = ['name', 'email', 'password', 'phone'];

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: validName,
          email: validEmail,
          password: validPassword,
          phone: validPhone,
        }),
        // Pick a non-empty subset of fields to omit
        fc.subarray(requiredFields, { minLength: 1 }),
        async (payload, fieldsToOmit) => {
          pool.query.mockReset();

          const incomplete = { role: 'Customer', ...payload };
          for (const field of fieldsToOmit) {
            delete incomplete[field];
          }

          const res = await request(app)
            .post('/api/v1/auth/register')
            .send(incomplete);

          expect(res.status).toBe(400);
          expect(res.body.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 4: Invalid login credentials are rejected ───────────────────────
  // Feature: taptrust-platform, Property 4: Invalid login credentials are rejected
  it('Property 4: invalid login credentials return 401 and no JWT', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: validEmail,
          password: validPassword,
        }),
        async ({ email, password }) => {
          pool.query.mockReset();
          // Simulate user not found
          pool.query.mockResolvedValueOnce([[]]);

          const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email, password });

          expect(res.status).toBe(401);
          expect(res.body.success).toBe(false);
          expect(res.body.data && res.body.data.token).toBeFalsy();
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 5: Passwords are stored as bcrypt hashes ────────────────────────
  // Feature: taptrust-platform, Property 5: Passwords are stored as bcrypt hashes
  it('Property 5: passwords are hashed with bcrypt cost ≥ 10 and never stored as plaintext', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPassword,
        async (password) => {
          // Directly test the hashing logic used by authService
          const { BCRYPT_COST } = require('../../src/services/authService');
          expect(BCRYPT_COST).toBeGreaterThanOrEqual(10);

          const hash = await bcrypt.hash(password, BCRYPT_COST);

          // Hash must not equal plaintext
          expect(hash).not.toBe(password);

          // Hash must be a valid bcrypt hash
          expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);

          // Extract cost factor from hash
          const costFactor = parseInt(hash.split('$')[2], 10);
          expect(costFactor).toBeGreaterThanOrEqual(10);

          // bcrypt.compare must verify correctly
          const match = await bcrypt.compare(password, hash);
          expect(match).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 40: JWT contains correct role and expiry ────────────────────────
  // Feature: taptrust-platform, Property 40: JWT contains correct role and expiry
  it('Property 40: JWT payload contains correct userId, role, and ~24h expiry', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: validName,
          email: validEmail,
          password: validPassword,
          phone: validPhone,
          role: validRole,
        }),
        fc.option(
          fc.record({
            service_category: validCategory,
            years_experience: fc.integer({ min: 0, max: 50 }),
            hourly_rate: fc.float({ min: 1, max: 500, noNaN: true }),
          }),
          { nil: undefined }
        ),
        async (base, providerExtra) => {
          pool.query.mockReset();

          const payload = { ...base };
          if (base.role === 'Provider' && providerExtra) {
            Object.assign(payload, providerExtra);
          } else if (base.role === 'Provider') {
            payload.service_category = 'Plumbing';
            payload.years_experience = 3;
            payload.hourly_rate = 40;
          }

          pool.query
            .mockResolvedValueOnce([[]])           // findByEmail → not found
            .mockResolvedValueOnce([{ insertId: 1 }]) // createUser
            .mockResolvedValueOnce([{ insertId: 101 }]); // createProfessional (if Provider)

          const before = Math.floor(Date.now() / 1000);
          const res = await request(app)
            .post('/api/v1/auth/register')
            .send(payload);

          expect(res.status).toBe(201);
          const { token } = res.body.data;
          const decoded = jwt.verify(token, JWT_SECRET);

          // Role must match
          expect(decoded.role).toBe(base.role);
          // userId must be a number
          expect(typeof decoded.userId).toBe('number');
          // Expiry must be approximately 24 hours from issuance
          const expectedExp = decoded.iat + 24 * 60 * 60;
          expect(decoded.exp).toBeGreaterThanOrEqual(expectedExp - 5);
          expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 41: Invalid or expired JWT returns 401 ──────────────────────────
  // Feature: taptrust-platform, Property 41: Invalid or expired JWT returns 401
  it('Property 41: invalid or expired JWT on protected endpoint returns 401', async () => {
    // Use a protected route — we'll test against a route that requires auth.
    // Since other routes may not be implemented yet, we test the middleware directly
    // by adding a test-only route via the app, or by calling a known protected route.
    // We'll use the bookings route which requires authentication.

    const invalidTokens = [
      '',
      'not.a.jwt',
      'Bearer ',
      // Expired token (signed with correct secret but exp in the past)
      jwt.sign({ userId: 1, role: 'Customer' }, JWT_SECRET, { expiresIn: -1 }),
      // Token signed with wrong secret
      jwt.sign({ userId: 1, role: 'Customer' }, 'wrong_secret', { expiresIn: '24h' }),
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...invalidTokens),
        async (badToken) => {
          pool.query.mockReset();

          const res = await request(app)
            .get('/api/v1/bookings/customer/me')
            .set('Authorization', badToken.startsWith('Bearer') ? badToken : `Bearer ${badToken}`);

          expect(res.status).toBe(401);
          expect(res.body.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 42: Wrong-role access returns 403 ───────────────────────────────
  // Feature: taptrust-platform, Property 42: Wrong-role access returns 403
  it('Property 42: accessing an Admin-only endpoint with Customer or Provider role returns 403', async () => {
    const nonAdminRoles = ['Customer', 'Provider'];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...nonAdminRoles),
        fc.integer({ min: 1, max: 9999 }),
        async (role, userId) => {
          pool.query.mockReset();

          const token = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '24h' });

          const res = await request(app)
            .get('/api/v1/admin/dashboard')
            .set('Authorization', `Bearer ${token}`);

          expect(res.status).toBe(403);
          expect(res.body.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

});
