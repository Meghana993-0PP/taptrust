/**
 * Admin controller — HTTP handlers for /api/v1/admin routes.
 *
 * Validates: Requirements 9.1–9.7
 */

const adminService = require('../services/adminService');

/**
 * GET /api/v1/admin/dashboard
 * Returns platform metrics: total customers, providers, bookings, revenue, pending verifications.
 */
async function getDashboard(req, res, next) {
  try {
    const metrics = await adminService.getDashboard();
    return res.status(200).json({
      success: true,
      data: metrics,
      message: 'Dashboard metrics retrieved successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/admin/providers/pending
 * Returns all providers with Pending verification status.
 */
async function getPendingProviders(req, res, next) {
  try {
    const providers = await adminService.getPendingProviders();
    return res.status(200).json({
      success: true,
      data: providers,
      message: 'Pending providers retrieved successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/v1/admin/providers/:id/verify
 * Body: { action: 'approve'|'reject', rejection_reason? }
 * Approve or reject a provider's verification request.
 */
async function verifyProvider(req, res, next) {
  try {
    const provider = await adminService.verifyProvider(Number(req.params.id), req.body);
    return res.status(200).json({
      success: true,
      data: provider,
      message: `Provider ${req.body.action === 'approve' ? 'approved' : 'rejected'} successfully.`,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/admin/users
 * Query params: name, email, status (active|inactive), from_date, to_date
 */
async function listUsers(req, res, next) {
  try {
    const users = await adminService.listUsers(req.query);
    return res.status(200).json({
      success: true,
      data: users,
      message: 'Users retrieved successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/v1/admin/users/:id/deactivate
 * Sets is_active=false for the specified user.
 */
async function deactivateUser(req, res, next) {
  try {
    const user = await adminService.deactivateUser(Number(req.params.id));
    return res.status(200).json({
      success: true,
      data: user,
      message: 'User account deactivated successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/admin/bookings
 * Query params: status, from_date, to_date, category, provider_name
 */
async function listBookings(req, res, next) {
  try {
    const bookings = await adminService.listBookings(req.query);
    return res.status(200).json({
      success: true,
      data: bookings,
      message: 'Bookings retrieved successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/admin/complaints
 * Returns all complaints.
 */
async function listComplaints(req, res, next) {
  try {
    const complaints = await adminService.listComplaints();
    return res.status(200).json({
      success: true,
      data: complaints,
      message: 'Complaints retrieved successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/v1/admin/complaints/:id/resolve
 * Marks a complaint as resolved.
 */
async function resolveComplaint(req, res, next) {
  try {
    const complaint = await adminService.resolveComplaint(Number(req.params.id));
    return res.status(200).json({
      success: true,
      data: complaint,
      message: 'Complaint resolved successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/admin/reports?period=daily|weekly|monthly
 */
async function getReports(req, res, next) {
  try {
    const period = req.query.period || 'monthly';
    const data = await adminService.getReports(period);
    return res.status(200).json({ success: true, data, message: 'Reports retrieved.' });
  } catch (err) { return next(err); }
}

async function getRecentActivity(req, res, next) {
  try {
    const data = await adminService.getRecentActivity();
    return res.status(200).json({ success: true, data, message: 'Activity retrieved.' });
  } catch (err) { return next(err); }
}

module.exports = {
  getDashboard, getPendingProviders, verifyProvider,
  listUsers, deactivateUser, listBookings,
  listComplaints, resolveComplaint, getReports, getRecentActivity,
};
