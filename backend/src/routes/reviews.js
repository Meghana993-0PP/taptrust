/**
 * Review routes — /api/v1/reviews
 *
 * Validates: Requirements 7.1–7.6
 */

const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');
const validate = require('../middleware/validate');
const { submitReviewSchema } = require('../schemas/reviewSchemas');

// POST /api/v1/reviews — Customer only
router.post(
  '/',
  authenticate,
  authorize('Customer'),
  validate(submitReviewSchema),
  reviewController.submitReview
);

// GET /api/v1/reviews/provider/:providerId — Public
router.get(
  '/provider/:providerId',
  reviewController.getProviderReviews
);

module.exports = router;
