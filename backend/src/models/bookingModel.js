/**
 * Booking model — database operations for the Bookings table.
 *
 * Validates: Requirements 4.1–4.7, 5.1–5.6, 8.1–8.5
 */

const { pool } = require('../config/db');

/**
 * Create a new booking record.
 * @param {{ customer_id, provider_id, service_category, scheduled_date, scheduled_time, service_address, estimated_cost }} data
 * @returns {Promise<number>} insertId
 */
async function createBooking(data) {
  const {
    customer_id,
    provider_id,
    service_category,
    scheduled_date,
    scheduled_time,
    service_address,
    estimated_cost,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO Bookings
      (customer_id, provider_id, service_category, scheduled_date, scheduled_time, service_address, estimated_cost, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Booked')`,
    [customer_id, provider_id, service_category, scheduled_date, scheduled_time, service_address, estimated_cost || null]
  );
  return result.insertId;
}

/**
 * Find a booking by its primary key.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const [rows] = await pool.query(
    `SELECT b.*,
            u.name AS customer_name,
            u.email AS customer_email,
            u.phone AS customer_phone,
            pu.name AS provider_name
     FROM Bookings b
     JOIN Users u ON u.id = b.customer_id
     JOIN Professionals p ON p.id = b.provider_id
     JOIN Users pu ON pu.id = p.user_id
     WHERE b.id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Find all bookings for a customer.
 * @param {number} customerId
 * @returns {Promise<object[]>}
 */
async function findByCustomerId(customerId) {
  const [rows] = await pool.query(
    `SELECT b.*,
            pu.name AS provider_name
     FROM Bookings b
     JOIN Professionals p ON p.id = b.provider_id
     JOIN Users pu ON pu.id = p.user_id
     WHERE b.customer_id = ?
     ORDER BY b.created_at DESC`,
    [customerId]
  );
  return rows;
}

/**
 * Find all bookings for a provider (via Professionals.id).
 * @param {number} professionalId
 * @returns {Promise<object[]>}
 */
async function findByProviderId(professionalId) {
  const [rows] = await pool.query(
    `SELECT b.*,
            u.name AS customer_name,
            u.email AS customer_email,
            u.phone AS customer_phone
     FROM Bookings b
     JOIN Users u ON u.id = b.customer_id
     WHERE b.provider_id = ?
     ORDER BY b.created_at DESC`,
    [professionalId]
  );
  return rows;
}

/**
 * Check if a provider already has an Accepted booking at the given date+time.
 * @param {number} providerId  - Professionals.id
 * @param {string} date        - YYYY-MM-DD
 * @param {string} time        - HH:MM:SS
 * @returns {Promise<boolean>}
 */
async function hasConflict(providerId, date, time) {
  const [rows] = await pool.query(
    `SELECT id FROM Bookings
     WHERE provider_id = ? AND scheduled_date = ? AND scheduled_time = ? AND status = 'Accepted'
     LIMIT 1`,
    [providerId, date, time]
  );
  return rows.length > 0;
}

/**
 * Update the status of a booking.
 * @param {number} id
 * @param {string} status
 * @param {object} [extra]  - Optional extra fields: rejection_reason, start_timestamp, end_timestamp
 * @returns {Promise<void>}
 */
async function updateStatus(id, status, extra = {}) {
  const updates = ['status = ?'];
  const values = [status];

  if (extra.rejection_reason !== undefined) {
    updates.push('rejection_reason = ?');
    values.push(extra.rejection_reason);
  }
  if (extra.start_timestamp !== undefined) {
    updates.push('start_timestamp = ?');
    values.push(extra.start_timestamp);
  }
  if (extra.end_timestamp !== undefined) {
    updates.push('end_timestamp = ?');
    values.push(extra.end_timestamp);
  }

  values.push(id);
  await pool.query(
    `UPDATE Bookings SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
}

module.exports = {
  createBooking,
  findById,
  findByCustomerId,
  findByProviderId,
  hasConflict,
  updateStatus,
};
