function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Treat 'USER' and 'STUDENT' as student role for backwards compatibility
    const userRole = req.user.role;
    const isAllowed = roles.some((role) => {
      if (role === 'STUDENT' && (userRole === 'STUDENT' || userRole === 'USER')) return true;
      if (role === 'USER' && (userRole === 'STUDENT' || userRole === 'USER')) return true;
      return userRole === role;
    });

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to perform this action'
      });
    }

    next();
  };
}

const requireAdmin = requireRole(['ADMIN']);
const requireFaculty = requireRole(['FACULTY', 'ADMIN']);
const requireFacultyOnly = requireRole(['FACULTY']);
const requireStudent = requireRole(['STUDENT', 'USER']);
const requireUser = requireRole(['USER', 'STUDENT', 'FACULTY', 'ADMIN']);

module.exports = {
  requireRole,
  requireAdmin,
  requireFaculty,
  requireFacultyOnly,
  requireStudent,
  requireUser
};
