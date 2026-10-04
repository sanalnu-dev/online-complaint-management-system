const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    // Fetch user from DB to verify active status and ensure fresh details
    const users = await query(
      'SELECT user_id, full_name, email, role, student_employee_id, is_active FROM users WHERE user_id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account not found'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact an administrator.'
      });
    }

    req.user = {
      userId: user.user_id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      studentEmployeeId: user.student_employee_id,
      isActive: Boolean(user.is_active)
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
        expired: true
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
}

module.exports = {
  authenticateToken
};
