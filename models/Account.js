/**
 * Account Model for Amenires World Bank
 * Supports multiple account types and currencies
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const accountSchema = new mongoose.Schema({
  // Account Identification
  accountNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  accountType: {
    type: String,
    enum: ['savings', 'current', 'fixed_deposit', 'business', 'royal', 'government', 'investment', 'trust'],
    required: true
  },
  
  // Account Owner
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Currency and Balance
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CHF', 'AUD', 'CAD', 'SGD', 'HKD', 'BTC', 'ETH', 'GOLD']
  },
  balance: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
    required: true
  },
  availableBalance: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
    required: true
  },
  frozenBalance: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0
  },
  
  // Account Settings
  accountName: {
    type: String,
    required: true,
    trim: true
  },
  accountNickname: {
    type: String,
    trim: true
  },
  
  // Interest Rate
  interestRate: {
    type: Number,
    default: 0.01,
    min: 0,
    max: 100
  },
  interestAccrued: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0
  },
  
  // Account Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'frozen', 'closed', 'suspended'],
    default: 'active',
    required: true
  },
  
  // Account Limits
  dailyTransferLimit: {
    type: mongoose.Schema.Types.Decimal128,
    default: 100000
  },
  monthlyTransferLimit: {
    type: mongoose.Schema.Types.Decimal128,
    default: 1000000
  },
  
  // Usage Tracking
  dailyTransfers: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0
  },
  monthlyTransfers: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  },
  
  // KYC Status
  kycStatus: {
    type: String,
    enum: ['not_started', 'pending', 'under_review', 'approved', 'rejected'],
    default: 'not_started'
  },
  kycSubmittedAt: Date,
  kycApprovedAt: Date,
  
  // Additional Features
  hasOverdraft: {
    type: Boolean,
    default: false
  },
  overdraftLimit: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0
  },
  hasCheckbook: {
    type: Boolean,
    default: false
  },
  hasDebitCard: {
    type: Boolean,
    default: false
  },
  
  // Security
  pin: {
    type: String,
    select: false
  },
  securityQuestions: [{
    question: String,
    answer: String
  }],
  
  // Notifications
  lowBalanceAlert: {
    type: Number,
    default: 100
  },
  largeTransactionAlert: {
    type: Number,
    default: 10000
  },
  
  // Beneficiaries
  beneficiaries: [{
    name: String,
    accountNumber: String,
    bank: String,
    nickname: String,
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Standing Orders
  standingOrders: [{
    name: String,
    recipientAccount: String,
    amount: mongoose.Schema.Types.Decimal128,
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    nextExecutionDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Audit Trail
  lastTransactionAt: Date,
  accountOpenedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: Date,
  
  // Metadata
  metadata: {
    source: String,
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes
accountSchema.index({ userId: 1, status: 1 });
accountSchema.index({ accountNumber: 1 }, { unique: true });
accountSchema.index({ status: 1 });
accountSchema.index({ accountType: 1 });
accountSchema.index({ currency: 1 });

// Pre-save middleware to generate account number
accountSchema.pre('save', function(next) {
  if (!this.accountNumber) {
    const prefix = 'AWB';
    const random = crypto.randomBytes(10).toString('hex').toUpperCase();
    const checksum = crypto.createHash('sha256').update(prefix + random).digest('hex').substring(0, 4).toUpperCase();
    this.accountNumber = `${prefix}-${random}-${checksum}`;
  }
  next();
});

// Method to get balance as a number
accountSchema.methods.getBalance = function() {
  return parseFloat(this.balance.toString());
};

// Method to get available balance as a number
accountSchema.methods.getAvailableBalance = function() {
  return parseFloat(this.availableBalance.toString());
};

// Method to debit account
accountSchema.methods.debit = async function(amount, description, reference) {
  const balance = this.getBalance();
  const availableBalance = this.getAvailableBalance();
  
  if (availableBalance < amount) {
    throw new Error('Insufficient funds');
  }
  
  const Transaction = require('./Transaction');
  
  // Create transaction record
  const transaction = await Transaction.create({
    accountNumber: this.accountNumber,
    type: 'debit',
    amount: amount,
    balanceAfter: balance - amount,
    description: description,
    reference: reference || `TXN-${Date.now()}`,
    status: 'completed'
  });
  
  // Update account balance
  this.balance = balance - amount;
  this.availableBalance = availableBalance - amount;
  this.lastTransactionAt = new Date();
  
  await this.save();
  
  return transaction;
};

// Method to credit account
accountSchema.methods.credit = async function(amount, description, reference) {
  const balance = this.getBalance();
  
  const Transaction = require('./Transaction');
  
  // Create transaction record
  const transaction = await Transaction.create({
    accountNumber: this.accountNumber,
    type: 'credit',
    amount: amount,
    balanceAfter: balance + amount,
    description: description,
    reference: reference || `TXN-${Date.now()}`,
    status: 'completed'
  });
  
  // Update account balance
  this.balance = balance + amount;
  this.availableBalance = this.getAvailableBalance() + amount;
  this.lastTransactionAt = new Date();
  
  await this.save();
  
  return transaction;
};

// Method to check if transfer is allowed
accountSchema.methods.canTransfer = function(amount) {
  const availableBalance = this.getAvailableBalance();
  const dailyLimit = parseFloat(this.dailyTransferLimit.toString());
  const monthlyLimit = parseFloat(this.monthlyTransferLimit.toString());
  const dailyTransfers = parseFloat(this.dailyTransfers.toString());
  const monthlyTransfers = parseFloat(this.monthlyTransfers.toString());
  
  // Check available balance
  if (availableBalance < amount) {
    return { allowed: false, reason: 'Insufficient funds' };
  }
  
  // Check daily limit
  if (dailyTransfers + amount > dailyLimit) {
    return { allowed: false, reason: 'Daily transfer limit exceeded' };
  }
  
  // Check monthly limit
  if (monthlyTransfers + amount > monthlyLimit) {
    return { allowed: false, reason: 'Monthly transfer limit exceeded' };
  }
  
  return { allowed: true };
};

// Method to reset daily/monthly counters
accountSchema.methods.resetCounters = function() {
  const now = new Date();
  const lastReset = this.lastResetDate;
  
  // Reset daily counter if it's a new day
  if (lastReset.getDate() !== now.getDate() || 
      lastReset.getMonth() !== now.getMonth() || 
      lastReset.getFullYear() !== now.getFullYear()) {
    this.dailyTransfers = 0;
  }
  
  // Reset monthly counter if it's a new month
  if (lastReset.getMonth() !== now.getMonth() || 
      lastReset.getFullYear() !== now.getFullYear()) {
    this.monthlyTransfers = 0;
  }
  
  this.lastResetDate = now;
};

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
