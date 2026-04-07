/**
 * Notification controller — HTTP handlers for /api/v1/notifications routes.
 *
 * Validates: Requirements 11.4, 11.5
 */

const { AppError } = require('../middleware/errorHandler');
const notificationModel = require('../models/notificationModel');

/**
 * GET /api/v1/notifications/me
 * Returns the authenticated user's notifications and unread count.
 */
async function getMyNotifications(req, res, next) {
  try {
    const userId = req.user.userId;
    const [notifications, unread_count] = await Promise.all([
      notificationModel.findByUserId(userId),
      notificationModel.countUnread(userId),
    ]);

    return res.status(200).json({
      success: true,
      data: { notifications, unread_count: Number(unread_count) },
      message: 'Notifications retrieved successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/v1/notifications/:id/read
 * Marks a notification as read (idempotent).
 */
async function markAsRead(req, res, next) {
  try {
    const userId = req.user.userId;
    const notifId = Number(req.params.id);

    const notification = await notificationModel.findById(notifId);
    if (!notification) {
      throw new AppError('Notification not found.', 404);
    }

    if (notification.user_id !== userId) {
      throw new AppError('Access denied.', 403);
    }

    // Idempotent — safe to call even if already read
    await notificationModel.markAsRead(notifId);

    const updated = await notificationModel.findById(notifId);
    return res.status(200).json({
      success: true,
      data: updated,
      message: 'Notification marked as read.',
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getMyNotifications, markAsRead };
