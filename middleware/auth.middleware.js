const { verifyAccess } = require('../utils/jwt');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  try {
    const payload = verifyAccess(header.slice(7));
    req.user   = { id: payload.userId, role: payload.role };
    req.shopId = payload.shopId;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired access token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  next();
};

module.exports = { authenticate, authorize };
