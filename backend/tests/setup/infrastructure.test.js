/**
 * Infrastructure smoke tests — Task 1.8
 *
 * Verifies that the core infrastructure modules load correctly and
 * that the Express app responds to the health endpoint.
 * These tests do NOT require a live database connection.
 */

const request = require('supertest');
const app = require('../../src/app');

describe('Infrastructure — Express app', () => {
  it('GET /health returns 200 with standard envelope', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: null,
      message: expect.any(String),
    });
  });

  it('Unknown route returns 404 with standard envelope', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      data: null,
      message: expect.any(String),
    });
  });
});

describe('Infrastructure — Rate limiter middleware', () => {
  it('loads without errors', () => {
    expect(() => require('../../src/middleware/rateLimiter')).not.toThrow();
  });
});

describe('Infrastructure — Error handler middleware', () => {
  it('AppError carries statusCode and data', () => {
    const { AppError } = require('../../src/middleware/errorHandler');
    const err = new AppError('Test error', 422, { field: 'email' });
    expect(err.message).toBe('Test error');
    expect(err.statusCode).toBe(422);
    expect(err.data).toEqual({ field: 'email' });
    expect(err.isOperational).toBe(true);
  });
});

describe('Infrastructure — fast-check availability', () => {
  it('fast-check can generate arbitrary strings', () => {
    const fc = require('fast-check');
    // Verify fast-check is installed and functional
    fc.assert(
      fc.property(fc.string(), (s) => {
        return typeof s === 'string';
      }),
      { numRuns: 10 }
    );
  });
});
