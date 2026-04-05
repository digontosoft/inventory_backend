const { verifyAccess } = require('../utils/jwt');
const { error } = require('../utils/response');

/**
 * Verifies the Bearer access token and attaches req.user + req.shopId.
 */
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return error(res, 'Access token required', 401);
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccess(token);
    req.user = { id: payload.userId, role: payload.role };
    req.shopId = payload.shopId;
    next();
  } catch {
    return error(res, 'Invalid or expired access token', 401);
  }
};

/**
 * Role-based guard. Call after authenticate.
 * authorize('owner', 'admin') — allows owner and admin only.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return error(res, 'Forbidden', 403);
  }
  next();
};

module.exports = { authenticate, authorize };
