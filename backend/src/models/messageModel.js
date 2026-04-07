/**
 * Message model — database operations for the Messages table.
 *
 * Validates: Requirements 10.1–10.5
 */

const { pool } = require('../config/db');

/**
 * Create a new message record.
 * @param {{ booking_id, sender_id, receiver_id, message_text }} data
 * @returns {Promise<number>} insertId
 */
async function createMessage(data) {
  const { booking_id, sender_id, receiver_id, message_text } = data;
  const [result] = await pool.query(
    `INSERT INTO Messages (booking_id, sender_id, receiver_id, message_text)
     VALUES (?, ?, ?, ?)`,
    [booking_id, sender_id, receiver_id, message_text]
  );
  return result.insertId;
}

/**
 * Find a message by its primary key.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const [rows] = await pool.query(
    'SELECT * FROM Messages WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

/**
 * Get all messages for a booking, ordered by created_at ASC.
 * @param {number} bookingId
 * @returns {Promise<object[]>}
 */
async function findByBookingId(bookingId) {
  const [rows] = await pool.query(
    `SELECT id, booking_id, sender_id, receiver_id, message_text, created_at
     FROM Messages
     WHERE booking_id = ?
     ORDER BY created_at ASC`,
    [bookingId]
  );
  return rows;
}

module.exports = { createMessage, findById, findByBookingId };
