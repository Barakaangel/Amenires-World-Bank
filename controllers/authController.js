/**
 * Authentication Controller
 * Handles user signup, login, and authentication operations
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { validatePasswordStrength, generateSecureToken } = require('../middleware/security');
const { auditLog } = require('../middleware/security');

/**
 * Generate JWT Tokens
 */
const generateTokens = (user) => {
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'amenires-jwt-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'amenires-refresh-secret-key',
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );

  return { token, refreshToken };
};

/**
 * User Signup
 */
exports.signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      country,
      continent,
      accountType,
      address,
      businessName,
      businessType,
      title,
      royalHouse,
      governmentPosition,
      countryOwned,
      useGeneratedPassword,
      currency
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email already exists'
      });
    }

    // Validate password strength
    const passwordStrength = validatePasswordStrength(password);
    if (!passwordStrength.valid && !useGeneratedPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Password does not meet security requirements',
        details: passwordStrength
      });
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Determine role based on account type
    let role = 'customer';
    if (accountType === 'royalty') role = 'royal';
    if (accountType === 'business') role = 'business';
    if (accountType === 'government' || accountType === 'country_owner') role = 'vip';

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phone,
      country,
      continent: continent || country, // Fallback if continent not provided
      accountType,
      address,
      businessName,
      businessType,
      title,
      royalHouse,
      governmentPosition,
      countryOwned,
      role,
      currency: currency || 'USD',
      isVerified: false,
      verificationToken,
      verificationExpires
    });

    const tokens = generateTokens(user);

    // Audit log
    await auditLog('USER_REGISTERED', user._id, {
      email: user.email,
      accountType: user.accountType,
      country: user.country
    });

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully. Please verify your email.',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          accountType: user.accountType,
          role: user.role,
          isVerified: user.isVerified
        },
        ...tokens
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during registration'
    });
  }
};

/**
 * User Login
 */
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, twoFactorCode } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    if (user.isLocked && user.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        status: 'error',
        message: `Account is temporarily locked. Try again in ${remainingTime} minutes.`
      });
    }

    const isPasswordValid = await user.correctPassword(password);

    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(403).json({
          status: 'error',
          message: 'Two-factor authentication code required',
          requireTwoFactor: true
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      });

      if (!verified) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid two-factor authentication code'
        });
      }
    }

    await user.resetLoginAttempts();

    user.lastLoginAt = Date.now();
    user.lastLoginIP = req.ip;
    await user.save();

    const tokens = generateTokens(user);

    await auditLog('USER_LOGIN', user._id, {
      email: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          accountType: user.accountType,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled
        },
        ...tokens
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during login'
    });
  }
};

/**
 * Logout
 */
exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during logout'
    });
  }
};

/**
 * Refresh Token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Refresh token is required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'amenires-refresh-secret-key');
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'amenires-jwt-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.status(200).json({
      status: 'success',
      data: { token }
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid refresh token'
    });
  }
};

/**
 * Get Current User
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          country: user.country,
          accountType: user.accountType,
          role: user.role,
          isActive: user.isActive,
          isVerified: user.isVerified,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching user data'
    });
  }
};

module.exports = exports;
