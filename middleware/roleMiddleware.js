const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Access denied: no role assigned' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied: requires role ${allowedRoles.join(' or ')}` });
    }
    next();
  };
};

const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({ message: 'Access denied: no permissions found' });
    }
    const hasPermission = requiredPermissions.every((p) => req.user.permissions.includes(p));
    if (!hasPermission) {
      return res.status(403).json({ message: `Access denied: missing permission ${requiredPermissions.join(', ')}` });
    }
    next();
  };
};

module.exports = { requireRole, requirePermission };