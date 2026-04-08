/**
 * Provider routes — /api/v1/providers
 *
 * Validates: Requirements 2.3, 2.4, 2.6, 3.3–3.4
 */

const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const providerController = require('../controllers/providerController');

// ── POST /api/v1/providers/documents ─────────────────────────────────────────
// Provider only; multer handles the multipart/form-data
router.post(
  '/documents',
  authenticate,
  authorize('Provider'),
  upload.single('document'),
  providerController.uploadDocument
);

// ── GET /api/v1/providers/profile ────────────────────────────────────────────
// Provider only
router.get(
  '/profile',
  authenticate,
  authorize('Provider'),
  providerController.getOwnProfile
);

// ── PATCH /api/v1/providers/profile ──────────────────────────────────────────
// Provider only
router.patch(
  '/profile',
  authenticate,
  authorize('Provider'),
  providerController.updateProfile
);

// ── GET /api/v1/providers/:id ─────────────────────────────────────────────────
// Public — no auth required
router.get('/:id', providerController.getPublicProfile);

// ── GET /api/v1/providers ─────────────────────────────────────────────────────
// Search/filter verified providers — Task 4
router.get('/', providerController.searchProviders);

module.exports = router;
