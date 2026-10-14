const bcrypt = require('bcryptjs');
const db = require('../config/db');
const {
  issueTokens,
  rotateRefreshToken,
  revokeRefreshToken
} = require('../utils/tokenManager');

/**
 * Register User
 */
exports.register = async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db('users')
      .insert({
        email,
        password_hash: passwordHash,
        name: name || null
      })
      .returning(['id', 'email', 'name']);

    const { accessToken, refreshToken } = await issueTokens(newUser);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      user: newUser,
      accessToken
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * Login User
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await db('users').where({ email }).first();
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = await issueTokens(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Refresh Access Token Endpoint (Rotates refresh token & checks DB)
 */
exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const { accessToken, refreshToken: newRefreshToken } = await rotateRefreshToken(refreshToken);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ accessToken });
  } catch (error) {
    res.status(403).json({ error: error.message || 'Invalid or expired refresh token' });
  }
};

/**
 * Logout User (Revokes refresh token in DB & clears cookie)
 */
exports.logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.json({ message: 'Logged out successfully' });
};