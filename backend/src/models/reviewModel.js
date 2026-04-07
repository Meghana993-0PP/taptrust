/**
 * Review model — database operations for the Reviews table.
 *
 * Validates: Requirements 7.1–7.6
 */

const { pool } = require('../config/db');

/**
 * Find a review by booking_id.
 * @param {number} bookingId
 * @returns {Promise<object|null>}
 */
async function findByBookingId(bookingId) {
  const [rows] = await pool.query(
    'SELECT * FROM Reviews WHERE booking_id = ?',
    [bookingId]
  );
  return rows[0] || null;
}

/**
 * Create a new review record.
 * @param {{ booking_id, customer_id, provider_id, rating, review_text }} data
 * @returns {Promise<number>} insertId
 */
async function createReview(data) {
  const { booking_id, customer_id, provider_id, rating, review_text } = data;
  const [result] = await pool.query(
    `INSERT INTO Reviews (booking_id, customer_id, provider_id, rating, review_text)
     VALUES (?, ?, ?, ?, ?)`,
    [booking_id, customer_id, provider_id, rating, review_text || null]
  );
  return result.insertId;
}

/**
 * Find a review by its primary key.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const [rows] = await pool.query(
    'SELECT * FROM Reviews WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

/**
 * Get all reviews for a provider, ordered by created_at DESC.
 * Includes reviewer first name.
 * @param {number} providerId  - Professionals.id
 * @returns {Promise<object[]>}
 */
async function findByProviderId(providerId) {
  const [rows] = await pool.query(
    `SELECT
       r.id,
       r.booking_id,
       r.rating,
       r.review_text,
       r.created_at,
       SUBSTRING_INDEX(u.name, ' ', 1) AS reviewer_first_name
     FROM Reviews r
     JOIN Users u ON u.id = r.customer_id
     WHERE r.provider_id = ?
     ORDER BY r.created_at DESC`,
    [providerId]
  );
  return rows;
}

/**
 * Recalculate and update average_rating and total_reviews on Professionals.
 * @param {number} providerId  - Professionals.id
 * @returns {Promise<void>}
 */
async function recalculateProviderRating(providerId) {
  await pool.query(
    `UPDATE Professionals
     SET
       average_rating = (
         SELECT COALESCE(AVG(rating), 0) FROM Reviews WHERE provider_id = ?
       ),
       total_reviews = (
         SELECT COUNT(*) FROM Reviews WHERE provider_id = ?
       )
     WHERE id = ?`,
    [providerId, providerId, providerId]
  );
}

module.exports = {
  findByBookingId,
  createReview,
  findById,
  findByProviderId,
  recalculateProviderRating,
};
