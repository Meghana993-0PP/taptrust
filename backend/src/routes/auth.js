/**
 * Auth routes — /api/v1/auth
 */

const router = require('express').Router();
const { register, login } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { registerSchema, loginSchema } = require('../schemas/authSchemas');

// POST /api/v1/auth/register
router.post('/register', validate(registerSchema), register);

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), login);

// POST /api/v1/auth/logout  (stateless — client discards token)
router.post('/logout', (req, res) => {
  res.json({ success: true, data: null, message: 'Logged out successfully.' });
});

// GET /api/v1/auth/me — returns the authenticated user's details
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const userModel = require('../models/userModel');
    const user = await userModel.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, data: null, message: 'User not found.' });
    // Return safe fields only (no password_hash)
    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
      },
      message: 'User retrieved.',
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
