/**
 * Chat routes — /api/v1/chat
 *
 * Validates: Requirements 10.1–10.5
 */

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// GET /api/v1/chat/:bookingId/history — Authenticated participants only
router.get(
  '/:bookingId/history',
  authenticate,
  chatController.getChatHistory
);

module.exports = router;
