/**
 * Global Error Handler Middleware
 * Solves: Issue #9 (No centralized error handling)
 * Handles: Mongoose errors, JWT errors, custom errors uniformly
 */
const morgan = require('morgan');

/* ------------------------------------------------------------------ */
/*  HTTP Request Logger (Issue #15)                                     */
/* ------------------------------------------------------------------ */
exports.requestLogger = morgan(':method :url :status :res[content-length] - :response-time ms');

/* ------------------------------------------------------------------ */
/*  Global Error Handler                                                */
/* ------------------------------------------------------------------ */
exports.errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Mongoose — document validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join('. ');
  }

  // Mongoose — duplicate key (unique constraint)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // Mongoose — invalid ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT — invalid token
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  // JWT — expired token
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please refresh your session.';
  }

  console.error(`[${new Date().toISOString()}] ${statusCode} ${req.method} ${req.originalUrl} — ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/* ------------------------------------------------------------------ */
/*  404 Handler                                                         */
/* ------------------------------------------------------------------ */
exports.notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
};
