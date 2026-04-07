/**
 * Booking controller — HTTP handlers for /api/v1/bookings routes.
 *
 * Validates: Requirements 4.1–4.7, 5.1–5.6, 8.1–8.5
 */

const bookingService = require('../services/bookingService');

/**
 * POST /api/v1/bookings
 * Customer only. Body: { provider_id, scheduled_date, scheduled_time, service_address }
 */
async function createBooking(req, res, next) {
  try {
    const booking = await bookingService.createBooking(req.user.userId, req.body);
    return res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/bookings/customer/me
 * Customer only. Returns the authenticated customer's bookings.
 */
async function getCustomerBookings(req, res, next) {
  try {
    const bookings = await bookingService.getCustomerBookings(req.user.userId);
    return res.status(200).json({
      success: true,
      data: bookings,
      message: 'Bookings retrieved successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/bookings/provider/me
 * Provider only. Returns the authenticated provider's bookings.
 */
async function getProviderBookings(req, res, next) {
  try {
    const bookings = await bookingService.getProviderBookings(req.user.userId);
    return res.status(200).json({
      success: true,
      data: bookings,
      message: 'Bookings retrieved successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/bookings/:id
 * Any authenticated user. Returns booking detail.
 */
async function getBookingById(req, res, next) {
  try {
    const booking = await bookingService.getBookingById(Number(req.params.id));
    return res.status(200).json({
      success: true,
      data: booking,
      message: 'Booking retrieved successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/v1/bookings/:id
 * Customer only. Cancel booking (≥2h before scheduled time).
 */
async function cancelBooking(req, res, next) {
  try {
    const booking = await bookingService.cancelBooking(Number(req.params.id), req.user.userId);
    return res.status(200).json({
      success: true,
      data: booking,
      message: 'Booking cancelled successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/v1/bookings/:id/status
 * Provider only. Body: { status, rejection_reason? }
 */
async function updateBookingStatus(req, res, next) {
  try {
    const booking = await bookingService.updateBookingStatus(
      Number(req.params.id),
      req.user.userId,
      req.body
    );
    return res.status(200).json({
      success: true,
      data: booking,
      message: 'Booking status updated successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createBooking,
  getCustomerBookings,
  getProviderBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
};
