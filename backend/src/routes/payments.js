/**
 * Payment routes — /api/v1/payments
 *
 * Validates: Requirements 6.1–6.6
 */

const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// GET /api/v1/payments/provider/earnings — must be before /:bookingId routes
router.get(
  '/provider/earnings',
  authenticate,
  authorize('Provider'),
  paymentController.getProviderEarnings
);

// POST /api/v1/payments/:bookingId/charge
router.post(
  '/:bookingId/charge',
  authenticate,
  authorize('Customer'),
  paymentController.chargeBooking
);

// GET /api/v1/payments/:bookingId/receipt
router.get(
  '/:bookingId/receipt',
  authenticate,
  authorize('Customer'),
  paymentController.getReceipt
);

module.exports = router;
