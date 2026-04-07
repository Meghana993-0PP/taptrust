/**
 * Global Express error handler middleware.
 *
 * Catches all errors passed via next(err) and returns a sanitised JSON
 * response using the standard { success, data, message } envelope.
 * Full stack traces are logged server-side but never exposed to clients.
 */

/**
 * Custom application error class.
 * Allows services to throw structured errors with an HTTP status code.
 */
class AppError extends Error {
  /**
   * @param {string} message  - Human-readable error message
   * @param {number} statusCode - HTTP status code (default 500)
   * @param {*}      data     - Optional field-level error details
   */
  constructor(message, statusCode = 500, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.isOperational = true; // Distinguishes known errors from unexpected ones
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error-handling middleware (4-argument signature required by Express).
 *
 * @param {Error}    err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Always log the full error server-side
  console.error('[ErrorHandler]', err);

  // Operational errors (AppError instances) have a known status code
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      data: err.data || null,
      message: err.message,
    });
  }

  // MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      data: null,
      message: 'A record with that value already exists.',
    });
  }

  // MySQL foreign key constraint error
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Referenced resource does not exist.',
    });
  }

  // Unexpected / unhandled errors — return generic 500
  return res.status(500).json({
    success: false,
    data: null,
    message: 'An unexpected error occurred. Please try again later.',
  });
}

module.exports = { errorHandler, AppError };
