const express = require('express');
const {
  getCategories,
  getFacultyList,
  createComplaint,
  getMyComplaints,
  getComplaintById,
  reopenComplaint,
  getComplaintHistory,
  addComment
} = require('../controllers/complaintController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { handleOptionalUpload } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public / Authenticated category fetching
router.get('/categories', getCategories);

// Authenticated complaint operations
router.use(authenticateToken);

router.get('/faculty', getFacultyList);
router.post('/', handleOptionalUpload('attachment'), createComplaint);
router.get('/', getMyComplaints);
router.get('/:id', getComplaintById);
router.patch('/:id/reopen', reopenComplaint);
router.get('/:id/history', getComplaintHistory);
router.post('/:id/comments', addComment);

module.exports = router;
