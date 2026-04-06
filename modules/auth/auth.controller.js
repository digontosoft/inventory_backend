const asyncHandler = require('express-async-handler');
const db           = require('../../config/db');
const { hashPassword, comparePassword } = require('../../utils/hash');
const { signAccess, signRefresh, verifyRefresh } = require('../../utils/jwt');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseDuration = (str) => {
  const map = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return parseInt(str, 10) * (map[str.slice(-1)] || 1_000);
};

const storeRefreshToken = (userId, jti, trx = null) => {
  const expires_at = new Date(Date.now() + parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d'));
  return (trx || db)('refresh_tokens').insert({ user_id: userId, jti, expires_at });
};

const issueTokens = async (user, shopId, trx = null) => {
  const accessToken                  = signAccess({ userId: user.id, shopId, role: user.role });
  const { token: refreshToken, jti } = signRefresh(user.id);
  await storeRefreshToken(user.id, jti, trx);
  return { accessToken, refreshToken };
};

const formatUser = (user, shopName = null) => ({
  id:       user.id,
  name:     user.name,
  email:    user.email,
  phone:    user.phone || null,
  role:     user.role,
  shopId:   user.shop_id,
  shopName: shopName || null,
});

// ─── POST /auth/register ──────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, shopName } = req.body;

  if (!name || !email || !password || !shopName) {
    return res.status(400).json({ success: false, error: 'name, email, password and shopName are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address' });
  }

  const existing = await db('users').where({ email }).whereNull('deleted_at').first();
  if (existing) {
    return res.status(409).json({ success: false, error: 'Email already in use' });
  }

  const result = await db.transaction(async (trx) => {
    const [shop] = await trx('shops').insert({ name: shopName }).returning('*');
    const hashed = await hashPassword(password);
    const [user] = await trx('users')
      .insert({ shop_id: shop.id, name, email, password: hashed, phone: phone || null, role: 'owner' })
      .returning('*');
    const tokens = await issueTokens(user, shop.id, trx);
    return { user: formatUser(user, shop.name), ...tokens };
  });

  res.status(201).json({ success: true, data: result });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const user = await db('users').where({ email }).whereNull('deleted_at').first();
  if (!user || !(await comparePassword(password, user.password))) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  const shop   = await db('shops').where({ id: user.shop_id }).first();
  const tokens = await issueTokens(user, user.shop_id);

  res.status(200).json({ success: true, data: { user: formatUser(user, shop?.name), ...tokens } });
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    try {
      const payload = verifyRefresh(refreshToken);
      await db('refresh_tokens').where({ jti: payload.jti }).delete();
    } catch { /* already invalid */ }
  }
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ success: false, error: 'Refresh token is required' });
  }

  let payload;
  try { payload = verifyRefresh(refreshToken); }
  catch { return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' }); }

  const stored = await db('refresh_tokens').where({ jti: payload.jti, user_id: payload.userId }).first();
  if (!stored) {
    return res.status(401).json({ success: false, error: 'Refresh token has been revoked' });
  }

  const user = await db('users').where({ id: payload.userId }).whereNull('deleted_at').first();
  if (!user) {
    return res.status(401).json({ success: false, error: 'User not found' });
  }

  await db('refresh_tokens').where({ jti: payload.jti }).delete();
  const tokens = await issueTokens(user, user.shop_id);

  res.status(200).json({ success: true, data: tokens });
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
const me = asyncHandler(async (req, res) => {
  const user = await db('users').where({ id: req.user.id }).whereNull('deleted_at').first();
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  const shop = await db('shops').where({ id: user.shop_id }).first();
  res.status(200).json({ success: true, data: formatUser(user, shop?.name) });
});

module.exports = { register, login, logout, refresh, me };
