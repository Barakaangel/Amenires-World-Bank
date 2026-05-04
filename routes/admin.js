/**
 * Admin Routes
 * System administration and management
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/security');

const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

const router = express.Router();

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/dashboard', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalAccounts,
      activeAccounts,
      totalTransactions,
      todayTransactions,
      totalVolume,
      accountsByType
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true, isVerified: true }),
      Account.countDocuments({ status: { $ne: 'closed' } }),
      Account.countDocuments({ status: 'active' }),
      Transaction.countDocuments(),
      Transaction.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }),
      Transaction.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: { $toDouble: '$amount' } }
          }
        }
      ]),
      Account.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$accountType',
            count: { $sum: 1 },
            totalBalance: { $sum: { $toDouble: '$balance' } }
          }
        }
      ])
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          pendingVerification: totalUsers - activeUsers
        },
        accounts: {
          total: totalAccounts,
          active: activeAccounts,
          byType: accountsByType
        },
        transactions: {
          total: totalTransactions,
          today: todayTransactions,
          totalVolume: totalVolume[0]?.total || 0
        },
        system: {
          aiSuperintelligences: process.env.AI_SUPERINTELLIGENCE_COUNT,
          dataCenters: 7,
          backupSites: 12,
          orbitalNodes: 3
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching dashboard data'
    });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (paginated)
 * @access  Private (Admin only)
 */
router.get('/users', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.isActive = req.query.status === 'active';
    if (req.query.accountType) filter.accountType = req.query.accountType;
    if (req.query.country) filter.country = req.query.country;
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password -twoFactorSecret -twoFactorBackupCodes')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching users'
    });
  }
});

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get user details
 * @access  Private (Admin only)
 */
router.get('/users/:userId', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -twoFactorSecret -twoFactorBackupCodes');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const accounts = await Account.find({ userId: user._id });
    const transactions = await Transaction.find({ accountNumber: { $in: accounts.map(a => a.accountNumber) } })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      status: 'success',
      data: {
        user,
        accounts,
        recentTransactions: transactions
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching user details'
    });
  }
});

/**
 * @route   PATCH /api/admin/users/:userId/status
 * @desc    Update user status
 * @access  Private (Admin only)
 */
router.patch('/users/:userId/status', authenticate, authorize('admin', 'super_admin'), [
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  body('reason').optional().trim()
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

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user.id && !req.body.isActive) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot deactivate your own account'
      });
    }

    user.isActive = req.body.isActive;
    await user.save();

    // Audit log
    await auditLog('USER_STATUS_UPDATED', req.user.id, {
      targetUserId: user._id,
      newStatus: user.isActive,
      reason: req.body.reason
    });

    res.status(200).json({
      status: 'success',
      message: 'User status updated successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating user status'
    });
  }
});

/**
 * @route   GET /api/admin/accounts
 * @desc    Get all accounts (paginated)
 * @access  Private (Admin only)
 */
router.get('/accounts', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.accountType) filter.accountType = req.query.accountType;
    if (req.query.currency) filter.currency = req.query.currency;

    const accounts = await Account.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Account.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        accounts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching accounts'
    });
  }
});

/**
 * @route   PATCH /api/admin/accounts/:accountNumber/freeze
 * @desc    Freeze/unfreeze account
 * @access  Private (Admin only)
 */
router.patch('/accounts/:accountNumber/freeze', authenticate, authorize('admin', 'super_admin'), [
  body('isFrozen').isBoolean().withMessage('isFrozen must be a boolean'),
  body('reason').optional().trim()
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

    const account = await Account.findOne({ accountNumber: req.params.accountNumber });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found'
      });
    }

    account.status = req.body.isFrozen ? 'frozen' : 'active';
    await account.save();

    // Audit log
    await auditLog('ACCOUNT_STATUS_UPDATED', req.user.id, {
      accountNumber: account.accountNumber,
      newStatus: account.status,
      reason: req.body.reason
    });

    res.status(200).json({
      status: 'success',
      message: `Account ${req.body.isFrozen ? 'frozen' : 'unfrozen'} successfully`,
      data: { account }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating account status'
    });
  }
});

/**
 * @route   GET /api/admin/transactions
 * @desc    Get all transactions (paginated)
 * @access  Private (Admin only)
 */
router.get('/transactions', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.isFlagged) filter.isFlagged = req.query.isFlagged === 'true';
    if (req.query.accountNumber) filter.accountNumber = req.query.accountNumber;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching transactions'
    });
  }
});

/**
 * @route   PATCH /api/admin/transactions/:transactionId/flag
 * @desc    Flag/unflag transaction
 * @access  Private (Admin only)
 */
router.patch('/transactions/:transactionId/flag', authenticate, authorize('admin', 'super_admin'), [
  body('isFlagged').isBoolean().withMessage('isFlagged must be a boolean'),
  body('reason').optional().trim()
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

    const transaction = await Transaction.findOne({ transactionId: req.params.transactionId });

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    transaction.isFlagged = req.body.isFlagged;
    transaction.flagReason = req.body.reason;
    transaction.requiresManualReview = req.body.isFlagged;
    await transaction.save();

    // Audit log
    await auditLog('TRANSACTION_FLAG_UPDATED', req.user.id, {
      transactionId: transaction.transactionId,
      isFlagged: transaction.isFlagged,
      reason: req.body.reason
    });

    res.status(200).json({
      status: 'success',
      message: `Transaction ${req.body.isFlagged ? 'flagged' : 'unflagged'} successfully`,
      data: { transaction }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating transaction flag'
    });
  }
});

/**
 * @route   GET /api/admin/system/health
 * @desc    Get system health metrics
 * @access  Private (Admin only)
 */
router.get('/system/health', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const healthMetrics = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
      },
      database: {
        status: 'connected',
        latency: Math.random() * 10 + 1 // Simulated
      },
      aiSystems: {
        status: 'active',
        superintelligences: process.env.AI_SUPERINTELLIGENCE_COUNT,
        lastUpdate: new Date().toISOString()
      },
      security: {
        level: 'MAXIMUM',
        encryption: 'AES-256-GCM',
        firewall: 'active',
        ddosProtection: 'active'
      },
      infrastructure: {
        dataCenters: 7,
        backupSites: 12,
        orbitalNodes: 3,
        regions: ['Americas', 'EMEA', 'APAC']
      }
    };

    res.status(200).json({
      status: 'success',
      data: healthMetrics
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching system health'
    });
  }
});

/**
 * @route   GET /api/admin/audit-log
 * @desc    Get system audit log
 * @access  Private (Admin only)
 */
router.get('/audit-log', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.action) filter['auditLog.action'] = req.query.action;
    if (req.query.startDate) filter['auditLog.timestamp'] = { $gte: new Date(req.query.startDate) };
    if (req.query.endDate) filter['auditLog.timestamp'] = { ...filter['auditLog.timestamp'], $lte: new Date(req.query.endDate) };

    const users = await User.find(filter)
      .select('auditLog firstName lastName email')
      .sort({ createdAt: -1 });

    const allAuditLogs = users.flatMap(user => 
      user.auditLog.map(log => ({
        ...log.toObject(),
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        }
      }))
    ).sort((a, b) => b.timestamp - a.timestamp)
      .slice(skip, skip + limit);

    const total = users.reduce((sum, user) => sum + user.auditLog.length, 0);

    res.status(200).json({
      status: 'success',
      data: {
        auditLog: allAuditLogs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
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

module.exports = router;
