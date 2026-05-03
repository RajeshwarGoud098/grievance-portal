/**
 * Validation Middleware — express-validator wrappers
 * Solves: Issue #1 (No input validation middleware)
 */
const { body, param, query, validationResult } = require('express-validator');

/* ------------------------------------------------------------------ */
/*  Core validate runner                                                */
/* ------------------------------------------------------------------ */
exports.validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((v) => v.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
  });
};

/* ------------------------------------------------------------------ */
/*  Auth validators                                                     */
/* ------------------------------------------------------------------ */
exports.registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim().isMobilePhone().withMessage('Invalid phone number'),
];

exports.loginRules = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

/* ------------------------------------------------------------------ */
/*  Complaint validators                                                */
/* ------------------------------------------------------------------ */
exports.complaintRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 5, max: 150 }).withMessage('Title must be 5–150 characters'),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('department').notEmpty().withMessage('Department is required').isMongoId().withMessage('Invalid department ID'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Priority must be Low, Medium, or High'),
  body('imageUrl').optional({ checkFalsy: true }).isURL().withMessage('Image must be a valid URL'),
];

exports.statusUpdateRules = [
  body('status').notEmpty().withMessage('Status is required').isIn(['Received', 'Under Review', 'Resolved', 'Rejected']).withMessage('Invalid status value'),
  body('note').optional().trim().isLength({ max: 1000 }).withMessage('Note cannot exceed 1000 characters'),
];

exports.reassignRules = [
  body('departmentId').notEmpty().withMessage('Department ID is required').isMongoId().withMessage('Invalid department ID'),
  body('reason').trim().notEmpty().withMessage('Reason for reassignment is required').isLength({ min: 10 }).withMessage('Reason must be at least 10 characters'),
];

/* ------------------------------------------------------------------ */
/*  User validators                                                     */
/* ------------------------------------------------------------------ */
exports.createManagerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('departmentId').notEmpty().withMessage('Department is required').isMongoId().withMessage('Invalid department ID'),
  body('phone').optional().trim(),
];
