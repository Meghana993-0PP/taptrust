/**
 * Payment_Service — business logic for payment processing and earnings.
 *
 * Validates: Requirements 6.1–6.6
 */

const { randomUUID } = require('crypto');
const { AppError } = require('../middleware/errorHandler');
const paymentModel = require('../models/paymentModel');
const bookingModel = require('../models/bookingModel');
const providerModel = require('../models/providerModel');
const notificationService = require('./notificationService');

/**
 * Dummy payment gateway.
 * Always succeeds unless PAYMENT_MODE=fail.
 *
 * @returns {{ success: boolean, transaction_ref: string|null }}
 */
function callPaymentGateway() {
  if (process.env.PAYMENT_MODE === 'fail') {
    return { success: false, transaction_ref: null };
  }
  return { success: true, transaction_ref: randomUUID() };
}

/**
 * Calculate the charge amount for a booking.
 * amount = hourly_rate × duration_hours (end_timestamp − start_timestamp).
 * Falls back to hourly_rate as a flat charge if timestamps are missing.
 *
 * @param {number} hourlyRate
 * @param {Date|string|null} startTimestamp
 * @param {Date|string|null} endTimestamp
 * @returns {number} amount (rounded to 2 decimal places)
 */
function calculateAmount(hourlyRate, startTimestamp, endTimestamp) {
  if (startTimestamp && endTimestamp) {
    const start = new Date(startTimestamp);
    const end = new Date(endTimestamp);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (durationHours > 0) {
      return Math.round(hourlyRate * durationHours * 100) / 100;
    }
  }
  // Flat charge fallback
  return Math.round(hourlyRate * 100) / 100;
}

/**
 * Charge a customer for a completed booking.
 * - Booking must be 'Completed'
 * - Caller must be the booking's customer
 * - Calls dummy gateway; on success creates Payment(status=Completed)
 * - On failure creates Payment(status=Failed), booking stays Completed
 *
 * @param {number} bookingId
 * @param {number} customerId  - req.user.userId
 * @returns {Promise<object>} payment record
 */
async function chargeBooking(bookingId, customerId) {
  const booking = await bookingModel.findById(bookingId);
  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  if (booking.customer_id !== customerId) {
    throw new AppError('Access denied.', 403);
  }

  if (booking.status !== 'Completed') {
    throw new AppError('Payment can only be initiated for completed bookings.', 400);
  }

  // Fetch provider for hourly_rate
  const provider = await providerModel.findById(booking.provider_id);
  if (!provider) {
    throw new AppError('Provider not found.', 404);
  }

  const amount = calculateAmount(
    provider.hourly_rate,
    booking.start_timestamp,
    booking.end_timestamp
  );

  // Call payment gateway
  const gateway = callPaymentGateway();

  if (gateway.success) {
    const paymentId = await paymentModel.createPayment({
      booking_id: bookingId,
      customer_id: customerId,
      amount,
      status: 'Completed',
      transaction_ref: gateway.transaction_ref,
      payment_gateway: 'stripe',
    });

    // Notify customer of successful payment
    await notificationService.createNotification({
      user_id: customerId,
      type: 'payment_confirmed',
      message: `Payment of $${amount} for booking #${bookingId} was successful.`,
      link: `/payments/${bookingId}/receipt`,
    });

    // Notify provider
    await notificationService.createNotification({
      user_id: provider.user_id,
      type: 'payment_confirmed',
      message: `Payment received for booking #${bookingId}. Amount: $${amount}.`,
      link: `/bookings/${bookingId}`,
    });

    return paymentModel.findById(paymentId);
  } else {
    // Payment failed — booking stays Completed, payment status = Pending (Failed record)
    const paymentId = await paymentModel.createPayment({
      booking_id: bookingId,
      customer_id: customerId,
      amount,
      status: 'Failed',
      transaction_ref: null,
      payment_gateway: 'stripe',
    });

    return paymentModel.findById(paymentId);
  }
}

/**
 * Get the payment receipt for a booking.
 * Customer only; must own the booking.
 *
 * @param {number} bookingId
 * @param {number} customerId
 * @returns {Promise<object>} payment record
 */
async function getReceipt(bookingId, customerId) {
  const booking = await bookingModel.findById(bookingId);
  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  if (booking.customer_id !== customerId) {
    throw new AppError('Access denied.', 403);
  }

  const payment = await paymentModel.findByBookingId(bookingId);
  if (!payment) {
    throw new AppError('No payment record found for this booking.', 404);
  }

  return payment;
}

/**
 * Get provider earnings summary (monthly and all-time).
 * Provider only.
 *
 * @param {number} providerUserId  - req.user.userId
 * @returns {Promise<{ monthly: object, all_time: object }>}
 */
async function getProviderEarnings(providerUserId) {
  const professional = await providerModel.findByUserId(providerUserId);
  if (!professional) {
    throw new AppError('Provider profile not found.', 404);
  }

  return paymentModel.getProviderEarnings(professional.id);
}

module.exports = { chargeBooking, getReceipt, getProviderEarnings, calculateAmount, callPaymentGateway };
