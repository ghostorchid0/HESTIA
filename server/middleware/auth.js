const jwt = require('jsonwebtoken');
const config = require('../config');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(403).json({ message: 'Unauthorized' });
    const userRole = req.user.role;
    if (userRole === 'superadmin' && roles.includes('admin')) return next();
    if (roles.includes(userRole)) return next();
    return res.status(403).json({ message: 'Insufficient permissions' });
  };
}

module.exports = { requireAuth, requireRole };
