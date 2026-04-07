/**
 * Joi validation schemas for Auth routes.
 *
 * Validates: Requirements 14.4 / Property 46
 */

const Joi = require('joi');

const VALID_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Painting',
  'Carpentry',
  'General Construction',
];

const registerSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email({ tlds: { allow: false } }).max(150).required(),
  password: Joi.string().min(1).max(255).required(),
  phone: Joi.string().min(1).max(20).required(),
  role: Joi.string().valid('Customer', 'Provider').required(),
  service_category: Joi.string().optional().allow('', null),
  years_experience: Joi.number().optional().allow(null),
  hourly_rate: Joi.number().optional().allow(null),
});

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(1).required(),
});

module.exports = { registerSchema, loginSchema };
