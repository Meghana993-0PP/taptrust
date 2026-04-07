/**
 * Admin routes — /api/v1/admin
 *
 * All routes require authentication and Admin role.
 * Validates: Requirements 9.1–9.7, 12.2, 12.4
 */

const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// All admin routes require authentication and Admin role
router.use(authenticate, authorize('Admin'));

// 10.1 Dashboard metrics
router.get('/dashboard', adminController.getDashboard);

// 10.2 Provider verification
router.get('/providers/pending', adminController.getPendingProviders);
router.patch('/providers/:id/verify', adminController.verifyProvider);

// 10.3 Users list with search/filter
router.get('/users', adminController.listUsers);

// 10.4 Deactivate user
router.patch('/users/:id/deactivate', adminController.deactivateUser);

// 10.5 Bookings list with filters
router.get('/bookings', adminController.listBookings);

// 10.6 Complaints
router.get('/complaints', adminController.listComplaints);
router.patch('/complaints/:id/resolve', adminController.resolveComplaint);

// 10.7 Reports
router.get('/reports', adminController.getReports);

// 10.8 Recent activity
router.get('/activity', adminController.getRecentActivity);

module.exports = router;
