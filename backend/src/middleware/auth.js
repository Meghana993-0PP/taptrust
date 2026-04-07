/**
 * JWT authentication and role-guard middleware.
 *
 * authenticate  - Validates the Bearer token and attaches req.user
 * authorize     - Checks that req.user.role is in the allowed roles list
 *
 * Validates: Requirements 12.2, 12.3, 12.4
 */

const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

/**
 * Middleware: validate JWT and attach decoded payload to req.user.
 * Returns 401 if the token is missing, malformed, or expired.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token is required.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role, iat, exp }
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid authentication token.', 401));
  }
}

/**
 * Middleware factory: restrict access to users with one of the allowed roles.
 * Must be used after authenticate().
 *
 * @param {...string} roles - Allowed roles, e.g. authorize('Admin', 'Provider')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${roles.join(', ')}.`,
          403
        )
      );
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
