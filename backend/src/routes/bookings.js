/**
 * Booking routes — /api/v1/bookings
 *
 * Validates: Requirements 4.1–4.7, 5.1–5.6, 8.1–8.5
 */

const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');
const validate = require('../middleware/validate');
const { createBookingSchema, updateBookingStatusSchema } = require('../schemas/bookingSchemas');

// All booking routes require authentication
router.use(authenticate);

// POST /api/v1/bookings — Customer only
router.post('/', authorize('Customer'), validate(createBookingSchema), bookingController.createBooking);

// GET /api/v1/bookings/customer/me — Customer only
// NOTE: must be defined before /:id to avoid route conflict
router.get('/customer/me', authorize('Customer'), bookingController.getCustomerBookings);

// GET /api/v1/bookings/provider/me — Provider only
router.get('/provider/me', authorize('Provider'), bookingController.getProviderBookings);

// GET /api/v1/bookings/:id — any authenticated user
router.get('/:id', bookingController.getBookingById);

// PATCH /api/v1/bookings/:id/status — Provider only
router.patch('/:id/status', authorize('Provider'), validate(updateBookingStatusSchema), bookingController.updateBookingStatus);

// DELETE /api/v1/bookings/:id — Customer only
router.delete('/:id', authorize('Customer'), bookingController.cancelBooking);

module.exports = router;
