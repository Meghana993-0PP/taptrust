/**
 * User model — database operations for the Users and Professionals tables.
 */

const { pool } = require('../config/db');

/**
 * Find a user by email.
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
  return rows[0] || null;
}

/**
 * Find a user by ID.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM Users WHERE id = ?', [id]);
  return rows[0] || null;
}

/**
 * Create a new user record.
 * @param {{ name, email, password_hash, phone, role }} data
 * @returns {Promise<number>} insertId
 */
async function createUser({ name, email, password_hash, phone, role }) {
  const [result] = await pool.query(
    'INSERT INTO Users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
    [name, email, password_hash, phone, role]
  );
  return result.insertId;
}

/**
 * Create a Professionals record linked to a user.
 * @param {{ user_id, service_category, years_experience, hourly_rate }} data
 * @returns {Promise<number>} insertId
 */
async function createProfessional({ user_id, service_category, years_experience, hourly_rate }) {
  const [result] = await pool.query(
    'INSERT INTO Professionals (user_id, service_category, years_experience, hourly_rate) VALUES (?, ?, ?, ?)',
    [user_id, service_category || null, Number.isFinite(years_experience) ? years_experience : null, Number.isFinite(hourly_rate) ? hourly_rate : null]
  );
  return result.insertId;
}

module.exports = { findByEmail, findById, createUser, createProfessional };
