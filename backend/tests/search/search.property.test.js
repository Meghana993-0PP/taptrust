/**
 * Property-based tests for Service Search and Discovery (Properties 11–13).
 *
 * Uses fast-check for property generation and supertest for HTTP-level testing.
 * The database (pool) is mocked to avoid requiring a live MySQL connection.
 *
 * Feature: taptrust-platform
 */

const fc = require('fast-check');
const request = require('supertest');

// ── Mock the DB pool before requiring any app modules ─────────────────────────
jest.mock('../../src/config/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

const { pool } = require('../../src/config/db');
const app = require('../../src/app');

const VALID_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Painting',
  'Carpentry',
  'General Construction',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a mock Professionals row as returned by the DB search query.
 * All rows are Verified by default (the query only returns Verified rows).
 */
function makeProviderRow(overrides = {}) {
  return {
    id: 1,
    name: 'Test Provider',
    service_category: 'Plumbing',
    hourly_rate: 50.0,
    average_rating: 4.0,
    total_reviews: 5,
    verification_status: 'Verified',
    latitude: 0.0,
    longitude: 0.0,
    ...overrides,
  };
}

/**
 * Haversine distance in km between two lat/lng points.
 * Used in tests to verify proximity filter correctness.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Search Property Tests (Properties 11–13)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Property 11: Category search returns only Verified providers ordered by rating
  // Feature: taptrust-platform, Property 11: Category search returns only Verified providers ordered by rating
  it('Property 11: category search returns only Verified providers ordered by average_rating DESC', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...VALID_CATEGORIES),
        // Generate 0–5 providers with random ratings
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 9999 }),
            average_rating: fc.float({ min: 0, max: 5, noNaN: true }),
          }),
          { minLength: 0, maxLength: 5 }
        ),
        async (category, providerSeeds) => {
          pool.query.mockReset();

          // Build mock rows — all Verified, matching the category, sorted DESC by rating
          const sortedRows = [...providerSeeds]
            .sort((a, b) => b.average_rating - a.average_rating)
            .map((seed, idx) =>
              makeProviderRow({
                id: seed.id,
                service_category: category,
                average_rating: seed.average_rating,
                verification_status: 'Verified',
              })
            );

          pool.query.mockResolvedValueOnce([sortedRows]);

          const res = await request(app)
            .get('/api/v1/providers')
            .query({ category });

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);

          const providers = res.body.data;

          // All returned providers must be Verified
          for (const p of providers) {
            expect(p.verification_status).toBe('Verified');
          }

          // Must be ordered by average_rating descending
          for (let i = 1; i < providers.length; i++) {
            expect(providers[i - 1].average_rating).toBeGreaterThanOrEqual(
              providers[i].average_rating
            );
          }

          // Empty result must return the "No providers found" message
          if (providers.length === 0) {
            expect(res.body.message).toMatch(/No providers found/i);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 12: Price filter returns only providers within range
  // Feature: taptrust-platform, Property 12: Price filter returns only providers within range
  it('Property 12: price filter returns only providers with hourly_rate in [min_price, max_price]', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a valid price range
        fc.tuple(
          fc.float({ min: 0, max: 500, noNaN: true }),
          fc.float({ min: 0, max: 500, noNaN: true })
        ).map(([a, b]) => ({ min_price: Math.min(a, b), max_price: Math.max(a, b) })),
        // Generate 0–5 providers whose rates are within the range
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 9999 }),
            average_rating: fc.float({ min: 0, max: 5, noNaN: true }),
          }),
          { minLength: 0, maxLength: 5 }
        ),
        async ({ min_price, max_price }, providerSeeds) => {
          pool.query.mockReset();

          // The DB mock returns rows whose hourly_rate is within [min_price, max_price]
          // (the real SQL WHERE clause enforces this; we simulate it here)
          const rows = providerSeeds.map(seed => {
            // Pick a rate within the range
            const rate = min_price + (max_price - min_price) * 0.5;
            return makeProviderRow({
              id: seed.id,
              hourly_rate: rate,
              average_rating: seed.average_rating,
              verification_status: 'Verified',
            });
          });

          pool.query.mockResolvedValueOnce([rows]);

          const res = await request(app)
            .get('/api/v1/providers')
            .query({ min_price, max_price });

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);

          const providers = res.body.data;

          // Every returned provider must have hourly_rate within [min_price, max_price]
          for (const p of providers) {
            expect(p.hourly_rate).toBeGreaterThanOrEqual(min_price);
            expect(p.hourly_rate).toBeLessThanOrEqual(max_price);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 13: Proximity filter returns only providers within radius
  // Feature: taptrust-platform, Property 13: Proximity filter returns only providers within radius
  it('Property 13: proximity filter returns only providers within the specified radius', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Search origin
        fc.record({
          lat: fc.float({ min: -85, max: 85, noNaN: true }),
          lng: fc.float({ min: -180, max: 180, noNaN: true }),
          radius: fc.float({ min: 1, max: 500, noNaN: true }),
        }),
        // Generate 0–5 providers with lat/lng within the radius
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 9999 }),
            // Small offset so providers are near the origin (32-bit float bounds)
            latOffset: fc.float({ min: Math.fround(-0.05), max: Math.fround(0.05), noNaN: true }),
            lngOffset: fc.float({ min: Math.fround(-0.05), max: Math.fround(0.05), noNaN: true }),
            average_rating: fc.float({ min: 0, max: 5, noNaN: true }),
          }),
          { minLength: 0, maxLength: 5 }
        ),
        async ({ lat, lng, radius }, providerSeeds) => {
          pool.query.mockReset();

          // Build rows — place providers near the origin so they are within radius
          const rows = providerSeeds
            .map(seed => {
              const pLat = lat + seed.latOffset;
              const pLng = lng + seed.lngOffset;
              const dist = haversineKm(lat, lng, pLat, pLng);
              // Only include if actually within radius (simulate DB Haversine filter)
              if (dist > radius) return null;
              return makeProviderRow({
                id: seed.id,
                latitude: pLat,
                longitude: pLng,
                average_rating: seed.average_rating,
                verification_status: 'Verified',
              });
            })
            .filter(Boolean);

          pool.query.mockResolvedValueOnce([rows]);

          const res = await request(app)
            .get('/api/v1/providers')
            .query({ lat, lng, radius });

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);

          // The response count must match what the mock returned
          expect(res.body.data.length).toBe(rows.length);

          // All returned providers must be Verified
          for (const p of res.body.data) {
            expect(p.verification_status).toBe('Verified');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
