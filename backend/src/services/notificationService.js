/**
 * Notification_Service — creates notification records and emits real-time events.
 *
 * Validates: Requirements 11.1–11.5
 */

const notificationModel = require('../models/notificationModel');

/**
 * Create a notification record for a user.
 * - Inserts into Notifications table
 * - Emits Socket.io `notification:new` to room `user:<user_id>`
 * - Logs mock email and SMS to console
 *
 * @param {{ user_id: number, type: string, message: string, link?: string, _io?: object }} data
 *   _io is an optional override for the Socket.io instance (used in tests / direct calls).
 *   In normal HTTP request context, pass req.app.locals.io via the caller or use global app.
 * @returns {Promise<number>} insertId
 */
async function createNotification({ user_id, type, message, link = null, _io = null }) {
  const insertId = await notificationModel.create({ user_id, type, message, link });

  // 6.4 — Emit Socket.io event to user's personal room
  const io = _io || _getGlobalIo();
  if (io) {
    io.to(`user:${user_id}`).emit('notification:new', {
      id: insertId,
      user_id,
      type,
      message,
      link,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  // 6.5 — Mock email log
  console.log(`[Email] To user=${user_id} | type=${type} | ${message}`);

  // 6.5 — Mock SMS log
  console.log(`[SMS]   To user=${user_id} | type=${type} | ${message}`);

  return insertId;
}

/**
 * Attempt to retrieve the global io instance from the Express app.
 * Returns null if not available (e.g., during tests).
 */
function _getGlobalIo() {
  try {
    // app.locals.io is set in index.js after Socket.io is attached
    const app = require('../app');
    return app.locals && app.locals.io ? app.locals.io : null;
  } catch {
    return null;
  }
}

module.exports = { createNotification };
