/**
 * Transaction Model for Amenires World Bank
 * Comprehensive transaction tracking and management
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const transactionSchema = new mongoose.Schema({
  // Transaction Identification
  transactionId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  referenceNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Transaction Type
  type: {
    type: String,
    enum: ['credit', 'debit', 'transfer', 'deposit', 'withdrawal', 'payment', 'interest', 'fee', 'exchange'],
    required: true
  },
  category: {
    type: String,
    enum: ['internal', 'external', 'atm', 'online', 'mobile', 'branch', 'wire', 'check', 'card', 'other'],
    default: 'other'
  },
  
  // Accounts Involved
  accountNumber: {
    type: String,
    required: true,
    index: true
  },
  fromAccount: {
    type: String
  },
  toAccount: {
    type: String
  },
  
  // Amount Details
  amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  originalAmount: mongoose.Schema.Types.Decimal128,
  originalCurrency: String,
  
  // Balance Information
  balanceBefore: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  balanceAfter: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  
  // Description and Reference
  description: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  
  // Counterparty Information
  counterpartyName: String,
  counterpartyBank: String,
  counterpartyAccount: String,
  counterpartyBankCode: String,
  
  // Transaction Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed'],
    default: 'pending',
    required: true
  },
  
  // Security and Fraud
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: String,
  fraudScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  requiresManualReview: {
    type: Boolean,
    default: false
  },
  
  // Fees and Charges
  fee: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0
  },
  feeType: {
    type: String,
    enum: ['none', 'transfer_fee', 'wire_fee', 'currency_conversion', 'atm_fee', 'overdraft_fee', 'other']
  },
  
  // Authorization
  authorizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  authorizedAt: Date,
  authorizationMethod: {
    type: String,
    enum: ['password', 'pin', 'biometric', '2fa', 'signature', 'other']
  },
  
  // Processing Details
  processedAt: Date,
  settledAt: Date,
  clearedAt: Date,
  
  // Retry Information
  retryCount: {
    type: Number,
    default: 0
  },
  lastRetryAt: Date,
  nextRetryAt: Date,
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  deviceFingerprint: String,
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number]
    }
  },
  
  // Audit Trail
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Additional Data
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ accountNumber: 1, createdAt: -1 });
transactionSchema.index({ transactionId: 1 }, { unique: true });
transactionSchema.index({ referenceNumber: 1 }, { unique: true });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ fromAccount: 1, toAccount: 1 });

// Pre-save middleware to generate IDs
transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex').toUpperCase();
    this.transactionId = `TXN-${timestamp}-${random}`;
  }
  
  if (!this.referenceNumber) {
    const year = new Date().getFullYear();
    const random = crypto.randomBytes(6).toString('hex').toUpperCase();
    this.referenceNumber = `REF-${year}-${random}`;
  }
  
  next();
});

// Method to get amount as number
transactionSchema.methods.getAmount = function() {
  return parseFloat(this.amount.toString());
};

// Method to get balance before as number
transactionSchema.methods.getBalanceBefore = function() {
  return parseFloat(this.balanceBefore.toString());
};

// Method to get balance after as number
transactionSchema.methods.getBalanceAfter = function() {
  return parseFloat(this.balanceAfter.toString());
};

// Static method to get transactions summary
transactionSchema.statics.getSummary = async function(accountNumber, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        accountNumber: accountNumber,
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        total: { $sum: { $toDouble: '$amount' } },
        avg: { $avg: { $toDouble: '$amount' } }
      }
    }
  ];
  
  return await this.aggregate(pipeline);
};

// Static method to get daily transactions
transactionSchema.statics.getDailyTransactions = async function(accountNumber, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const pipeline = [
    {
      $match: {
        accountNumber: accountNumber,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 },
        totalCredits: {
          $sum: {
            $cond: [
              { $eq: ['$type', 'credit'] },
              { $toDouble: '$amount' },
              0
            ]
          }
        },
        totalDebits: {
          $sum: {
            $cond: [
              { $eq: ['$type', 'debit'] },
              { $toDouble: '$amount' },
              0
            ]
          }
        }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ];
  
  return await this.aggregate(pipeline);
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
