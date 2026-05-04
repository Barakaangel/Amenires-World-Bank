/**
 * User Routes
 * User profile management and settings
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, isAccountOwner } = require('../middleware/auth');
const { auditLog } = require('../middleware/security');

const User = require('../models/User');

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -twoFactorSecret -twoFactorBackupCodes');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching profile'
    });
  }
});

/**
 * @route   PATCH /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch('/profile', authenticate, [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phone').optional().matches(/^\+?[\d\s-]{10,20}$/),
  body('address').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const allowedFields = ['firstName', 'lastName', 'phone', 'address', 'language', 'currency'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -twoFactorSecret -twoFactorBackupCodes');

    // Audit log
    await auditLog('PROFILE_UPDATED', user._id, {
      fields: Object.keys(updates)
    });

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating profile'
    });
  }
});

/**
 * @route   PATCH /api/users/change-password
 * @desc    Change password
 * @access  Private
 */
router.patch('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 12 }).withMessage('New password must be at least 12 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isPasswordValid = await user.correctPassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    if (await user.correctPassword(newPassword)) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be different from current password'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Audit log
    await auditLog('PASSWORD_CHANGED', user._id, {
      email: user.email
    });

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while changing password'
    });
  }
});

/**
 * @route   PATCH /api/users/notifications
 * @desc    Update notification preferences
 * @access  Private
 */
router.patch('/notifications', authenticate, async (req, res) => {
  try {
    const { emailNotifications, smsNotifications } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        emailNotifications: emailNotifications !== undefined ? emailNotifications : req.user.emailNotifications,
        smsNotifications: smsNotifications !== undefined ? smsNotifications : req.user.smsNotifications
      },
      { new: true, runValidators: true }
    ).select('-password -twoFactorSecret -twoFactorBackupCodes');

    res.status(200).json({
      status: 'success',
      message: 'Notification preferences updated',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating notifications'
    });
  }
});

/**
 * @route   GET /api/users/sessions
 * @desc    Get active sessions
 * @access  Private
 */
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('sessions');

    // Filter out expired sessions (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeSessions = user.sessions.filter(session => session.lastActivity >= thirtyDaysAgo);

    res.status(200).json({
      status: 'success',
      data: { sessions: activeSessions }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching sessions'
    });
  }
});

/**
 * @route   DELETE /api/users/sessions/:token
 * @desc    Revoke a session
 * @access  Private
 */
router.delete('/sessions/:token', authenticate, async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findById(req.user.id);
    user.sessions = user.sessions.filter(session => session.token !== token);
    await user.save();

    // Audit log
    await auditLog('SESSION_REVOKED', user._id, {
      token: token.substring(0, 10) + '...'
    });

    res.status(200).json({
      status: 'success',
      message: 'Session revoked successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while revoking session'
    });
  }
});

/**
 * @route   GET /api/users/audit-log
 * @desc    Get user audit log
 * @access  Private
 */
router.get('/audit-log', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user.id).select('auditLog');
    
    const auditLog = user.auditLog
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(skip, skip + limit);

    res.status(200).json({
      status: 'success',
      data: {
        auditLog,
        pagination: {
          page,
          limit,
          total: user.auditLog.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching audit log'
    });
  }
});

/**
 * @route   POST /api/users/deactivate
 * @desc    Deactivate account
 * @access  Private
 */
router.post('/deactivate', authenticate, [
  body('password').notEmpty().withMessage('Password is required'),
  body('confirmation').custom(value => value === 'DEACTIVATE').withMessage('You must type DEACTIVATE to confirm')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { password } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Verify password
    const isPasswordValid = await user.correctPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid password'
      });
    }

    // Deactivate account
    user.isActive = false;
    await user.save();

    // Audit log
    await auditLog('ACCOUNT_DEACTIVATED', user._id, {
      email: user.email
    });

    res.status(200).json({
      status: 'success',
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deactivating account'
    });
  }
});

module.exports = router;
