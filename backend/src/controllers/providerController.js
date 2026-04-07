/**
 * Provider controller — HTTP handlers for /api/v1/providers routes.
 *
 * Validates: Requirements 2.3, 2.4, 2.6, 3.3–3.4
 */

const providerService = require('../services/providerService');

/**
 * POST /api/v1/providers/documents
 * Requires: authenticate + authorize('Provider')
 * Multer middleware runs before this handler (file is on req.file).
 */
async function uploadDocument(req, res, next) {
  try {
    const result = await providerService.uploadDocument(req.user.userId, req.file);
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Document uploaded successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/providers/:id
 * Public — no authentication required.
 */
async function getPublicProfile(req, res, next) {
  try {
    const profile = await providerService.getPublicProfile(Number(req.params.id));
    return res.status(200).json({
      success: true,
      data: profile,
      message: 'Provider profile retrieved.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/v1/providers/profile
 * Requires: authenticate + authorize('Provider')
 */
async function updateProfile(req, res, next) {
  try {
    const updated = await providerService.updateProfile(req.user.userId, req.body);
    return res.status(200).json({
      success: true,
      data: updated,
      message: 'Profile updated successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/providers
 * Public — search/filter verified providers.
 * Query params: category, min_price, max_price, lat, lng, radius
 */
async function searchProviders(req, res, next) {
  try {
    const { providers, message } = await providerService.searchProviders(req.query);
    return res.status(200).json({
      success: true,
      data: providers,
      message,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { uploadDocument, getPublicProfile, updateProfile, searchProviders };
