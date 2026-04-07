/**
 * Review controller — HTTP handlers for /api/v1/reviews routes.
 *
 * Validates: Requirements 7.1–7.6
 */

const reviewService = require('../services/reviewService');

/**
 * POST /api/v1/reviews
 * Customer only. Body: { booking_id, rating, review_text? }
 */
async function submitReview(req, res, next) {
  try {
    const review = await reviewService.submitReview(req.user.userId, req.body);
    return res.status(201).json({
      success: true,
      data: review,
      message: 'Review submitted successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/reviews/provider/:providerId
 * Public. Returns reviews ordered by created_at DESC.
 */
async function getProviderReviews(req, res, next) {
  try {
    const reviews = await reviewService.getProviderReviews(Number(req.params.providerId));
    return res.status(200).json({
      success: true,
      data: reviews,
      message: 'Reviews retrieved successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { submitReview, getProviderReviews };
