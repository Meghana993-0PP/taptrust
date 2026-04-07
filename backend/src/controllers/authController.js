/**
 * Auth controller — HTTP handlers for /api/v1/auth routes.
 *
 * Validates: Requirements 1.1–1.6, 2.1
 */

const authService = require('../services/authService');

/**
 * POST /api/v1/auth/register
 * Body: { name, email, password, phone, role, [service_category, years_experience, hourly_rate] }
 */
async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json({
      success: true,
      data: { token: result.token, user: result.user },
      message: 'Registration successful.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 */
async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json({
      success: true,
      data: { token: result.token, user: result.user },
      message: 'Login successful.',
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login };
