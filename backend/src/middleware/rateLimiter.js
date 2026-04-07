/**
 * Rate limiting middleware.
 *
 * Limits each IP address to 100 requests per 60-second window.
 * Exceeding the limit returns a 429 Too Many Requests response
 * using the standard { success, data, message } envelope.
 *
 * Validates: Requirements 14.5 / Property 47
 */

const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
  // Window duration in milliseconds (default: 60 000 ms = 1 minute)
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),

  // In test environment use a very high limit to avoid interfering with property tests
  max: process.env.NODE_ENV === 'test'
    ? 100000
    : parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

  // Use the standard response envelope
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      data: null,
      message: 'Too many requests. Please try again in a minute.',
    });
  },

  // Include standard rate-limit headers in responses
  standardHeaders: true,

  // Disable the legacy X-RateLimit-* headers
  legacyHeaders: false,
});

module.exports = rateLimiter;
