const express = require('express');
const {
  getDashboardStats,
  getAssignedComplaints,
  getAssignedComplaintById,
  updateAssignedComplaintStatus
} = require('../controllers/facultyController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireFaculty } = require('../middleware/roleMiddleware');

const router = express.Router();

// Enforce authentication and FACULTY or ADMIN role
router.use(authenticateToken);
router.use(requireFaculty);

router.get('/dashboard', getDashboardStats);
router.get('/complaints', getAssignedComplaints);
router.get('/complaints/:id', getAssignedComplaintById);
router.patch('/complaints/:id/status', updateAssignedComplaintStatus);

module.exports = router;
