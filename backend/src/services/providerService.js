/**
 * Provider_Service — business logic for provider profile and verification.
 *
 * Validates: Requirements 2.1–2.6, 3.3–3.4
 */

const path = require('path');
const { AppError } = require('../middleware/errorHandler');
const providerModel = require('../models/providerModel');

const VALID_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Painting',
  'Carpentry',
  'General Construction',
];

/**
 * Store the uploaded document path on the provider's Professionals record.
 *
 * @param {number} userId  - req.user.userId (from JWT)
 * @param {object} file    - multer file object
 * @returns {Promise<{ verification_doc: string }>}
 */
async function uploadDocument(userId, file) {
  if (!file) {
    throw new AppError('No file uploaded.', 400);
  }

  const professional = await providerModel.findByUserId(userId);
  if (!professional) {
    throw new AppError('Provider profile not found.', 404);
  }

  // Store a relative path so it is portable across environments
  const relativePath = path.join('uploads', 'documents', path.basename(file.path)).replace(/\\/g, '/');

  await providerModel.updateVerificationDoc(professional.id, relativePath);

  return { verification_doc: relativePath };
}

/**
 * Return the authenticated provider's own profile.
 *
 * @param {number} userId - req.user.userId (from JWT)
 * @returns {Promise<object>}
 */
async function getOwnProfile(userId) {
  const professional = await providerModel.findByUserId(userId);
  if (!professional) {
    throw new AppError('Provider profile not found.', 404);
  }

  const provider = await providerModel.findById(professional.id);
  if (!provider) {
    throw new AppError('Provider profile not found.', 404);
  }

  return {
    id: provider.id,
    name: provider.name,
    service_category: provider.service_category,
    years_experience: provider.years_experience,
    hourly_rate: provider.hourly_rate,
    bio: provider.bio || null,
    skills: provider.skills || null,
    average_rating: provider.average_rating,
    total_reviews: provider.total_reviews,
    verification_status: provider.verification_status,
  };
}

/**
 * Return the public profile for a provider.
 *
 * @param {number} providerId  - Professionals.id
 * @returns {Promise<object>}
 */
async function getPublicProfile(providerId) {
  const provider = await providerModel.findById(providerId);
  if (!provider) {
    throw new AppError('Provider not found.', 404);
  }

  return {
    id: provider.id,
    name: provider.name,
    service_category: provider.service_category,
    years_experience: provider.years_experience,
    hourly_rate: provider.hourly_rate,
    bio: provider.bio || null,
    skills: provider.skills || null,
    average_rating: provider.average_rating,
    total_reviews: provider.total_reviews,
    verification_status: provider.verification_status, // acts as the badge
  };
}

/**
 * Update editable profile fields for the authenticated provider.
 *
 * @param {number} userId  - req.user.userId (from JWT)
 * @param {{ bio?: string, skills?: string, hourly_rate?: number }} body
 * @returns {Promise<object>} updated profile
 */
async function updateProfile(userId, body) {
  const professional = await providerModel.findByUserId(userId);
  if (!professional) {
    throw new AppError('Provider profile not found.', 404);
  }

  const { bio, skills, hourly_rate } = body;

  // Validate hourly_rate if provided
  if (hourly_rate !== undefined) {
    const rate = parseFloat(hourly_rate);
    if (isNaN(rate) || rate <= 0) {
      throw new AppError('hourly_rate must be a positive number.', 400);
    }
  }

  await providerModel.updateProfile(professional.id, {
    bio,
    skills,
    hourly_rate: hourly_rate !== undefined ? parseFloat(hourly_rate) : undefined,
  });

  // Return the refreshed record
  const updated = await providerModel.findById(professional.id);
  return {
    id: updated.id,
    name: updated.name,
    service_category: updated.service_category,
    years_experience: updated.years_experience,
    hourly_rate: updated.hourly_rate,
    bio: updated.bio || null,
    skills: updated.skills || null,
    average_rating: updated.average_rating,
    total_reviews: updated.total_reviews,
    verification_status: updated.verification_status,
  };
}

/**
 * Search for Verified providers with optional filters.
 * Returns only Verified providers ordered by average_rating DESC.
 *
 * @param {{ category?: string, min_price?: string|number, max_price?: string|number,
 *            lat?: string|number, lng?: string|number, radius?: string|number }} query
 * @returns {Promise<{ providers: object[], message: string }>}
 */
async function searchProviders(query) {
  const { category, min_price, max_price, lat, lng, radius } = query;

  // Validate category if provided
  if (category && !VALID_CATEGORIES.includes(category)) {
    throw new AppError(
      `Invalid service_category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      400
    );
  }

  // Parse numeric filters
  const filters = { category };

  if (min_price !== undefined) {
    const val = parseFloat(min_price);
    if (isNaN(val) || val < 0) throw new AppError('min_price must be a non-negative number.', 400);
    filters.min_price = val;
  }

  if (max_price !== undefined) {
    const val = parseFloat(max_price);
    if (isNaN(val) || val < 0) throw new AppError('max_price must be a non-negative number.', 400);
    filters.max_price = val;
  }

  if (min_price !== undefined && max_price !== undefined && filters.min_price > filters.max_price) {
    throw new AppError('min_price cannot be greater than max_price.', 400);
  }

  // Proximity filter — all three params required together
  // Only activate proximity filtering when ALL THREE are provided
  const hasProximity = lat !== undefined && lat !== '' && lat !== null &&
                       lng !== undefined && lng !== '' && lng !== null &&
                       radius !== undefined && radius !== '' && radius !== null;

  if (hasProximity) {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedRadius = parseFloat(radius);
    if (isNaN(parsedLat) || isNaN(parsedLng) || isNaN(parsedRadius)) {
      throw new AppError('lat, lng, and radius must be valid numbers.', 400);
    }
    if (parsedRadius <= 0) throw new AppError('radius must be a positive number.', 400);
    filters.lat = parsedLat;
    filters.lng = parsedLng;
    filters.radius = parsedRadius;
  }

  const rows = await providerModel.searchProviders(filters);

  const providers = rows.map(row => ({
    id: row.id,
    name: row.name,
    service_category: row.service_category,
    hourly_rate: row.hourly_rate,
    average_rating: row.average_rating,
    total_reviews: row.total_reviews,
    verification_status: row.verification_status,
  }));

  if (providers.length === 0) {
    return {
      providers: [],
      message: 'No providers found. Try broadening your search filters.',
    };
  }

  return { providers, message: 'Providers retrieved successfully.' };
}

/**
 * Guard: throw 403 if the provider's verification_status is 'Pending'.
 * Called by the booking service before allowing a provider to accept a booking.
 *
 * @param {number} userId  - req.user.userId (from JWT)
 * @returns {Promise<void>}
 */
async function assertProviderVerified(userId) {
  const professional = await providerModel.findByUserId(userId);
  if (!professional) {
    throw new AppError('Provider profile not found.', 404);
  }
  if (professional.verification_status === 'Pending') {
    throw new AppError('Account pending verification', 403);
  }
}

module.exports = {
  uploadDocument,
  getOwnProfile,
  getPublicProfile,
  updateProfile,
  assertProviderVerified,
  searchProviders,
  VALID_CATEGORIES,
};
