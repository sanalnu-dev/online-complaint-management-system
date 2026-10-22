const express = require('express');
const {
  getDashboardStats,
  getAllComplaints,
  updateComplaintStatus,
  updateComplaintPriority,
  assignComplaint,
  getUsers,
  getAdminList,
  getFacultyList,
  toggleUserActive,
  exportComplaintsCsv,
  getCategoriesWithMeta,
  createCategory,
  updateCategory,
  deleteCategory
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
router.get('/faculty', getFacultyList);
router.patch('/users/:id/active', toggleUserActive);
router.get('/reports/export', exportComplaintsCsv);

// Category Management
router.get('/categories', getCategoriesWithMeta);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;
