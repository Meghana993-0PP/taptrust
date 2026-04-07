/**
 * Notification routes — /api/v1/notifications
 *
 * Validates: Requirements 11.4, 11.5
 */

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getMyNotifications, markAsRead } = require('../controllers/notificationController');

// All notification routes require authentication
router.use(authenticate);

// GET /api/v1/notifications/me — user's notifications + unread count
router.get('/me', getMyNotifications);

// PATCH /api/v1/notifications/:id/read — mark a notification as read
router.patch('/:id/read', markAsRead);

module.exports = router;
