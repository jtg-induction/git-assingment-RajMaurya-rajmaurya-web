const rateLimit = require('express-rate-limit');
const { SECURITY } = require('../config/constants');

/**
 * Rate limiter for authentication endpoints.
 * Prevents brute-force attacks on login and registration.
 * Stricter than the general API rate limit.
 */
const authRateLimiter = rateLimit({
  windowMs: SECURITY.AUTH_RATE_LIMIT.WINDOW_MS,
  max: SECURITY.AUTH_RATE_LIMIT.MAX_ATTEMPTS,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please wait 15 minutes before trying again.',
    retryAfter: Math.ceil(SECURITY.AUTH_RATE_LIMIT.WINDOW_MS / 1000 / 60) + ' minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,  // Count all requests, not just failures
});

/**
 * General API rate limiter for non-critical endpoints.
 */
const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Rate limit exceeded. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authRateLimiter, generalRateLimiter };
