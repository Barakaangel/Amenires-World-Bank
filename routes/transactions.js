/**
 * Transaction Routes
 * Money transfers, deposits, withdrawals
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { generateTransactionId, generateReferenceNumber } = require('../middleware/security');
const { auditLog } = require('../middleware/security');

const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

const router = express.Router();

/**
 * @route   POST /api/transactions/transfer
 * @desc    Transfer money between accounts
 * @access  Private
 */
router.post('/transfer', authenticate, [
  body('fromAccount').notEmpty().withMessage('From account is required'),
  body('toAccount').notEmpty().withMessage('To account is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().trim()
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

    const { fromAccount, toAccount, amount, description, notes } = req.body;

    // Find from account
    const fromAcc = await Account.findOne({ 
      accountNumber: fromAccount,
      userId: req.user.id,
      status: 'active'
    });

    if (!fromAcc) {
      return res.status(404).json({
        status: 'error',
        message: 'Source account not found or inactive'
      });
    }

    // Find to account
    const toAcc = await Account.findOne({ 
      accountNumber: toAccount,
      status: 'active'
    });

    if (!toAcc) {
      return res.status(404).json({
        status: 'error',
        message: 'Recipient account not found or inactive'
      });
    }

    // Check if transferring to same account
    if (fromAcc.accountNumber === toAcc.accountNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot transfer to the same account'
      });
    }

    // Check currency
    if (fromAcc.currency !== toAcc.currency) {
      return res.status(400).json({
        status: 'error',
        message: 'Currency mismatch. Both accounts must have the same currency'
      });
    }

    // Check if transfer is allowed
    const canTransfer = fromAcc.canTransfer(amount);
    if (!canTransfer.allowed) {
      return res.status(400).json({
        status: 'error',
        message: canTransfer.reason
      });
    }

    // Reset counters
    fromAcc.resetCounters();

    // Perform transfer
    const amountDecimal = parseFloat(amount);
    const reference = `TRF-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Debit from account
    const debitTransaction = await Transaction.create({
      accountNumber: fromAcc.accountNumber,
      type: 'debit',
      category: 'internal',
      fromAccount: fromAcc.accountNumber,
      toAccount: toAcc.accountNumber,
      amount: amountDecimal,
      currency: fromAcc.currency,
      balanceBefore: fromAcc.getBalance(),
      balanceAfter: fromAcc.getBalance() - amountDecimal,
      description: description || 'Transfer',
      notes,
      counterpartyName: toAcc.accountName,
      counterpartyAccount: toAcc.accountNumber,
      counterpartyBank: 'Amenires World Bank',
      status: 'completed',
      processedAt: new Date(),
      settledAt: new Date(),
      authorizedBy: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Update from account balance
    fromAcc.balance = fromAcc.getBalance() - amountDecimal;
    fromAcc.availableBalance = fromAcc.getAvailableBalance() - amountDecimal;
    fromAcc.dailyTransfers = fromAcc.dailyTransfers + amountDecimal;
    fromAcc.monthlyTransfers = fromAcc.monthlyTransfers + amountDecimal;
    fromAcc.lastTransactionAt = new Date();
    await fromAcc.save();

    // Credit to account
    const creditTransaction = await Transaction.create({
      accountNumber: toAcc.accountNumber,
      type: 'credit',
      category: 'internal',
      fromAccount: fromAcc.accountNumber,
      toAccount: toAcc.accountNumber,
      amount: amountDecimal,
      currency: toAcc.currency,
      balanceBefore: toAcc.getBalance(),
      balanceAfter: toAcc.getBalance() + amountDecimal,
      description: description || 'Transfer received',
      counterpartyName: fromAcc.accountName,
      counterpartyAccount: fromAcc.accountNumber,
      counterpartyBank: 'Amenires World Bank',
      status: 'completed',
      processedAt: new Date(),
      settledAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Update to account balance
    toAcc.balance = toAcc.getBalance() + amountDecimal;
    toAcc.availableBalance = toAcc.getAvailableBalance() + amountDecimal;
    toAcc.lastTransactionAt = new Date();
    await toAcc.save();

    // Audit log
    await auditLog('TRANSFER_COMPLETED', req.user.id, {
      fromAccount: fromAcc.accountNumber,
      toAccount: toAcc.accountNumber,
      amount: amountDecimal,
      currency: fromAcc.currency
    });

    res.status(200).json({
      status: 'success',
      message: 'Transfer completed successfully',
      data: {
        transaction: debitTransaction,
        newBalance: fromAcc.balance,
        availableBalance: fromAcc.availableBalance
      }
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while processing transfer'
    });
  }
});

/**
 * @route   POST /api/transactions/deposit
 * @desc    Deposit money to account
 * @access  Private
 */
router.post('/deposit', authenticate, [
  body('accountNumber').notEmpty().withMessage('Account number is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().trim()
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

    const { accountNumber, amount, description, notes } = req.body;

    // Find account
    const account = await Account.findOne({ 
      accountNumber,
      userId: req.user.id,
      status: 'active'
    });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found or inactive'
      });
    }

    const amountDecimal = parseFloat(amount);

    // Create transaction
    const transaction = await Transaction.create({
      accountNumber: account.accountNumber,
      type: 'credit',
      category: 'branch',
      amount: amountDecimal,
      currency: account.currency,
      balanceBefore: account.getBalance(),
      balanceAfter: account.getBalance() + amountDecimal,
      description: description || 'Deposit',
      notes,
      status: 'completed',
      processedAt: new Date(),
      settledAt: new Date(),
      authorizedBy: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Update account balance
    account.balance = account.getBalance() + amountDecimal;
    account.availableBalance = account.getAvailableBalance() + amountDecimal;
    account.lastTransactionAt = new Date();
    await account.save();

    // Audit log
    await auditLog('DEPOSIT_COMPLETED', req.user.id, {
      accountNumber: account.accountNumber,
      amount: amountDecimal,
      currency: account.currency
    });

    res.status(200).json({
      status: 'success',
      message: 'Deposit completed successfully',
      data: {
        transaction,
        newBalance: account.balance,
        availableBalance: account.availableBalance
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while processing deposit'
    });
  }
});

/**
 * @route   POST /api/transactions/withdrawal
 * @desc    Withdraw money from account
 * @access  Private
 */
router.post('/withdrawal', authenticate, [
  body('accountNumber').notEmpty().withMessage('Account number is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().trim()
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

    const { accountNumber, amount, description, notes } = req.body;

    // Find account
    const account = await Account.findOne({ 
      accountNumber,
      userId: req.user.id,
      status: 'active'
    });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found or inactive'
      });
    }

    const amountDecimal = parseFloat(amount);

    // Check available balance
    if (account.getAvailableBalance() < amountDecimal) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient funds'
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      accountNumber: account.accountNumber,
      type: 'debit',
      category: 'branch',
      amount: amountDecimal,
      currency: account.currency,
      balanceBefore: account.getBalance(),
      balanceAfter: account.getBalance() - amountDecimal,
      description: description || 'Withdrawal',
      notes,
      status: 'completed',
      processedAt: new Date(),
      settledAt: new Date(),
      authorizedBy: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Update account balance
    account.balance = account.getBalance() - amountDecimal;
    account.availableBalance = account.getAvailableBalance() - amountDecimal;
    account.lastTransactionAt = new Date();
    await account.save();

    // Audit log
    await auditLog('WITHDRAWAL_COMPLETED', req.user.id, {
      accountNumber: account.accountNumber,
      amount: amountDecimal,
      currency: account.currency
    });

    res.status(200).json({
      status: 'success',
      message: 'Withdrawal completed successfully',
      data: {
        transaction,
        newBalance: account.balance,
        availableBalance: account.availableBalance
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while processing withdrawal'
    });
  }
});

/**
 * @route   GET /api/transactions/:transactionId
 * @desc    Get transaction details
 * @access  Private
 */
router.get('/:transactionId', authenticate, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ 
      transactionId: req.params.transactionId 
    });

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    // Verify user owns the account
    const account = await Account.findOne({
      accountNumber: transaction.accountNumber,
      userId: req.user.id
    });

    if (!account) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this transaction'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { transaction }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching transaction'
    });
  }
});

/**
 * @route   POST /api/transactions/schedule
 * @desc    Schedule a future transaction
 * @access  Private
 */
router.post('/schedule', authenticate, [
  body('accountNumber').notEmpty().withMessage('Account number is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('recipientAccount').notEmpty().withMessage('Recipient account is required'),
  body('scheduledDate').isISO8601().withMessage('Invalid date format'),
  body('frequency').optional().isIn(['once', 'daily', 'weekly', 'monthly', 'yearly'])
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

    const { accountNumber, amount, recipientAccount, scheduledDate, frequency, description } = req.body;

    // Find account
    const account = await Account.findOne({ 
      accountNumber,
      userId: req.user.id,
      status: 'active'
    });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found or inactive'
      });
    }

    // Validate scheduled date
    const scheduled = new Date(scheduledDate);
    if (scheduled <= new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Scheduled date must be in the future'
      });
    }

    // Create standing order
    account.standingOrders.push({
      name: description || 'Scheduled transfer',
      recipientAccount,
      amount: parseFloat(amount),
      frequency: frequency || 'once',
      nextExecutionDate: scheduled,
      endDate: frequency === 'once' ? scheduled : null,
      isActive: true
    });

    await account.save();

    // Audit log
    await auditLog('STANDING_ORDER_CREATED', req.user.id, {
      accountNumber: account.accountNumber,
      recipientAccount,
      amount,
      scheduledDate
    });

    res.status(201).json({
      status: 'success',
      message: 'Transaction scheduled successfully',
      data: { standingOrders: account.standingOrders }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while scheduling transaction'
    });
  }
});

/**
 * @route   DELETE /api/transactions/schedule/:orderId
 * @desc    Cancel scheduled transaction
 * @access  Private
 */
router.delete('/schedule/:orderId', authenticate, async (req, res) => {
  try {
    const account = await Account.findOne({ 
      accountNumber: req.body.accountNumber,
      userId: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found'
      });
    }

    const order = account.standingOrders.id(req.params.orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Scheduled transaction not found'
      });
    }

    order.isActive = false;
    await account.save();

    // Audit log
    await auditLog('STANDING_ORDER_CANCELLED', req.user.id, {
      orderId: req.params.orderId
    });

    res.status(200).json({
      status: 'success',
      message: 'Scheduled transaction cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while cancelling scheduled transaction'
    });
  }
});

module.exports = router;
