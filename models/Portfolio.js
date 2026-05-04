/**
 * Portfolio Model - Investment Management
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const portfolioSchema = new Schema({
  // Portfolio Identification
  portfolioId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  portfolioName: {
    type: String,
    required: true,
    trim: true
  },
  portfolioType: {
    type: String,
    enum: ['retail', 'private_banking', 'institutional', 'corporate', 'sovereign', 'fund'],
    default: 'retail'
  },
  
  // Portfolio Values
  totalValue: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  unrealizedGainLoss: {
    type: Number,
    default: 0
  },
  unrealizedGainLossPercent: {
    type: Number,
    default: 0
  },
  realizedGainLoss: {
    type: Number,
    default: 0
  },
  
  // Asset Allocation
  assetAllocation: {
    equities: { type: Number, default: 0 },
    fixedIncome: { type: Number, default: 0 },
    cash: { type: Number, default: 0 },
    alternatives: { type: Number, default: 0 },
    derivatives: { type: Number, default: 0 },
    privateMarkets: { type: Number, default: 0 },
    crypto: { type: Number, default: 0 },
    realEstate: { type: Number, default: 0 }
  },
  
  // Geographic Allocation
  geographicAllocation: {
    northAmerica: { type: Number, default: 0 },
    europe: { type: Number, default: 0 },
    asia: { type: Number, default: 0 },
    emergingMarkets: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  
  // Sector Allocation
  sectorAllocation: {
    technology: { type: Number, default: 0 },
    healthcare: { type: Number, default: 0 },
    financials: { type: Number, default: 0 },
    consumer: { type: Number, default: 0 },
    industrials: { type: Number, default: 0 },
    energy: { type: Number, default: 0 },
    materials: { type: Number, default: 0 },
    utilities: { type: Number, default: 0 },
    reits: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  
  // Risk Metrics
  riskMetrics: {
    beta: Number,
    standardDeviation: Number,
    sharpeRatio: Number,
    sortinoRatio: Number,
    valueAtRisk: Number,
    conditionalVaR: Number,
    maxDrawdown: Number,
    trackingError: Number,
    informationRatio: Number,
    rSquared: Number,
    alpha: Number
  },
  
  // Positions
  positions: [{
    positionId: String,
    symbol: String,
    securityType: {
      type: String,
      enum: ['equity', 'bond', 'etf', 'mutual_fund', 'option', 'future', 'forex', 'commodity', 'crypto', 'derivative', 'structured_product']
    },
    quantity: Number,
    averageCost: Number,
    currentPrice: Number,
    currentValue: Number,
    gainLoss: Number,
    gainLossPercent: Number,
    currency: String,
    exchange: String,
    country: String,
    sector: String,
    purchaseDate: Date,
    lastUpdate: Date
  }],
  
  // Goals
  goals: [{
    goalId: String,
    goalName: String,
    targetAmount: Number,
    currentAmount: Number,
    targetDate: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    riskTolerance: {
      type: String,
      enum: ['conservative', 'moderate', 'balanced', 'growth', 'aggressive']
    },
    allocation: {
      type: Map,
      of: Number
    }
  }],
  
  // Performance
  performance: {
    daily: Number,
    dailyPercent: Number,
    mtd: Number,
    mtdPercent: Number,
    ytd: Number,
    ytdPercent: Number,
    oneYear: Number,
    oneYearPercent: Number,
    threeYear: Number,
    threeYearPercent: Number,
    fiveYear: Number,
    fiveYearPercent: Number,
    sinceInception: Number,
    sinceInceptionPercent: Number
  },
  
  // Benchmark
  benchmark: {
    benchmarkId: String,
    benchmarkName: String,
    benchmarkValue: Number,
    benchmarkChange: Number,
    benchmarkChangePercent: Number,
    trackingDifference: Number,
    alphaToBenchmark: Number
  },
  
  // Orders
  orders: [{
    orderId: String,
    orderType: {
      type: String,
      enum: ['market', 'limit', 'stop', 'stop_limit', 'trailing_stop', 'oco', 'ota']
    },
    side: {
      type: String,
      enum: ['buy', 'sell']
    },
    symbol: String,
    quantity: Number,
    price: Number,
    stopPrice: Number,
    status: {
      type: String,
      enum: ['pending', 'submitted', 'partial', 'filled', 'cancelled', 'rejected']
    },
    createdAt: Date,
    updatedAt: Date,
    filledAt: Date
  }],
  
  // Tax Information
  taxInfo: {
    costBasisMethod: {
      type: String,
      enum: ['FIFO', 'LIFO', 'HIFO', 'Average Cost', 'Specific ID']
    },
    washSales: Number,
    shortTermGains: Number,
    longTermGains: Number,
    qualifiedDividends: Number,
    ordinaryDividends: Number,
    taxLossHarvestingEnabled: Boolean,
    taxLossHarvestingOpportunities: Number
  },
  
  // ESG & Impact
  esg: {
    overallScore: Number,
    environmentalScore: Number,
    socialScore: Number,
    governanceScore: Number,
    carbonFootprint: Number,
    genderDiversity: Number,
    boardIndependence: Number,
    controversies: Number
  },
  
  // Compliance
  compliance: {
    restrictedLists: [String],
    watchLists: [String],
    blacklists: [String],
    concentrationLimits: [{
      sector: String,
      maxPercent: Number,
      currentPercent: Number
    }],
    complianceChecksPassed: Boolean,
    lastComplianceCheck: Date
  },
  
  // Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  advisors: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  managedBy: {
    type: String,
    enum: ['self', 'robo_advisor', 'human_advisor', 'hybrid']
  },
  rebalancingMode: {
    type: String,
    enum: ['manual', 'scheduled', 'threshold', 'opportunistic', 'automatic'],
    default: 'manual'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastValuationDate: Date,
  nextRebalancingDate: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
portfolioSchema.index({ clientId: 1, portfolioType: 1 });
portfolioSchema.index({ 'positions.symbol': 1 });
portfolioSchema.index({ 'goals.targetDate': 1 });

// Virtuals
portfolioSchema.virtual('gainLoss').get(function() {
  return this.totalValue - this.totalCost;
});

portfolioSchema.virtual('gainLossPercent').get(function() {
  return this.totalCost > 0 ? ((this.totalValue - this.totalCost) / this.totalCost) * 100 : 0;
});

// Methods
portfolioSchema.methods.updatePositions = function(newPositions) {
  this.positions = newPositions;
  this.calculateTotalValue();
  this.calculateAssetAllocation();
  this.updatedAt = new Date();
  return this.save();
};

portfolioSchema.methods.calculateTotalValue = function() {
  this.totalValue = this.positions.reduce((sum, pos) => sum + pos.currentValue, 0);
  this.unrealizedGainLoss = this.totalValue - this.totalCost;
  this.unrealizedGainLossPercent = this.totalCost > 0 
    ? ((this.totalValue - this.totalCost) / this.totalCost) * 100 
    : 0;
};

portfolioSchema.methods.calculateAssetAllocation = function() {
  const total = this.totalValue || 1;
  this.assetAllocation = {
    equities: this.positions.filter(p => p.securityType === 'equity' || p.securityType === 'etf').reduce((sum, p) => sum + p.currentValue, 0) / total * 100,
    fixedIncome: this.positions.filter(p => p.securityType === 'bond').reduce((sum, p) => sum + p.currentValue, 0) / total * 100,
    cash: this.positions.filter(p => p.securityType === 'forex').reduce((sum, p) => sum + p.currentValue, 0) / total * 100,
    alternatives: this.positions.filter(p => ['commodity', 'realEstate'].includes(p.securityType)).reduce((sum, p) => sum + p.currentValue, 0) / total * 100,
    derivatives: this.positions.filter(p => ['option', 'future', 'derivative'].includes(p.securityType)).reduce((sum, p) => sum + p.currentValue, 0) / total * 100,
    privateMarkets: this.positions.filter(p => p.securityType === 'privateMarkets').reduce((sum, p) => sum + p.currentValue, 0) / total * 100,
    crypto: this.positions.filter(p => p.securityType === 'crypto').reduce((sum, p) => sum + p.currentValue, 0) / total * 100,
    realEstate: this.positions.filter(p => p.securityType === 'realEstate').reduce((sum, p) => sum + p.currentValue, 0) / total * 100
  };
};

portfolioSchema.methods.rebalance = function(targetAllocation) {
  const totalValue = this.totalValue;
  const currentAllocation = this.assetAllocation;
  
  // Calculate required trades for rebalancing
  const trades = [];
  Object.keys(targetAllocation).forEach(assetClass => {
    const targetValue = totalValue * (targetAllocation[assetClass] / 100);
    const currentValue = totalValue * (currentAllocation[assetClass] || 0) / 100;
    const difference = targetValue - currentValue;
    
    if (Math.abs(difference) > totalValue * 0.01) { // Only trade if difference > 1%
      trades.push({
        assetClass,
        side: difference > 0 ? 'buy' : 'sell',
        amount: Math.abs(difference)
      });
    }
  });
  
  return trades;
};

// Static methods
portfolioSchema.statics.getClientPortfolios = function(clientId) {
  return this.find({ clientId }).sort({ createdAt: -1 });
};

portfolioSchema.statics.getPortfolioPerformance = function(portfolioId, period) {
  const now = new Date();
  const startDate = new Date();
  
  switch(period) {
    case 'daily': startDate.setDate(now.getDate() - 1); break;
    case 'mtd': startDate.setDate(1); break;
    case 'ytd': startDate.setMonth(0, 1); break;
    case 'oneYear': startDate.setFullYear(now.getFullYear() - 1); break;
    case 'threeYear': startDate.setFullYear(now.getFullYear() - 3); break;
    case 'fiveYear': startDate.setFullYear(now.getFullYear() - 5); break;
    default: startDate.setFullYear(now.getFullYear() - 10);
  }
  
  return this.findById(portfolioId).where('updatedAt').gte(startDate);
};

module.exports = mongoose.model('Portfolio', portfolioSchema);
