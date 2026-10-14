const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');

/**
 * Hashes a token using SHA-256 before saving to DB
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate Access and Refresh tokens, storing hashed refresh token in DB
 */
exports.issueTokens = async (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db('refresh_tokens').insert({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt
  });

  return { accessToken, refreshToken };
};

/**
 * Validate refresh token against database and return new access token
 */
exports.rotateRefreshToken = async (oldRefreshToken) => {
  const decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
  const tokenHash = hashToken(oldRefreshToken);

  const storedToken = await db('refresh_tokens')
    .where({ user_id: decoded.userId, token_hash: tokenHash })
    .andWhere('expires_at', '>', new Date())
    .first();

  if (!storedToken) {
    throw new Error('Invalid or revoked refresh token');
  }

  const user = await db('users').where({ id: decoded.userId }).first();
  if (!user) {
    throw new Error('User no longer exists');
  }

  await db('refresh_tokens').where({ id: storedToken.id }).del();

  return await exports.issueTokens(user);
};

/**
 * Revoke refresh token on logout
 */
exports.revokeRefreshToken = async (refreshToken) => {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await db('refresh_tokens').where({ token_hash: tokenHash }).del();
};