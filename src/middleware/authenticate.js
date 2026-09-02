const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { SECURITY } = require('../config/constants');

/**
 * Authentication middleware.
 * SECURITY PATCH (2024-01-15): Added issuer (iss) claim validation to prevent
 * token confusion attacks from other services using the same JWT library.
 *
 * @see CVE-2024-SHOPNOW-001
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please provide a Bearer token.' });
    }

    const token = authHeader.split(' ')[1];

    // SECURITY FIX: verify with issuer claim to prevent token confusion attacks
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: SECURITY.JWT_ISSUER,
      algorithms: ['HS256'],  // Explicitly specify algorithm to prevent alg:none attacks
    });

    // Validate token type claim
    if (decoded.type !== 'access') {
      return res.status(401).json({ success: false, message: 'Invalid token type.' });
    }

    const user = await User.findById(decoded.id).select('_id name email role isActive');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Account not found or deactivated.' });
    }

    req.user = { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Authorization middleware factory.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Access denied. Required: ${roles.join(' or ')}. Yours: ${req.user.role}.` });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
