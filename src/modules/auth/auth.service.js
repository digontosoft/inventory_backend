const db = require('../../config/db');
const { hashPassword, comparePassword } = require('../../utils/hash');
const { signAccess, signRefresh, verifyRefresh } = require('../../utils/jwt');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const findUserByEmail = (email) =>
  db('users').where({ email }).whereNull('deleted_at').first();

const findUserById = (id) =>
  db('users').where({ id }).whereNull('deleted_at').first();

/** Parse simple duration strings like '7d', '15m' to milliseconds */
const parseDuration = (str) => {
  const unit = str.slice(-1);
  const val = parseInt(str, 10);
  const map = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return val * (map[unit] || 1000);
};

/**
 * Store refresh token — accepts an optional knex transaction (trx).
 * Pass trx when inside a db.transaction() so the insert is part of the same transaction.
 */
const storeRefreshToken = (userId, jti, expiresIn = '7d', trx = null) => {
  const ms = parseDuration(expiresIn);
  const conn = trx || db;
  return conn('refresh_tokens').insert({
    user_id: userId,
    jti,
    expires_at: new Date(Date.now() + ms),
  });
};

const buildTokens = async (user, shopId, trx = null) => {
  const accessToken = signAccess({ userId: user.id, shopId, role: user.role });
  const { token: refreshToken, jti } = signRefresh(user.id);
  await storeRefreshToken(user.id, jti, process.env.JWT_REFRESH_EXPIRES_IN || '7d', trx);
  return { accessToken, refreshToken };
};

const formatUser = (user, shopName = null) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  shopId: user.shop_id,
  ...(shopName && { shopName }),
});

// ─── Service Methods ──────────────────────────────────────────────────────────

const register = async ({ name, email, password, phone, shopName }) => {
  const existing = await findUserByEmail(email);
  if (existing) {
    const err = new Error('Email already in use'); err.statusCode = 409; throw err;
  }

  // Create shop and owner user in a transaction
  return db.transaction(async (trx) => {
    const [shop] = await trx('shops').insert({ name: shopName }).returning('*');

    const hashed = await hashPassword(password);
    const [user] = await trx('users')
      .insert({ shop_id: shop.id, name, email, password: hashed, phone, role: 'owner' })
      .returning('*');

    const tokens = await buildTokens(user, shop.id, trx);

    return { user: formatUser(user, shop.name), ...tokens };
  });
};

const login = async ({ email, password }) => {
  const user = await findUserByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password'); err.statusCode = 401; throw err;
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    const err = new Error('Invalid email or password'); err.statusCode = 401; throw err;
  }

  const shop = await db('shops').where({ id: user.shop_id }).first();
  const tokens = await buildTokens(user, user.shop_id);

  return { user: formatUser(user, shop?.name), ...tokens };
};

const logout = async (refreshToken) => {
  if (!refreshToken) return;
  try {
    const payload = verifyRefresh(refreshToken);
    await db('refresh_tokens').where({ jti: payload.jti }).delete();
  } catch {
    // Token already invalid — nothing to do
  }
};

const refresh = async (refreshToken) => {
  if (!refreshToken) {
    const err = new Error('Refresh token required'); err.statusCode = 401; throw err;
  }

  let payload;
  try {
    payload = verifyRefresh(refreshToken);
  } catch {
    const err = new Error('Invalid or expired refresh token'); err.statusCode = 401; throw err;
  }

  const stored = await db('refresh_tokens')
    .where({ jti: payload.jti, user_id: payload.userId })
    .first();

  if (!stored) {
    const err = new Error('Refresh token revoked'); err.statusCode = 401; throw err;
  }

  const user = await findUserById(payload.userId);
  if (!user) {
    const err = new Error('User not found'); err.statusCode = 401; throw err;
  }

  // Rotate: delete old token and issue new pair
  await db('refresh_tokens').where({ jti: payload.jti }).delete();
  const tokens = await buildTokens(user, user.shop_id);

  return tokens;
};

const me = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    const err = new Error('User not found'); err.statusCode = 404; throw err;
  }
  const shop = await db('shops').where({ id: user.shop_id }).first();
  return formatUser(user, shop?.name);
};

module.exports = { register, login, logout, refresh, me };
