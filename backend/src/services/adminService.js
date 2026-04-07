/**
 * Admin_Service — business logic for Admin_Service endpoints.
 *
 * Validates: Requirements 9.1–9.7
 */

const { AppError } = require('../middleware/errorHandler');
const adminModel = require('../models/adminModel');
const notificationService = require('./notificationService');

// ── 10.1 Dashboard ────────────────────────────────────────────────────────────

/**
 * Get platform dashboard metrics.
 * @returns {Promise<object>}
 */
async function getDashboard() {
  return adminModel.getDashboardMetrics();
}

// ── 10.2 Provider verification ────────────────────────────────────────────────

/**
 * Get all providers pending verification.
 * @returns {Promise<object[]>}
 */
async function getPendingProviders() {
  return adminModel.getPendingProviders();
}

/**
 * Approve or reject a provider's verification request.
 * On approve: set verification_status='Verified', notify provider.
 * On reject:  set verification_status='Rejected', store rejection_reason, notify provider.
 *
 * @param {number} providerId  - Professionals.id
 * @param {{ action: 'approve'|'reject', rejection_reason?: string }} body
 * @returns {Promise<object>} updated provider record
 */
async function verifyProvider(providerId, body) {
  const { action, rejection_reason } = body;

  if (!action || !['approve', 'reject'].includes(action)) {
    throw new AppError('action must be "approve" or "reject".', 400);
  }

  const provider = await adminModel.findProviderById(providerId);
  if (!provider) {
    throw new AppError('Provider not found.', 404);
  }

  if (action === 'reject') {
    if (!rejection_reason || String(rejection_reason).trim() === '') {
      throw new AppError('rejection_reason is required when rejecting a provider.', 400);
    }
    await adminModel.updateProviderVerification(providerId, 'Rejected', rejection_reason);

    await notificationService.createNotification({
      user_id: provider.user_id,
      type: 'verification_rejected',
      message: `Your verification request has been rejected. Reason: ${rejection_reason}`,
      link: '/provider/profile',
    });
  } else {
    await adminModel.updateProviderVerification(providerId, 'Verified', null);

    await notificationService.createNotification({
      user_id: provider.user_id,
      type: 'verification_approved',
      message: 'Congratulations! Your account has been verified. You can now accept bookings.',
      link: '/provider/dashboard',
    });
  }

  return adminModel.findProviderById(providerId);
}

// ── 10.3 Users list ───────────────────────────────────────────────────────────

/**
 * List users with optional search/filter.
 * @param {{ name?, email?, status?, from_date?, to_date? }} filters
 * @returns {Promise<object[]>}
 */
async function listUsers(filters) {
  return adminModel.listUsers(filters);
}

// ── 10.4 Deactivate user ──────────────────────────────────────────────────────

/**
 * Deactivate a user account (set is_active=false).
 * @param {number} userId
 * @returns {Promise<object>} updated user record
 */
async function deactivateUser(userId) {
  const user = await adminModel.findUserById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (!user.is_active) {
    throw new AppError('User account is already deactivated.', 400);
  }

  await adminModel.deactivateUser(userId);
  return adminModel.findUserById(userId);
}

// ── 10.5 Bookings list ────────────────────────────────────────────────────────

/**
 * List all bookings with optional filters.
 * @param {{ status?, from_date?, to_date?, category?, provider_name? }} filters
 * @returns {Promise<object[]>}
 */
async function listBookings(filters) {
  return adminModel.listBookings(filters);
}

// ── 10.6 Complaints ───────────────────────────────────────────────────────────

/**
 * Get all complaints.
 * @returns {Promise<object[]>}
 */
async function listComplaints() {
  return adminModel.listComplaints();
}

/**
 * Mark a complaint as resolved.
 * @param {number} complaintId
 * @returns {Promise<object>} updated complaint
 */
async function resolveComplaint(complaintId) {
  const complaint = await adminModel.findComplaintById(complaintId);
  if (!complaint) {
    throw new AppError('Complaint not found.', 404);
  }

  if (complaint.status === 'Resolved') {
    throw new AppError('Complaint is already resolved.', 400);
  }

  await adminModel.resolveComplaint(complaintId);
  return adminModel.findComplaintById(complaintId);
}

async function getReports(period) {
  return adminModel.getReports(period);
}

async function getRecentActivity() {
  return adminModel.getRecentActivity();
}

module.exports = {
  getDashboard, getPendingProviders, verifyProvider,
  listUsers, deactivateUser, listBookings,
  listComplaints, resolveComplaint, getReports, getRecentActivity,
};
