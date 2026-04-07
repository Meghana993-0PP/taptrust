/**
 * Review_Service — business logic for review submission and retrieval.
 *
 * Validates: Requirements 7.1–7.6
 */

const { AppError } = require('../middleware/errorHandler');
const reviewModel = require('../models/reviewModel');
const bookingModel = require('../models/bookingModel');
const providerModel = require('../models/providerModel');

/**
 * Submit a review for a completed booking (Customer only).
 *
 * @param {number} customerId  - req.user.userId
 * @param {{ booking_id: number, rating: number, review_text?: string }} body
 * @returns {Promise<object>} created review
 */
async function submitReview(customerId, body) {
  const { booking_id, rating, review_text } = body;

  if (!booking_id || rating === undefined || rating === null) {
    throw new AppError('booking_id and rating are required.', 400);
  }

  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw new AppError('rating must be an integer between 1 and 5.', 400);
  }

  // Verify booking exists and belongs to this customer
  const booking = await bookingModel.findById(booking_id);
  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  if (booking.customer_id !== customerId) {
    throw new AppError('Access denied.', 403);
  }

  // Booking must be Completed
  if (booking.status !== 'Completed') {
    throw new AppError('Reviews can only be submitted for completed bookings.', 403);
  }

  // Prevent duplicate reviews (one per booking)
  const existing = await reviewModel.findByBookingId(booking_id);
  if (existing) {
    throw new AppError('A review for this booking already exists.', 409);
  }

  const reviewId = await reviewModel.createReview({
    booking_id,
    customer_id: customerId,
    provider_id: booking.provider_id,
    rating: ratingNum,
    review_text: review_text || null,
  });

  // Recalculate provider average rating
  await reviewModel.recalculateProviderRating(booking.provider_id);

  return reviewModel.findById(reviewId);
}

/**
 * Get all reviews for a provider, ordered by created_at DESC.
 *
 * @param {number} providerId  - Professionals.id
 * @returns {Promise<object[]>}
 */
async function getProviderReviews(providerId) {
  const provider = await providerModel.findById(providerId);
  if (!provider) {
    throw new AppError('Provider not found.', 404);
  }
  return reviewModel.findByProviderId(providerId);
}

module.exports = { submitReview, getProviderReviews };
