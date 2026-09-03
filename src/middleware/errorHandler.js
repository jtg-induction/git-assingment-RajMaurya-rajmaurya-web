// Centralized error handling middleware for ShopNow API
// All errors thrown in route handlers bubble up here via next(err)

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const fields = Object.values(err.errors).map((e) => e.message);
    message = `Validation failed: ${fields.join(', ')}`;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `A record with this ${field} already exists.`;
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') { statusCode = 401; message = 'Invalid authentication token.'; }
  if (err.name === 'TokenExpiredError') { statusCode = 401; message = 'Authentication token has expired. Please log in again.'; }

  // Rate limit exceeded (from express-rate-limit)
  if (statusCode === 429) {
    message = err.message || 'Too many requests. Please slow down and try again later.';
  }

  // Cache errors (node-cache)
  if (err.message && err.message.includes('node-cache')) {
    statusCode = 503;
    message = 'Cache service temporarily unavailable. Request served from database.';
  }

  // MongoDB text search error (e.g., text index not yet built)
  if (err.codeName === 'IndexNotFound' || (err.message && err.message.includes('text index'))) {
    statusCode = 503;
    message = 'Search is temporarily unavailable. Please try again later.';
  }

  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${err.stack}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
