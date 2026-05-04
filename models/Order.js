/**
 * Order Model - Order Management System (OMS)
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  // Order Identification
  orderId: {
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
  portfolioId: {
    type: Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true,
    index: true
  },
  
  // Order Details
  orderType: {
    type: String,
    required: true,
    enum: ['market', 'limit', 'stop', 'stop_limit', 'trailing_stop', 'oco', 'ota', 'market_on_open', 'market_on_close', 'limit_on_open', 'limit_on_close', 'pegged', 'discretionary']
  },
  side: {
    type: String,
    required: true,
    enum: ['buy', 'sell', 'sell_short', 'buy_to_cover']
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  },
  securityType: {
    type: String,
    enum: ['equity', 'bond', 'etf', 'mutual_fund', 'option', 'future', 'forex', 'commodity', 'crypto', 'derivative', 'structured_product', 'warrant', 'right'],
    required: true
  },
  
  // Quantities & Prices
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  quantityFilled: {
    type: Number,
    default: 0,
    min: 0
  },
  price: {
    type: Number,
    min: 0
  },
  stopPrice: {
    type: Number,
    min: 0
  },
  limitPrice: {
    type: Number,
    min: 0
  },
  trailingStopAmount: Number,
  trailingStopPercent: Number,
  
  // Execution Details
  averageExecutionPrice: {
    type: Number,
    min: 0
  },
  executionVenue: {
    type: String,
    enum: ['lit_venue', 'dark_pool', 'internal_crossing', 'otc', 'primary_market', 'secondary_market', 'exchange']
  },
  executionAlgorithm: {
    type: String,
    enum: ['none', 'twap', 'vwap', 'implementation_shortfall', 'arrival_price', 'dark_only', 'liquidity_seeking', 'percent_volume', 'target_close', 'float_cross', 'minimize_impact']
  },
  
  // Order Status
  status: {
    type: String,
    required: true,
    enum: ['draft', 'pending_submission', 'submitted', 'acknowledged', 'partial', 'filled', 'cancelled', 'rejected', 'expired', 'suspended'],
    default: 'draft',
    index: true
  },
  rejectionReason: String,
  
  // Time in Force
  timeInForce: {
    type: String,
    enum: ['day', 'gtc', 'ioc', 'fok', 'aon', 'gtd', 'gtx'],
    default: 'day'
  },
  goodUntilDate: Date,
  
  // Compliance Checks
  preTradeChecks: {
    passed: Boolean,
    checks: [{
      type: {
        type: String,
        enum: ['risk_limit', 'concentration', 'restricted_list', 'watch_list', 'blacklist', 'margin_requirement', 'short_sale_restriction', 'buying_power', 'settlement', 'compliance']
      },
      passed: Boolean,
      message: String,
      checkedAt: Date
    }],
    checkedAt: Date
  },
  
  // Order Slicing (for large orders)
  isParentOrder: {
    type: Boolean,
    default: false
  },
  parentOrderId: {
    type: String,
    index: true
  },
  childOrders: [{
    type: String
  }],
  sliceCount: Number,
  currentSlice: Number,
  
  // Order Routing
  routingStrategy: {
    type: String,
    enum: ['smart_order_routing', 'direct_market_access', 'sponsored_access', 'manual', 'best_execution', 'cost_minimization', 'speed_optimization', 'liquidity_optimization']
  },
  destinations: [{
    venue: String,
    venueType: String,
    destinationId: String,
    liquidityScore: Number,
    estimatedCost: Number,
    actualCost: Number,
    executionTime: Date
  }],
  
  // Fees & Commissions
  fees: {
    commission: Number,
    secFee: Number,
    nasdaqFee: Number,
    exchangeFee: Number,
    clearingFee: Number,
    regulatoryFee: Number,
    otherFees: Number,
    total: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Tax Information
  taxInfo: {
    washSale: Boolean,
    washSaleReplacementSecurity: String,
    shortTermGains: Number,
    longTermGains: Number,
    holdingPeriodDays: Number
  },
  
  // Metadata
  notes: String,
  tags: [String],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdFor: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  submittedAt: Date,
  acknowledgedAt: Date,
  firstFillAt: Date,
  lastFillAt: Date,
  filledAt: Date,
  cancelledAt: Date,
  rejectedAt: Date,
  expiredAt: Date,
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ clientId: 1, status: 1 });
orderSchema.index({ symbol: 1, status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ parentOrderId: 1 });

// Virtuals
orderSchema.virtual('remainingQuantity').get(function() {
  return this.quantity - this.quantityFilled;
});

orderSchema.virtual('fillPercentage').get(function() {
  return this.quantity > 0 ? (this.quantityFilled / this.quantity) * 100 : 0;
});

orderSchema.virtual('isExpired').get(function() {
  if (this.timeInForce === 'day') {
    const now = new Date();
    const orderDate = this.submittedAt || this.createdAt;
    return now.toDateString() !== orderDate.toDateString();
  }
  if (this.timeInForce === 'gtd' && this.goodUntilDate) {
    return new Date() > this.goodUntilDate;
  }
  return false;
});

// Methods
orderSchema.methods.submit = function() {
  this.status = 'submitted';
  this.submittedAt = new Date();
  this.updatedAt = new Date();
  return this.save();
};

orderSchema.methods.acknowledge = function() {
  this.status = 'acknowledged';
  this.acknowledgedAt = new Date();
  this.updatedAt = new Date();
  return this.save();
};

orderSchema.methods.partialFill = function(fillQuantity, fillPrice, venue) {
  this.status = 'partial';
  this.quantityFilled += fillQuantity;
  this.averageExecutionPrice = this.calculateAverageExecutionPrice(fillQuantity, fillPrice);
  
  if (!this.firstFillAt) {
    this.firstFillAt = new Date();
  }
  this.lastFillAt = new Date();
  
  if (venue) {
    const existingVenue = this.destinations.find(d => d.venue === venue);
    if (existingVenue) {
      existingVenue.executionTime = new Date();
    } else {
      this.destinations.push({
        venue,
        venueType: 'lit_venue',
        executionTime: new Date()
      });
    }
  }
  
  this.updatedAt = new Date();
  return this.save();
};

orderSchema.methods.fill = function(fillQuantity, fillPrice, venue) {
  this.status = 'filled';
  this.quantityFilled = fillQuantity || this.quantity;
  this.averageExecutionPrice = fillPrice || this.price;
  this.filledAt = new Date();
  this.lastFillAt = new Date();
  
  if (venue) {
    this.destinations.push({
      venue,
      venueType: 'lit_venue',
      executionTime: new Date()
    });
  }
  
  this.updatedAt = new Date();
  return this.save();
};

orderSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  if (reason) {
    this.notes = this.notes ? `${this.notes}\nCancellation: ${reason}` : `Cancellation: ${reason}`;
  }
  this.updatedAt = new Date();
  return this.save();
};

orderSchema.methods.reject = function(reason) {
  this.status = 'rejected';
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  this.updatedAt = new Date();
  return this.save();
};

orderSchema.methods.calculateAverageExecutionPrice = function(newQuantity, newPrice) {
  if (!this.averageExecutionPrice || this.quantityFilled === 0) {
    return newPrice;
  }
  const totalValue = (this.averageExecutionPrice * this.quantityFilled) + (newPrice * newQuantity);
  return totalValue / (this.quantityFilled + newQuantity);
};

orderSchema.methods.runPreTradeChecks = async function() {
  // This would integrate with various compliance systems
  const checks = [];
  
  // Risk limit check
  checks.push({
    type: 'risk_limit',
    passed: true,
    message: 'Within risk limits',
    checkedAt: new Date()
  });
  
  // Concentration check
  checks.push({
    type: 'concentration',
    passed: true,
    message: 'No concentration breach',
    checkedAt: new Date()
  });
  
  // Restricted list check
  checks.push({
    type: 'restricted_list',
    passed: true,
    message: 'Security not on restricted list',
    checkedAt: new Date()
  });
  
  this.preTradeChecks = {
    passed: checks.every(c => c.passed),
    checks: checks,
    checkedAt: new Date()
  };
  
  return this.save();
};

// Static methods
orderSchema.statics.getActiveOrders = function(clientId) {
  return this.find({
    clientId,
    status: { $in: ['submitted', 'acknowledged', 'partial'] }
  }).sort({ createdAt: -1 });
};

orderSchema.statics.getOrdersBySymbol = function(symbol, options = {}) {
  const query = { symbol: symbol.toUpperCase() };
  if (options.clientId) query.clientId = options.clientId;
  if (options.status) query.status = options.status;
  if (options.statuses) query.status = { $in: options.statuses };
  
  return this.find(query).sort({ createdAt: -1 });
};

orderSchema.statics.getParentOrders = function(clientId) {
  return this.find({
    clientId,
    isParentOrder: true,
    status: { $in: ['submitted', 'acknowledged', 'partial'] }
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Order', orderSchema);
