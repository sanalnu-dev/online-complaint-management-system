const express = require('express');
const {
  getDashboardStats,
  getAllComplaints,
  updateComplaintStatus,
  updateComplaintPriority,
  assignComplaint,
  getUsers,
  getAdminList,
  toggleUserActive,
  exportComplaintsCsv
} = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

// Enforce both authentication and ADMIN role on all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/complaints', getAllComplaints);
router.patch('/complaints/:id/status', updateComplaintStatus);
router.patch('/complaints/:id/priority', updateComplaintPriority);
router.patch('/complaints/:id/assign', assignComplaint);
router.get('/users', getUsers);
router.get('/admins', getAdminList);
router.patch('/users/:id/active', toggleUserActive);
router.get('/reports/export', exportComplaintsCsv);

module.exports = router;
