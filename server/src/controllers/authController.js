const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const {
  validateRegister,
  validateLogin,
  validateChangePassword
} = require('../validators/authValidator');

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.user_id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

async function register(req, res, next) {
  try {
    const validation = validateRegister(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        errors: validation.errors
      });
    }

    const { full_name, email, student_employee_id } = validation.sanitized;
    const { password } = req.body;

    // Check if email already exists
    const existing = await query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password with bcrypt salt rounds = 10
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Enforce role = 'USER' for public registrations (prevent privilege escalation)
    const result = await query(
      `INSERT INTO users (full_name, email, password_hash, role, student_employee_id, is_active)
       VALUES (?, ?, ?, 'USER', ?, 1)`,
      [full_name, email, password_hash, student_employee_id]
    );

    const newUser = {
      user_id: result.insertId,
      full_name,
      email,
      role: 'USER',
      student_employee_id,
      is_active: 1
    };

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        userId: newUser.user_id,
        fullName: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        studentEmployeeId: newUser.student_employee_id
      }
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        errors: validation.errors
      });
    }

    const { email, password } = validation.sanitized;

    const users = await query(
      `SELECT user_id, full_name, email, password_hash, role, student_employee_id, is_active 
       FROM users WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        studentEmployeeId: user.student_employee_id
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    // req.user is set by authenticateToken middleware
    const users = await query(
      `SELECT user_id, full_name, email, role, student_employee_id, is_active, created_at
       FROM users WHERE user_id = ?`,
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    return res.status(200).json({
      success: true,
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        studentEmployeeId: user.student_employee_id,
        isActive: Boolean(user.is_active),
        createdAt: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { full_name, student_employee_id } = req.body;

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Full name must be at least 2 characters long'
      });
    }

    await query(
      `UPDATE users 
       SET full_name = ?, student_employee_id = ?, updated_at = NOW() 
       WHERE user_id = ?`,
      [full_name.trim(), student_employee_id ? student_employee_id.trim() : null, req.user.userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        userId: req.user.userId,
        fullName: full_name.trim(),
        email: req.user.email,
        role: req.user.role,
        studentEmployeeId: student_employee_id ? student_employee_id.trim() : null
      }
    });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const validation = validateChangePassword(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        errors: validation.errors
      });
    }

    const { old_password, new_password } = req.body;

    // Fetch user password_hash
    const users = await query(
      'SELECT password_hash FROM users WHERE user_id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(old_password, users[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await query(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?',
      [newHash, req.user.userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
};
