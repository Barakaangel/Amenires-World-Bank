/**
 * Authentication Middleware
 * JWT-based authentication with role-based access control
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and authenticate user
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }
    
    // Check if user is locked
    if (user.isLocked && user.lockUntil > Date.now()) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account is temporarily locked. Please try again later.'
      });
    }
    
    // Grant access
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Please log in again.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Your token has expired. Please log in again.'
      });
    }
    next(error);
  }
};

/**
 * Check if user has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
};

/**
 * Check if user is account owner
 */
const isAccountOwner = (req, res, next) => {
  if (req.params.userId && req.params.userId !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'You can only access your own data.'
    });
  }
  next();
};

/**
 * Check 2FA verification
 */
const require2FA = async (req, res, next) => {
  const user = req.user;
  
  if (user.twoFactorEnabled && !req.session.twoFactorVerified) {
    return res.status(403).json({
      status: 'error',
      message: 'Two-factor authentication required.',
      requireTwoFactor: true
    });
  }
  
  next();
};

/**
 * Optional authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    next();
  }
};

/**
 * Check IP whitelist (for admin accounts)
 */
const checkIPWhitelist = (req, res, next) => {
  if (req.user.role === 'admin' && req.user.ipWhitelist && req.user.ipWhitelist.length > 0) {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!req.user.ipWhitelist.includes(clientIP)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied from this IP address.'
      });
    }
  }
  
  next();
};

/**
 * Session timeout check
 */
const checkSessionTimeout = (req, res, next) => {
  const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
  
  if (req.user.lastLoginAt && Date.now() - req.user.lastLoginAt > maxSessionAge) {
    return res.status(401).json({
      status: 'error',
      message: 'Session expired. Please log in again.'
    });
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
  isAccountOwner,
  require2FA,
  optionalAuth,
  checkIPWhitelist,
  checkSessionTimeout
};
