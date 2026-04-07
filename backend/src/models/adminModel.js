/**
 * Admin model — database operations for Admin_Service.
 *
 * Validates: Requirements 9.1–9.7
 */

const { pool } = require('../config/db');

// ── Dashboard ─────────────────────────────────────────────────────────────────

/**
 * Get platform-wide dashboard metrics.
 * @returns {Promise<{ total_customers, total_providers, total_bookings, total_revenue, pending_verifications }>}
 */
async function getDashboardMetrics() {
  const [[customers]] = await pool.query(
    `SELECT COUNT(*) AS total FROM Users WHERE role = 'Customer' AND is_active = TRUE`
  );
  const [[providers]] = await pool.query(
    `SELECT COUNT(*) AS total FROM Users WHERE role = 'Provider' AND is_active = TRUE`
  );
  const [[bookings]] = await pool.query(
    `SELECT COUNT(*) AS total FROM Bookings`
  );
  const [[revenue]] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM Payments WHERE status = 'Completed'`
  );
  const [[pending]] = await pool.query(
    `SELECT COUNT(*) AS total FROM Professionals WHERE verification_status = 'Pending'`
  );

  return {
    total_customers: customers.total,
    total_providers: providers.total,
    total_bookings: bookings.total,
    total_revenue: parseFloat(revenue.total),
    pending_verifications: pending.total,
  };
}

// ── Provider verification ─────────────────────────────────────────────────────

/**
 * Get all providers with Pending verification status.
 * @returns {Promise<object[]>}
 */
async function getPendingProviders() {
  const [rows] = await pool.query(
    `SELECT p.*, u.name, u.email, u.phone, u.created_at AS user_created_at
     FROM Professionals p
     JOIN Users u ON u.id = p.user_id
     WHERE p.verification_status = 'Pending'
     ORDER BY p.created_at ASC`
  );
  return rows;
}

/**
 * Find a Professionals record by its primary key (with user info).
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function findProviderById(id) {
  const [rows] = await pool.query(
    `SELECT p.*, u.name, u.email, u.phone, u.id AS user_id_ref
     FROM Professionals p
     JOIN Users u ON u.id = p.user_id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Update a provider's verification status.
 * @param {number} id  - Professionals.id
 * @param {string} status  - 'Verified' | 'Rejected'
 * @param {string|null} rejection_reason
 * @returns {Promise<void>}
 */
async function updateProviderVerification(id, status, rejection_reason = null) {
  if (rejection_reason !== null) {
    await pool.query(
      `UPDATE Professionals SET verification_status = ?, rejection_reason = ? WHERE id = ?`,
      [status, rejection_reason, id]
    );
  } else {
    await pool.query(
      `UPDATE Professionals SET verification_status = ? WHERE id = ?`,
      [status, id]
    );
  }
}

// ── Users management ──────────────────────────────────────────────────────────

/**
 * List users with optional filters.
 * @param {{ name?, email?, status?, from_date?, to_date? }} filters
 * @returns {Promise<object[]>}
 */
async function listUsers(filters = {}) {
  const { name, email, status, from_date, to_date } = filters;

  let sql = `SELECT id, name, email, phone, role, is_active, created_at, updated_at FROM Users WHERE 1=1`;
  const params = [];

  if (name) {
    sql += ` AND name LIKE ?`;
    params.push(`%${name}%`);
  }
  if (email) {
    sql += ` AND email LIKE ?`;
    params.push(`%${email}%`);
  }
  if (status === 'active') {
    sql += ` AND is_active = TRUE`;
  } else if (status === 'inactive') {
    sql += ` AND is_active = FALSE`;
  }
  if (from_date) {
    sql += ` AND created_at >= ?`;
    params.push(from_date);
  }
  if (to_date) {
    sql += ` AND created_at <= ?`;
    params.push(to_date);
  }

  sql += ` ORDER BY created_at DESC`;

  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Deactivate a user account (set is_active = false).
 * @param {number} id  - Users.id
 * @returns {Promise<boolean>} true if a row was updated
 */
async function deactivateUser(id) {
  const [result] = await pool.query(
    `UPDATE Users SET is_active = FALSE WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

/**
 * Find a user by ID.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function findUserById(id) {
  const [rows] = await pool.query(
    `SELECT id, name, email, phone, role, is_active, created_at FROM Users WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

// ── Bookings management ───────────────────────────────────────────────────────

/**
 * List all bookings with optional filters.
 * @param {{ status?, from_date?, to_date?, category?, provider_name? }} filters
 * @returns {Promise<object[]>}
 */
async function listBookings(filters = {}) {
  const { status, from_date, to_date, category, provider_name } = filters;

  let sql = `
    SELECT b.*,
           cu.name AS customer_name,
           cu.email AS customer_email,
           pu.name AS provider_name
    FROM Bookings b
    JOIN Users cu ON cu.id = b.customer_id
    JOIN Professionals p ON p.id = b.provider_id
    JOIN Users pu ON pu.id = p.user_id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ` AND b.status = ?`;
    params.push(status);
  }
  if (from_date) {
    sql += ` AND b.scheduled_date >= ?`;
    params.push(from_date);
  }
  if (to_date) {
    sql += ` AND b.scheduled_date <= ?`;
    params.push(to_date);
  }
  if (category) {
    sql += ` AND b.service_category = ?`;
    params.push(category);
  }
  if (provider_name) {
    sql += ` AND pu.name LIKE ?`;
    params.push(`%${provider_name}%`);
  }

  sql += ` ORDER BY b.created_at DESC`;

  const [rows] = await pool.query(sql, params);
  return rows;
}

// ── Complaints ────────────────────────────────────────────────────────────────

/**
 * Get all complaints.
 * @returns {Promise<object[]>}
 */
async function listComplaints() {
  const [rows] = await pool.query(
    `SELECT c.*, u.name AS user_name, u.email AS user_email
     FROM Complaints c
     JOIN Users u ON u.id = c.user_id
     ORDER BY c.created_at DESC`
  );
  return rows;
}

/**
 * Find a complaint by ID.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function findComplaintById(id) {
  const [rows] = await pool.query(
    `SELECT * FROM Complaints WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Mark a complaint as resolved.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
async function resolveComplaint(id) {
  const [result] = await pool.query(
    `UPDATE Complaints SET status = 'Resolved' WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

async function getReports(period) {
  const intervals = { daily: '1 DAY', weekly: '7 DAY', monthly: '30 DAY' };
  const interval = intervals[period] || '30 DAY';

  const [[users]] = await pool.query(
    `SELECT COUNT(*) AS total FROM Users WHERE role = 'Customer' AND created_at >= DATE_SUB(NOW(), INTERVAL ${interval})`
  );
  const [[bookings]] = await pool.query(
    `SELECT COUNT(*) AS total FROM Bookings WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${interval})`
  );
  const [[revenue]] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM Payments WHERE status = 'Completed' AND created_at >= DATE_SUB(NOW(), INTERVAL ${interval})`
  );

  // Top service by booking count
  const [topServices] = await pool.query(
    `SELECT service_category, COUNT(*) AS cnt FROM Bookings 
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${interval}) AND service_category IS NOT NULL
     GROUP BY service_category ORDER BY cnt DESC LIMIT 6`
  );

  const totalBookings = topServices.reduce((s, r) => s + Number(r.cnt), 0) || 1;
  const serviceStats = topServices.map(r => ({
    name: r.service_category,
    count: Number(r.cnt),
    pct: Math.round((Number(r.cnt) / totalBookings) * 100),
  }));

  return {
    new_users: users.total,
    bookings: bookings.total,
    revenue: parseFloat(revenue.total),
    top_service: topServices[0]?.service_category || '—',
    service_stats: serviceStats,
  };
}

async function getRecentActivity() {
  // Merge recent users, bookings, payments into a unified activity feed
  const [users] = await pool.query(
    `SELECT 'user' AS type, CONCAT('New user registered: ', name) AS text, created_at FROM Users ORDER BY created_at DESC LIMIT 5`
  );
  const [bookings] = await pool.query(
    `SELECT 'booking' AS type, CONCAT('Booking #', b.id, ' by ', u.name) AS text, b.created_at 
     FROM Bookings b JOIN Users u ON u.id = b.customer_id ORDER BY b.created_at DESC LIMIT 5`
  );
  const [payments] = await pool.query(
    `SELECT 'payment' AS type, CONCAT('Payment ₹', amount, ' received') AS text, created_at 
     FROM Payments ORDER BY created_at DESC LIMIT 5`
  );

  const all = [...users, ...bookings, ...payments]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  return all;
}

module.exports = {
  getDashboardMetrics, getPendingProviders, findProviderById,
  updateProviderVerification, listUsers, deactivateUser,
  findUserById, listBookings, listComplaints,
  findComplaintById, resolveComplaint, getReports, getRecentActivity,
};
