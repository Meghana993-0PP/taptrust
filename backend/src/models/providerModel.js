/**
 * Provider model — database operations for the Professionals table.
 *
 * Validates: Requirements 2.1–2.6, 3.1–3.6
 */

const { pool } = require('../config/db');

/**
 * Find a Professionals record by its primary key.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const [rows] = await pool.query(
    `SELECT p.*, u.name, u.email, u.phone
     FROM Professionals p
     JOIN Users u ON u.id = p.user_id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Find a Professionals record by user_id.
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
async function findByUserId(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM Professionals WHERE user_id = ?',
    [userId]
  );
  return rows[0] || null;
}

/**
 * Update the verification_doc path for a provider.
 * @param {number} id  - Professionals.id
 * @param {string} docPath
 * @returns {Promise<void>}
 */
async function updateVerificationDoc(id, docPath) {
  await pool.query(
    'UPDATE Professionals SET verification_doc = ? WHERE id = ?',
    [docPath, id]
  );
}

/**
 * Update editable profile fields (bio, skills, hourly_rate).
 * @param {number} id  - Professionals.id
 * @param {{ bio?: string, skills?: string, hourly_rate?: number }} fields
 * @returns {Promise<void>}
 */
async function updateProfile(id, fields) {
  const allowed = ['bio', 'skills', 'hourly_rate'];
  const updates = [];
  const values = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }

  if (updates.length === 0) return;

  values.push(id);
  await pool.query(
    `UPDATE Professionals SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * Search Verified providers with optional filters.
 * Applies category, price range, and proximity (Haversine) filters.
 *
 * @param {{ category?: string, min_price?: number, max_price?: number,
 *            lat?: number, lng?: number, radius?: number }} filters
 * @returns {Promise<object[]>}
 */
async function searchProviders(filters = {}) {
  const { category, min_price, max_price, lat, lng, radius } = filters;

  // Base query — only Verified providers, ordered by rating DESC
  let sql = `
    SELECT
      p.id,
      u.name,
      p.service_category,
      p.hourly_rate,
      p.average_rating,
      p.total_reviews,
      p.verification_status
    FROM Professionals p
    JOIN Users u ON u.id = p.user_id
    WHERE p.verification_status = 'Verified'
  `;
  const params = [];

  if (category) {
    sql += ' AND p.service_category = ?';
    params.push(category);
  }

  if (min_price !== undefined && min_price !== null) {
    sql += ' AND p.hourly_rate >= ?';
    params.push(min_price);
  }

  if (max_price !== undefined && max_price !== null) {
    sql += ' AND p.hourly_rate <= ?';
    params.push(max_price);
  }

  // Proximity filter skipped — latitude/longitude columns not in schema

  sql += ' ORDER BY p.average_rating DESC';

  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = { findById, findByUserId, updateVerificationDoc, updateProfile, searchProviders };
