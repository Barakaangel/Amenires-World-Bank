/**
 * Account Routes
 * Account management, creation, and operations
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/security');

const Account = require('../models/Account');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();

/**
 * @route   GET /api/accounts
 * @desc    Get all user accounts
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.id, status: { $ne: 'closed' } })
      .sort({ createdAt: -1 });

    const totalBalance = accounts.reduce((sum, account) => 
      sum + parseFloat(account.balance.toString()), 0
    );

    res.status(200).json({
      status: 'success',
      data: {
        accounts,
        summary: {
          totalAccounts: accounts.length,
          totalBalance: totalBalance.toFixed(2),
          totalAvailableBalance: accounts.reduce((sum, account) => 
            sum + parseFloat(account.availableBalance.toString()), 0
          ).toFixed(2)
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
 * @route   GET /api/accounts/:accountNumber
 * @desc    Get account details
 * @access  Private
 */
router.get('/:accountNumber', authenticate, async (req, res) => {
  try {
    const account = await Account.findOne({ 
      accountNumber: req.params.accountNumber,
      userId: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found'
      });
    }

    // Get recent transactions
    const recentTransactions = await Transaction.find({ accountNumber: account.accountNumber })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      status: 'success',
      data: {
        account,
        recentTransactions
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching account details'
    });
  }
});

/**
 * @route   POST /api/accounts
 * @desc    Create a new account
 * @access  Private
 */
router.post('/', authenticate, [
  body('accountType').isIn(['savings', 'current', 'fixed_deposit', 'business', 'royal', 'investment', 'trust']).withMessage('Invalid account type'),
  body('accountName').notEmpty().withMessage('Account name is required'),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CHF', 'AUD', 'CAD', 'SGD', 'HKD', 'BTC', 'ETH', 'GOLD']),
  body('initialDeposit').optional().isFloat({ min: 0 })
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

    const { accountType, accountName, currency, initialDeposit } = req.body;

    // Determine interest rate based on account type
    const interestRates = {
      savings: 0.02,
      current: 0.01,
      fixed_deposit: 0.04,
      business: 0.015,
      royal: 0.03,
      investment: 0.05,
      trust: 0.035
    };

    // Create account
    const account = await Account.create({
      accountType,
      accountName,
      accountNickname: req.body.accountNickname || accountName,
      currency: currency || 'USD',
      userId: req.user.id,
      balance: initialDeposit || 0,
      availableBalance: initialDeposit || 0,
      interestRate: interestRates[accountType]
    });

    // Add initial deposit transaction if provided
    if (initialDeposit > 0) {
      await Transaction.create({
        accountNumber: account.accountNumber,
        type: 'credit',
        category: 'internal',
        amount: initialDeposit,
        currency: account.currency,
        balanceBefore: 0,
        balanceAfter: initialDeposit,
        description: 'Initial deposit',
        status: 'completed',
        authorizedBy: req.user.id
      });
    }

    // Audit log
    await auditLog('ACCOUNT_CREATED', req.user.id, {
      accountNumber: account.accountNumber,
      accountType,
      currency
    });

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      data: { account }
    });
  } catch (error) {
    console.error('Account creation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating account'
    });
  }
});

/**
 * @route   PATCH /api/accounts/:accountNumber
 * @desc    Update account settings
 * @access  Private
 */
router.patch('/:accountNumber', authenticate, async (req, res) => {
  try {
    const account = await Account.findOne({ 
      accountNumber: req.params.accountNumber,
      userId: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found'
      });
    }

    const allowedFields = ['accountNickname', 'lowBalanceAlert', 'largeTransactionAlert'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(account, updates);
    await account.save();

    // Audit log
    await auditLog('ACCOUNT_UPDATED', req.user.id, {
      accountNumber: account.accountNumber,
      updates
    });

    res.status(200).json({
      status: 'success',
      message: 'Account updated successfully',
      data: { account }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating account'
    });
  }
});

/**
 * @route   POST /api/accounts/:accountNumber/close
 * @desc    Close an account
 * @access  Private
 */
router.post('/:accountNumber/close', authenticate, [
  body('confirmation').custom(value => value === 'CLOSE_ACCOUNT').withMessage('You must type CLOSE_ACCOUNT to confirm')
], async (req, res) => {
  try {
    const account = await Account.findOne({ 
      accountNumber: req.params.accountNumber,
      userId: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found'
      });
    }

    // Check if account has balance
    if (parseFloat(account.balance.toString()) > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot close account with non-zero balance'
      });
    }

    // Close account
    account.status = 'closed';
    account.closedAt = new Date();
    await account.save();

    // Audit log
    await auditLog('ACCOUNT_CLOSED', req.user.id, {
      accountNumber: account.accountNumber
    });

    res.status(200).json({
      status: 'success',
      message: 'Account closed successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while closing account'
    });
  }
});

/**
 * @route   GET /api/accounts/:accountNumber/transactions
 * @desc    Get account transactions
 * @access  Private
 */
router.get('/:accountNumber/transactions', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const account = await Account.findOne({ 
      accountNumber: req.params.accountNumber,
      userId: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found'
      });
    }

    const transactions = await Transaction.find({ accountNumber: account.accountNumber })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ accountNumber: account.accountNumber });

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
 * @route   POST /api/accounts/:accountNumber/beneficiaries
 * @desc    Add beneficiary
 * @access  Private
 */
router.post('/:accountNumber/beneficiaries', authenticate, [
  body('name').notEmpty().withMessage('Beneficiary name is required'),
  body('accountNumber').notEmpty().withMessage('Beneficiary account number is required'),
  body('bank').notEmpty().withMessage('Bank name is required')
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

    const account = await Account.findOne({ 
      accountNumber: req.params.accountNumber,
      userId: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found'
      });
    }

    const { name, accountNumber: beneficiaryAccount, bank, nickname } = req.body;

    // Check if beneficiary already exists
    const existingBeneficiary = account.beneficiaries.find(
      b => b.accountNumber === beneficiaryAccount && b.bank === bank
    );

    if (existingBeneficiary) {
      return res.status(400).json({
        status: 'error',
        message: 'Beneficiary already exists'
      });
    }

    // Add beneficiary
    account.beneficiaries.push({
      name,
      accountNumber: beneficiaryAccount,
      bank,
      nickname: nickname || name,
      addedAt: new Date()
    });

    await account.save();

    // Audit log
    await auditLog('BENEFICIARY_ADDED', req.user.id, {
      accountNumber: account.accountNumber,
      beneficiaryName: name,
      beneficiaryAccount
    });

    res.status(201).json({
      status: 'success',
      message: 'Beneficiary added successfully',
      data: { beneficiaries: account.beneficiaries }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while adding beneficiary'
    });
  }
});

/**
 * @route   DELETE /api/accounts/:accountNumber/beneficiaries/:beneficiaryId
 * @desc    Remove beneficiary
 * @access  Private
 */
router.delete('/:accountNumber/beneficiaries/:beneficiaryId', authenticate, async (req, res) => {
  try {
    const account = await Account.findOne({ 
      accountNumber: req.params.accountNumber,
      userId: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found'
      });
    }

    account.beneficiaries = account.beneficiaries.filter(
      b => b._id.toString() !== req.params.beneficiaryId
    );

    await account.save();

    // Audit log
    await auditLog('BENEFICIARY_REMOVED', req.user.id, {
      accountNumber: account.accountNumber,
      beneficiaryId: req.params.beneficiaryId
    });

    res.status(200).json({
      status: 'success',
      message: 'Beneficiary removed successfully',
      data: { beneficiaries: account.beneficiaries }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while removing beneficiary'
    });
  }
});

/**
 * @route   GET /api/accounts/:accountNumber/statistics
 * @desc    Get account statistics
 * @access  Private
 */
router.get('/:accountNumber/statistics', authenticate, async (req, res) => {
  try {
    const account = await Account.findOne({ 
      accountNumber: req.params.accountNumber,
      userId: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found'
      });
    }

    // Get transaction summary
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6); // Last 6 months

    const summary = await Transaction.getSummary(account.accountNumber, startDate, new Date());
    const dailyTransactions = await Transaction.getDailyTransactions(account.accountNumber, 30);

    res.status(200).json({
      status: 'success',
      data: {
        account,
        statistics: {
          summary,
          dailyTransactions,
          accountAge: Math.floor((new Date() - account.accountOpenedAt) / (1000 * 60 * 60 * 24))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching statistics'
    });
  }
});

module.exports = router;
