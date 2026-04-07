/**
 * Joi schema validation middleware factory.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), controller.register);
 *
 * Returns 400 with field-level error details when validation fails.
 * Validates: Requirements 14.4 / Property 46
 */

const { AppError } = require('./errorHandler');

/**
 * @param {import('joi').Schema} schema - Joi schema to validate req.body against
 * @returns Express middleware
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,   // Collect all errors, not just the first
      stripUnknown: true,  // Remove unknown fields from the body
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));

      return next(
        new AppError('Validation failed', 400, { errors })
      );
    }

    // Replace req.body with the sanitised/coerced value
    req.body = value;
    return next();
  };
}

module.exports = validate;
