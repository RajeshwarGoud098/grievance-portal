/**
 * Auth Routes — Fully upgraded
 *
 * Fixes:
 * - Issue #1:  Input validation via express-validator
 * - Issue #2:  Rate limiting on login (brute-force protection)
 * - Issue #4:  Access token (15m) + refresh token (7d) flow
 * - Problem #1: Proper token expiry management
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { protect, signAccessToken } = require('../middleware/auth');
const { validate, registerRules, loginRules } = require('../middleware/validate');

/* ------------------------------------------------------------------ */
/*  Rate limiter — max 10 login attempts per 15 min (Issue #2)         */
/* ------------------------------------------------------------------ */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ------------------------------------------------------------------ */
/*  Helper — generate secure refresh token (Issue #4)                  */
/* ------------------------------------------------------------------ */
const generateRefreshToken = () => crypto.randomBytes(48).toString('hex');

const createRefreshToken = async (userId, ip = '') => {
  // Revoke all existing refresh tokens for this user (single-device policy)
  await RefreshToken.updateMany({ user: userId }, { isRevoked: true });

  const token = generateRefreshToken();
  await RefreshToken.create({
    token,
    user: userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    createdByIp: ip,
  });
  return token;
};

/* ------------------------------------------------------------------ */
/*  POST /api/auth/register                                             */
/* ------------------------------------------------------------------ */
router.post('/register', validate(registerRules), async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered.' });

    const user = await User.create({ name, email, password, phone, role: 'user' });
    const accessToken = signAccessToken(user._id);
    const refreshToken = await createRefreshToken(user._id, req.ip);

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    });
  } catch (err) { next(err); }
});

/* ------------------------------------------------------------------ */
/*  POST /api/auth/login  (rate limited)                               */
/* ------------------------------------------------------------------ */
router.post('/login', loginLimiter, validate(loginRules), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password').populate('department', 'name icon');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const accessToken = signAccessToken(user._id);
    const refreshToken = await createRefreshToken(user._id, req.ip);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
      },
    });
  } catch (err) { next(err); }
});

/* ------------------------------------------------------------------ */
/*  POST /api/auth/refresh — Issue #4: Refresh the access token        */
/* ------------------------------------------------------------------ */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required.' });
    }

    const stored = await RefreshToken.findOne({ token: refreshToken, isRevoked: false });
    if (!stored) {
      return res.status(401).json({ success: false, message: 'Invalid or revoked refresh token.' });
    }
    if (stored.expiresAt < new Date()) {
      await RefreshToken.findByIdAndUpdate(stored._id, { isRevoked: true });
      return res.status(401).json({ success: false, message: 'Refresh token expired. Please log in again.' });
    }

    const user = await User.findById(stored.user).populate('department', 'name icon');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    // Rotate — issue a new refresh token too (token rotation)
    const newAccessToken = signAccessToken(user._id);
    const newRefreshToken = await createRefreshToken(user._id, req.ip);

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department },
    });
  } catch (err) { next(err); }
});

/* ------------------------------------------------------------------ */
/*  POST /api/auth/logout — revoke refresh token                       */
/* ------------------------------------------------------------------ */
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.findOneAndUpdate({ token: refreshToken }, { isRevoked: true });
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) { next(err); }
});

/* ------------------------------------------------------------------ */
/*  GET /api/auth/me                                                    */
/* ------------------------------------------------------------------ */
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('department', 'name icon');
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

/* ------------------------------------------------------------------ */
/*  PUT /api/auth/update-profile                                        */
/* ------------------------------------------------------------------ */
router.put('/update-profile', protect, async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

module.exports = router;
