const mongoose = require('mongoose');

const directInvestmentBrokerageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Investment Account
  investmentAccount: {
    accountNumber: {
      type: String,
      unique: true
    },
    accountType: {
      type: String,
      enum: ['individual', 'joint', 'corporate', 'trust', 'ira'],
      default: 'individual'
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'closed'],
      default: 'pending'
    },
    approvedDate: Date,
    riskTolerance: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive', 'speculative'],
      default: 'moderate'
    },
    investmentGoals: [String],
    preferredSectors: [String],
    balance: {
      type: Number,
      default: 0
    },
    availableFunds: {
      type: Number,
      default: 0
    },
    buyingPower: {
      type: Number,
      default: 0
    }
  },
  
  // Holdings
  holdings: [{
    symbol: String,
    name: String,
    type: {
      type: String,
      enum: ['stock', 'bond', 'etf', 'mutual_fund', 'index_fund', 'crypto', 'commodity', 'forex', 'option', 'future']
    },
    quantity: Number,
    averageCost: Number,
    currentPrice: Number,
    marketValue: Number,
    unrealizedGainLoss: Number,
    unrealizedGainLossPercent: Number,
    sector: String,
    exchange: String,
    purchasedAt: Date,
    lastUpdated: Date
  }],
  
  // Orders
  orders: [{
    orderId: String,
    symbol: String,
    type: {
      type: String,
      enum: ['market', 'limit', 'stop', 'stop_limit', 'trailing_stop']
    },
    side: {
      type: String,
      enum: ['buy', 'sell']
    },
    quantity: Number,
    price: Number,
    stopPrice: Number,
    trailingPercent: Number,
    timeInForce: {
      type: String,
      enum: ['day', 'gtc', 'ioc', 'fok']
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'filled', 'cancelled', 'rejected', 'expired']
    },
    filledQuantity: Number,
    filledPrice: Number,
    commission: Number,
    totalAmount: Number,
    createdAt: Date,
    updatedAt: Date,
    filledAt: Date
  }],
  
  // Watchlist
  watchlist: [{
    symbol: String,
    name: String,
    type: String,
    currentPrice: Number,
    change: Number,
    changePercent: Number,
    addedAt: Date,
    notes: String
  }],
  
  // Dividends
  dividends: [{
    dividendId: String,
    symbol: String,
    amount: Number,
    perShare: Number,
    exDate: Date,
    payDate: Date,
    reinvested: Boolean,
    reinvestedShares: Number
  }],
  
  // Margin Trading
  margin: {
    enabled: Boolean,
    buyingPower: Number,
    maintenanceRequirement: Number,
    marginUsed: Number,
    marginAvailable: Number,
    interestRate: Number,
    marginCalls: [{
      callId: String,
      amount: Number,
      dueDate: Date,
      status: String,
      satisfiedAt: Date
    }]
  },
  
  // Performance Metrics
  performance: {
    totalDeposits: Number,
    totalWithdrawals: Number,
    totalReturn: Number,
    totalReturnPercent: Number,
    annualizedReturn: Number,
    sharpeRatio: Number,
    maxDrawdown: Number,
    volatility: Number,
    benchmarkReturn: Number,
    benchmarkReturnPercent: Number,
    lastUpdated: Date
  },
  
  // Tax Information
  tax: {
    year: Number,
    shortTermGains: Number,
    longTermGains: Number,
    dividends: Number,
    interest: Number,
    costBasis: Number,
    washSales: Number
  },
  
  // Analytics & Reports
  analytics: {
    topPerformers: [{
      symbol: String,
      returnPercent: Number
    }],
    worstPerformers: [{
      symbol: String,
      returnPercent: Number
    }],
    sectorAllocation: [{
      sector: String,
      value: Number,
      percentage: Number
    }],
    assetAllocation: [{
      assetClass: String,
      value: Number,
      percentage: Number
    }]
  },
  
  // Alerts
  alerts: [{
    alertId: String,
    type: {
      type: String,
      enum: ['price_above', 'price_below', 'percent_change', 'volume', 'news', 'dividend']
    },
    symbol: String,
    condition: String,
    value: Number,
    triggered: Boolean,
    triggeredAt: Date,
    createdAt: Date
  }],
  
  // Research & Tools
  research: {
    savedAnalyses: [{
      analysisId: String,
      symbol: String,
      title: String,
      notes: String,
      createdAt: Date
    }]
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
directInvestmentBrokerageSchema.index({ userId: 1 });
directInvestmentBrokerageSchema.index({ 'investmentAccount.accountNumber': 1 });
directInvestmentBrokerageSchema.index({ 'orders.orderId': 1 });
directInvestmentBrokerageSchema.index({ 'orders.symbol': 1 });
directInvestmentBrokerageSchema.index({ 'holdings.symbol': 1 });

// Update timestamp before saving
directInvestmentBrokerageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const DirectInvestmentBrokerage = mongoose.model('DirectInvestmentBrokerage', directInvestmentBrokerageSchema);

module.exports = DirectInvestmentBrokerage;
