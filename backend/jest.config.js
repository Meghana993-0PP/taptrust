/**
 * Jest configuration for TapTrust backend.
 *
 * - testEnvironment: node (no DOM needed)
 * - testMatch: all *.test.js files under tests/
 * - runInBand: run tests serially to avoid DB connection conflicts
 * - fast-check is imported directly in test files (no special setup needed)
 */

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',

  // Set NODE_ENV to test so middleware can adjust behaviour
  testEnvironmentOptions: {},

  // Globals available in all test files
  globals: {},

  // Setup file to configure environment before tests
  globalSetup: undefined,

  // Run this file before each test suite to set env vars
  setupFiles: ['./tests/setup/jest.env.js'],

  // Discover tests in the tests/ directory
  testMatch: ['**/tests/**/*.test.js'],

  // Collect coverage from all source files
  collectCoverageFrom: ['src/**/*.js', '!src/index.js'],

  // Run tests serially (important for DB-dependent tests)
  // Pass --runInBand on the CLI or set here:
  // (CLI flag is preferred; this is a reminder)

  // Increase timeout for integration tests that hit a real DB
  testTimeout: 15000,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,
};
