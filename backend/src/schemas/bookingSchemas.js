/**
 * Joi validation schemas for Booking routes.
 *
 * Validates: Requirements 14.4 / Property 46
 */

const Joi = require('joi');

const createBookingSchema = Joi.object({
  provider_id: Joi.number().integer().positive().required(),
  scheduled_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'scheduled_date must be in YYYY-MM-DD format' }),
  scheduled_time: Joi.string()
    .pattern(/^\d{2}:\d{2}(:\d{2})?$/)
    .required()
    .messages({ 'string.pattern.base': 'scheduled_time must be in HH:MM or HH:MM:SS format' }),
  service_address: Joi.string().trim().min(1).max(500).required(),
});

const updateBookingStatusSchema = Joi.object({
  status: Joi.string()
    .valid('Accepted', 'Rejected', 'In Progress', 'Completed')
    .required(),
  rejection_reason: Joi.string().trim().min(1).max(1000).optional(),
});

module.exports = { createBookingSchema, updateBookingStatusSchema };
