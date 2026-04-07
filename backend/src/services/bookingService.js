/**
 * Booking_Service — business logic for booking CRUD and status transitions.
 *
 * Validates: Requirements 4.1–4.7, 5.1–5.6, 8.1–8.5
 */

const { AppError } = require('../middleware/errorHandler');
const bookingModel = require('../models/bookingModel');
const providerModel = require('../models/providerModel');
const userModel = require('../models/userModel');
const { assertProviderVerified } = require('./providerService');
const notificationService = require('./notificationService');

// Valid status transitions for Provider (via PATCH /status): from → [allowed next statuses]
// Note: 'Cancelled' is a Customer-only action via DELETE /bookings/:id
const VALID_TRANSITIONS = {
  Booked: ['Accepted', 'Rejected'],
  Accepted: ['In Progress'],
  'In Progress': ['Completed'],
  Completed: [],
  Cancelled: [],
  Rejected: [],
};

/**
 * Create a new booking (Customer only).
 * Validates future date, checks provider conflict, creates record, triggers notifications.
 *
 * @param {number} customerId
 * @param {{ provider_id, scheduled_date, scheduled_time, service_address }} body
 * @returns {Promise<object>} created booking
 */
async function createBooking(customerId, body) {
  const { provider_id, scheduled_date, scheduled_time, service_address } = body;

  if (!provider_id || !scheduled_date || !scheduled_time || !service_address) {
    throw new AppError('provider_id, scheduled_date, scheduled_time, and service_address are required.', 400);
  }

  // Validate future date (before any DB calls)
  const scheduledDateTime = new Date(`${scheduled_date}T${scheduled_time}`);
  if (isNaN(scheduledDateTime.getTime())) {
    throw new AppError('Invalid scheduled_date or scheduled_time format.', 400);
  }
  if (scheduledDateTime <= new Date()) {
    throw new AppError('Service date must be in the future', 400);
  }

  // Check if customer account is active (Property 33)
  const customer = await userModel.findById(customerId);
  if (!customer || !customer.is_active) {
    throw new AppError('Account is deactivated. You cannot create bookings.', 403);
  }

  // Verify provider exists
  const provider = await providerModel.findById(provider_id);
  if (!provider) {
    throw new AppError('Provider not found.', 404);
  }

  // Check for provider conflict (Accepted booking at same date+time)
  const conflict = await bookingModel.hasConflict(provider_id, scheduled_date, scheduled_time);
  if (conflict) {
    throw new AppError('Provider is unavailable at the requested time', 409);
  }

  // Estimated cost: hourly_rate (no duration yet at booking time)
  const estimated_cost = provider.hourly_rate || null;

  const bookingId = await bookingModel.createBooking({
    customer_id: customerId,
    provider_id,
    service_category: provider.service_category,
    scheduled_date,
    scheduled_time,
    service_address,
    estimated_cost,
  });

  const booking = await bookingModel.findById(bookingId);

  // Notify both customer and provider
  const providerUserId = provider.user_id;
  await notificationService.createNotification({
    user_id: customerId,
    type: 'booking_created',
    message: `Your booking #${bookingId} has been created successfully.`,
    link: `/bookings/${bookingId}`,
  });
  await notificationService.createNotification({
    user_id: providerUserId,
    type: 'booking_created',
    message: `You have a new booking request #${bookingId}.`,
    link: `/bookings/${bookingId}`,
  });

  return booking;
}

/**
 * Get all bookings for the authenticated customer.
 * @param {number} customerId
 * @returns {Promise<object[]>}
 */
async function getCustomerBookings(customerId) {
  return bookingModel.findByCustomerId(customerId);
}

/**
 * Get all bookings for the authenticated provider.
 * @param {number} userId  - req.user.userId (Provider's Users.id)
 * @returns {Promise<object[]>}
 */
async function getProviderBookings(userId) {
  const professional = await providerModel.findByUserId(userId);
  if (!professional) {
    throw new AppError('Provider profile not found.', 404);
  }
  return bookingModel.findByProviderId(professional.id);
}

/**
 * Get a single booking by ID (any authenticated user).
 * @param {number} bookingId
 * @returns {Promise<object>}
 */
async function getBookingById(bookingId) {
  const booking = await bookingModel.findById(bookingId);
  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }
  return booking;
}

/**
 * Cancel a booking (Customer only).
 * Requires status='Booked' and ≥2 hours before scheduled time.
 *
 * @param {number} bookingId
 * @param {number} customerId
 * @returns {Promise<object>} updated booking
 */
async function cancelBooking(bookingId, customerId) {
  const booking = await bookingModel.findById(bookingId);
  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  if (booking.customer_id !== customerId) {
    throw new AppError('Access denied.', 403);
  }

  if (booking.status !== 'Booked') {
    throw new AppError('Only bookings with status "Booked" can be cancelled.', 400);
  }

  // Check 2-hour rule
  const scheduledDateTime = new Date(`${booking.scheduled_date}T${booking.scheduled_time}`);
  const now = new Date();
  const diffMs = scheduledDateTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 2) {
    throw new AppError('Cancellations must be made at least 2 hours in advance', 400);
  }

  await bookingModel.updateStatus(bookingId, 'Cancelled');

  // Notify both parties
  const provider = await providerModel.findById(booking.provider_id);
  if (provider) {
    await notificationService.createNotification({
      user_id: provider.user_id,
      type: 'booking_cancelled',
      message: `Booking #${bookingId} has been cancelled by the customer.`,
      link: `/bookings/${bookingId}`,
    });
  }
  await notificationService.createNotification({
    user_id: customerId,
    type: 'booking_cancelled',
    message: `Your booking #${bookingId} has been cancelled.`,
    link: `/bookings/${bookingId}`,
  });

  return bookingModel.findById(bookingId);
}

/**
 * Update booking status (Provider only).
 * Enforces valid state machine transitions.
 * Records start_timestamp on In Progress, end_timestamp on Completed.
 * Requires rejection_reason when rejecting.
 *
 * @param {number} bookingId
 * @param {number} providerUserId  - req.user.userId
 * @param {{ status: string, rejection_reason?: string }} body
 * @returns {Promise<object>} updated booking
 */
async function updateBookingStatus(bookingId, providerUserId, body) {
  const { status: newStatus, rejection_reason } = body;

  if (!newStatus) {
    throw new AppError('status is required.', 400);
  }

  const booking = await bookingModel.findById(bookingId);
  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  // Verify the provider owns this booking
  const professional = await providerModel.findByUserId(providerUserId);
  if (!professional || professional.id !== booking.provider_id) {
    throw new AppError('Access denied.', 403);
  }

  // Validate state machine transition
  const allowedNext = VALID_TRANSITIONS[booking.status] || [];
  if (!allowedNext.includes(newStatus)) {
    throw new AppError('Invalid status transition', 400);
  }

  // Pending provider check for Accepted transition
  if (newStatus === 'Accepted') {
    await assertProviderVerified(providerUserId);
  }

  // Rejection requires a reason
  if (newStatus === 'Rejected') {
    if (!rejection_reason || String(rejection_reason).trim() === '') {
      throw new AppError('rejection_reason is required when rejecting a booking.', 400);
    }
  }

  // Build extra fields
  const extra = {};
  if (newStatus === 'Rejected') {
    extra.rejection_reason = rejection_reason;
  }
  if (newStatus === 'In Progress') {
    extra.start_timestamp = new Date();
  }
  if (newStatus === 'Completed') {
    extra.end_timestamp = new Date();
  }

  await bookingModel.updateStatus(bookingId, newStatus, extra);

  // Notify customer
  const notifMessages = {
    Accepted: `Your booking #${bookingId} has been accepted by the provider.`,
    Rejected: `Your booking #${bookingId} has been rejected. Reason: ${rejection_reason || ''}`,
    'In Progress': `Your booking #${bookingId} is now in progress.`,
    Completed: `Your booking #${bookingId} has been completed. Please leave a review!`,
  };

  if (notifMessages[newStatus]) {
    await notificationService.createNotification({
      user_id: booking.customer_id,
      type: `booking_${newStatus.toLowerCase().replace(' ', '_')}`,
      message: notifMessages[newStatus],
      link: `/bookings/${bookingId}`,
    });
  }

  return bookingModel.findById(bookingId);
}

module.exports = {
  createBooking,
  getCustomerBookings,
  getProviderBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
  VALID_TRANSITIONS,
};
