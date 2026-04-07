/**
 * Payment model — database operations for the Payments table.
 *
 * Validates: Requirements 6.1–6.6
 */

const { pool } = require('../config/db');

/**
 * Create a new payment record.
 * @param {{ booking_id, customer_id, amount, status, transaction_ref, payment_gateway }} data
 * @returns {Promise<number>} insertId
 */
async function createPayment(data) {
  const {
    booking_id,
    customer_id,
    amount,
    status = 'Pending',
    transaction_ref = null,
    payment_gateway = 'stripe',
  } = data;

  const [result] = await pool.query(
    `INSERT INTO Payments (booking_id, customer_id, amount, status, transaction_ref, payment_gateway)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [booking_id, customer_id, amount, status, transaction_ref, payment_gateway]
  );
  return result.insertId;
}

/**
 * Find a payment by booking_id.
 * @param {number} bookingId
 * @returns {Promise<object|null>}
 */
async function findByBookingId(bookingId) {
  const [rows] = await pool.query(
    'SELECT * FROM Payments WHERE booking_id = ? ORDER BY created_at DESC LIMIT 1',
    [bookingId]
  );
  return rows[0] || null;
}

/**
 * Find a payment by its primary key.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM Payments WHERE id = ?', [id]);
  return rows[0] || null;
}

/**
 * Get provider earnings summary (monthly and all-time).
 * Joins Payments → Bookings → Professionals to scope by provider.
 *
 * @param {number} professionalId  - Professionals.id
 * @returns {Promise<{ monthly: object, all_time: object }>}
 */
async function getProviderEarnings(professionalId) {
  // All-time: completed payments for this provider's bookings
  const [allTimeRows] = await pool.query(
    `SELECT
       COALESCE(SUM(p.amount), 0)   AS total_earnings,
       COUNT(p.id)                  AS completed_jobs,
       COALESCE(AVG(r.rating), 0)   AS average_rating
     FROM Payments p
     JOIN Bookings b ON b.id = p.booking_id
     LEFT JOIN Reviews r ON r.booking_id = b.id
     WHERE b.provider_id = ?
       AND p.status = 'Completed'`,
    [professionalId]
  );

  // Monthly: same but restricted to current calendar month
  const [monthlyRows] = await pool.query(
    `SELECT
       COALESCE(SUM(p.amount), 0)   AS total_earnings,
       COUNT(p.id)                  AS completed_jobs,
       COALESCE(AVG(r.rating), 0)   AS average_rating
     FROM Payments p
     JOIN Bookings b ON b.id = p.booking_id
     LEFT JOIN Reviews r ON r.booking_id = b.id
     WHERE b.provider_id = ?
       AND p.status = 'Completed'
       AND YEAR(p.created_at)  = YEAR(NOW())
       AND MONTH(p.created_at) = MONTH(NOW())`,
    [professionalId]
  );

  return {
    monthly: {
      total_earnings: Number(monthlyRows[0].total_earnings),
      completed_jobs: Number(monthlyRows[0].completed_jobs),
      average_rating: Number(Number(monthlyRows[0].average_rating).toFixed(2)),
    },
    all_time: {
      total_earnings: Number(allTimeRows[0].total_earnings),
      completed_jobs: Number(allTimeRows[0].completed_jobs),
      average_rating: Number(Number(allTimeRows[0].average_rating).toFixed(2)),
    },
  };
}

module.exports = { createPayment, findByBookingId, findById, getProviderEarnings };
