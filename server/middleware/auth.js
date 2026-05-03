/**
 * Auth Middleware — Upgraded
 *
 * Fixes:
 * - Issue #4:  Refresh token validation support
 * - Problem #1: Proper role-based access control
 * - Problem #1: User cannot view others' tickets (enforced in routes)
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/* ------------------------------------------------------------------ */
/*  Sign tokens                                                         */
/* ------------------------------------------------------------------ */
// Short-lived access token (15 minutes)
exports.signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' });

/* ------------------------------------------------------------------ */
/*  protect — verifies access token on every protected route           */
/* ------------------------------------------------------------------ */
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').populate('department', 'name icon');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    // Pass to global error handler (which handles TokenExpiredError etc.)
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/*  restrictTo — role-based access control                             */
/* ------------------------------------------------------------------ */
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. '${req.user.role}' role is not permitted to perform this action.`,
    });
  }
  next();
};

/* ------------------------------------------------------------------ */
/*  ownsComplaint — prevents users from viewing others' complaints      */
/* ------------------------------------------------------------------ */
exports.ownsComplaint = (complaint, user) => {
  if (user.role === 'user') {
    const ownerId =
      complaint.submittedBy?._id?.toString() || complaint.submittedBy?.toString();
    return ownerId === user._id.toString();
  }
  return true; // Managers and admins can access any complaint
};
