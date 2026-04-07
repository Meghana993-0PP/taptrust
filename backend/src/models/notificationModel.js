/**
 * Notification model — database operations for the Notifications table.
 *
 * Validates: Requirements 11.1–11.5
 */

const { pool } = require('../config/db');

/**
 * Insert a new notification record.
 * @param {{ user_id: number, type: string, message: string, link?: string }} data
 * @returns {Promise<number>} insertId
 */
async function create({ user_id, type, message, link = null }) {
  const [result] = await pool.query(
    'INSERT INTO Notifications (user_id, type, message, link) VALUES (?, ?, ?, ?)',
    [user_id, type, message, link]
  );
  return result.insertId;
}

/**
 * Find all notifications for a user, ordered newest first.
 * @param {number} userId
 * @returns {Promise<object[]>}
 */
async function findByUserId(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
}

/**
 * Count unread notifications for a user.
 * @param {number} userId
 * @returns {Promise<number>}
 */
async function countUnread(userId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM Notifications WHERE user_id = ? AND is_read = FALSE',
    [userId]
  );
  return rows[0].cnt;
}

/**
 * Find a single notification by id.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM Notifications WHERE id = ?', [id]);
  return rows[0] || null;
}

/**
 * Mark a notification as read (idempotent).
 * @param {number} id
 * @returns {Promise<void>}
 */
async function markAsRead(id) {
  await pool.query('UPDATE Notifications SET is_read = TRUE WHERE id = ?', [id]);
}

module.exports = { create, findByUserId, countUnread, findById, markAsRead };
