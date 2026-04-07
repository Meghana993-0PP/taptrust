/**
 * Payment controller — HTTP handlers for /api/v1/payments routes.
 *
 * Validates: Requirements 6.1–6.6
 */

const paymentService = require('../services/paymentService');

/**
 * POST /api/v1/payments/:bookingId/charge
 * Customer only. Initiates payment for a completed booking.
 */
async function chargeBooking(req, res, next) {
  try {
    const payment = await paymentService.chargeBooking(
      Number(req.params.bookingId),
      req.user.userId
    );

    const success = payment.status === 'Completed';
    return res.status(success ? 200 : 402).json({
      success,
      data: payment,
      message: success
        ? 'Payment processed successfully.'
        : 'Payment failed. Booking remains in Completed status.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/payments/:bookingId/receipt
 * Customer only. Returns the payment receipt for a booking.
 */
async function getReceipt(req, res, next) {
  try {
    const payment = await paymentService.getReceipt(
      Number(req.params.bookingId),
      req.user.userId
    );
    return res.status(200).json({
      success: true,
      data: payment,
      message: 'Receipt retrieved successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/payments/provider/earnings
 * Provider only. Returns monthly and all-time earnings summary.
 */
async function getProviderEarnings(req, res, next) {
  try {
    const earnings = await paymentService.getProviderEarnings(req.user.userId);
    return res.status(200).json({
      success: true,
      data: earnings,
      message: 'Earnings retrieved successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { chargeBooking, getReceipt, getProviderEarnings };
