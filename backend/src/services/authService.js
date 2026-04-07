/**
 * Auth_Service — business logic for registration and login.
 *
 * Validates: Requirements 1.1–1.6, 2.1, 12.1
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorHandler');
const userModel = require('../models/userModel');

const BCRYPT_COST = 10;
const JWT_EXPIRY = '30d';

const VALID_ROLES = ['Customer', 'Provider'];
const VALID_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Painting',
  'Carpentry',
  'General Construction',
];

/**
 * Validate a registration payload and return field-level errors.
 * @param {object} body
 * @returns {string[]} array of error messages (empty = valid)
 */
function validateRegistration(body) {
  const errors = [];
  if (!body.name || String(body.name).trim() === '') errors.push('name is required');
  if (!body.email || String(body.email).trim() === '') errors.push('email is required');
  if (!body.password || String(body.password).trim() === '') errors.push('password is required');
  if (!body.phone || String(body.phone).trim() === '') errors.push('phone is required');
  if (!body.role || !VALID_ROLES.includes(body.role))
    errors.push(`role must be one of: ${VALID_ROLES.join(', ')}`);

  if (body.role === 'Provider') {
    // Provider-specific fields are optional at registration
    // They can be set later from the provider dashboard
  }

  return errors;
}

/**
 * Sign a JWT for the given user.
 * @param {{ id, role }} user
 * @returns {string}
 */
function signToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || 'taptrust_dev_secret',
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Register a new Customer or Provider.
 * @param {object} body
 * @returns {Promise<{ token: string, user: object }>}
 */
async function register(body) {
  const errors = validateRegistration(body);
  if (errors.length > 0) {
    throw new AppError('Validation failed', 400, {
      errors: errors.map((msg) => ({ message: msg })),
    });
  }

  const { name, email, password, phone, role, service_category, years_experience, hourly_rate } =
    body;

  // Check for duplicate email
  const existing = await userModel.findByEmail(email);
  if (existing) {
    throw new AppError('An account with that email already exists.', 409);
  }

  // Hash password with cost factor ≥ 10
  const password_hash = await bcrypt.hash(password, BCRYPT_COST);

  // Create user record
  const userId = await userModel.createUser({ name, email, password_hash, phone, role });

  // For Providers, create the Professionals record
  if (role === 'Provider') {
    await userModel.createProfessional({
      user_id: userId,
      service_category,
      years_experience: parseInt(years_experience, 10),
      hourly_rate: parseFloat(hourly_rate),
    });
  }

  const token = signToken({ id: userId, role });

  return {
    token,
    user: { id: userId, name, email, phone, role },
  };
}

/**
 * Login with email and password.
 * @param {{ email: string, password: string }} body
 * @returns {Promise<{ token: string, user: object }>}
 */
async function login({ email, password }) {
  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  const user = await userModel.findByEmail(email);

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.is_active) {
    throw new AppError('Invalid email or password.', 401);
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = signToken({ id: user.id, role: user.role });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

module.exports = { register, login, signToken, validateRegistration, BCRYPT_COST, VALID_CATEGORIES };
