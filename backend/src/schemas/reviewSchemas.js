/**
 * Joi validation schemas for Review routes.
 *
 * Validates: Requirements 14.4 / Property 46
 */

const Joi = require('joi');

const submitReviewSchema = Joi.object({
  booking_id: Joi.number().integer().positive().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  review_text: Joi.string().trim().max(2000).optional().allow(''),
});

module.exports = { submitReviewSchema };
