function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to perform this action'
      });
    }

    next();
  };
}

const requireAdmin = requireRole(['ADMIN']);
const requireUser = requireRole(['USER', 'ADMIN']);

module.exports = {
  requireRole,
  requireAdmin,
  requireUser
};
