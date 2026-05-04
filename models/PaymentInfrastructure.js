const mongoose = require('mongoose');

const paymentInfrastructureSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Payment Methods
  paymentMethods: [{
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['credit_card', 'debit_card', 'bank_transfer', 'mobile_money', 'digital_wallet', 'crypto', 'upi', 'paypal', 'stripe'],
      required: true
    },
    provider: String,
    isDefault: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    details: {
      // For cards
      last4: String,
      expiryMonth: Number,
      expiryYear: Number,
      brand: String,
      
      // For bank accounts
      bankName: String,
      accountNumber: String,
      routingNumber: String,
      accountType: String,
      
      // For mobile money
      phoneNumber: String,
      provider: String,
      
      // For digital wallets
      walletId: String,
      email: String,
      
      // For crypto
      address: String,
      network: String,
      
      // For UPI
      vpa: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastUsed: Date
  }],
  
  // Transaction Processing
  transactions: [{
    reference: {
      type: String,
      unique: true,
      required: true
    },
    type: {
      type: String,
      enum: ['incoming', 'outgoing', 'transfer', 'refund', 'reversal'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      required: true
    },
    fee: {
      type: Number,
      default: 0
    },
    totalAmount: Number,
    
    // Payment method details
    paymentMethodId: String,
    paymentMethodType: String,
    
    // Transaction parties
    sender: {
      userId: mongoose.Schema.Types.ObjectId,
      name: String,
      accountNumber: String,
      email: String,
      phone: String
    },
    receiver: {
      userId: mongoose.Schema.Types.ObjectId,
      name: String,
      accountNumber: String,
      email: String,
      phone: String
    },
    
    // Platform integration
    platform: {
      name: String,
      transactionId: String,
      status: String
    },
    
    // Transaction status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'reversed', 'cancelled'],
      default: 'pending'
    },
    
    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date,
    
    // Additional info
    description: String,
    category: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Recurring Payments
  recurringPayments: [{
    id: String,
    name: String,
    type: {
      type: String,
      enum: ['subscription', 'bill_payment', 'savings', 'investment']
    },
    amount: Number,
    currency: String,
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi_weekly', 'monthly', 'quarterly', 'yearly']
    },
    dayOfMonth: Number,
    paymentMethodId: String,
    recipient: {
      name: String,
      accountNumber: String,
      reference: String
    },
    startDate: Date,
    endDate: Date,
    nextPaymentDate: Date,
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled', 'completed'],
      default: 'active'
    },
    totalPaid: Number,
    paymentCount: Number,
    createdAt: Date
  }],
  
  // Payment Gateway Integration
  gateways: [{
    provider: String,
    apiKey: String,
    apiSecret: String,
    merchantId: String,
    webhookUrl: String,
    enabled: Boolean,
    supportedMethods: [String],
    fees: {
      percentage: Number,
      fixed: Number
    },
    createdAt: Date
  }],
  
  // Platform Integrations
  platformIntegrations: [{
    platform: {
      type: String,
      enum: ['stripe', 'paypal', 'square', 'razorpay', 'flutterwave', 'mpesa', 'gcash', 'paytm', 'upi', 'wise', 'revolut', 'transferwise']
    },
    accountId: String,
    accessToken: String,
    refreshToken: String,
    webhookSecret: String,
    enabled: Boolean,
    capabilities: [String],
    lastSync: Date
  }],
  
  // Multi-Currency Support
  wallets: [{
    currency: String,
    balance: Number,
    lockedBalance: Number,
    exchangeRate: Number,
    lastUpdated: Date
  }],
  
  // Settlement
  settlements: [{
    reference: String,
    amount: Number,
    currency: String,
    status: String,
    settlementDate: Date,
    transactionCount: Number,
    provider: String
  }],
  
  // Analytics
  analytics: {
    totalReceived: Number,
    totalSent: Number,
    totalFees: Number,
    transactionCount: Number,
    successRate: Number,
    averageAmount: Number,
    mostUsedMethod: String,
    topRecipients: [{
      name: String,
      accountNumber: String,
      totalAmount: Number,
      transactionCount: Number
    }]
  },
  
  // Compliance
  compliance: {
    amlChecks: [{
      transactionId: String,
      status: String,
      riskLevel: String,
      checkedAt: Date
    }],
    kycRequired: Boolean,
    verificationLevel: {
      type: String,
      enum: ['basic', 'intermediate', 'advanced'],
      default: 'basic'
    },
    limits: {
      daily: Number,
      weekly: Number,
      monthly: Number
    },
    currentUsage: {
      daily: Number,
      weekly: Number,
      monthly: Number
    }
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
paymentInfrastructureSchema.index({ userId: 1 });
paymentInfrastructureSchema.index({ 'transactions.reference': 1 });
paymentInfrastructureSchema.index({ 'transactions.status': 1, 'transactions.createdAt': -1 });
paymentInfrastructureSchema.index({ 'paymentMethods.id': 1 });
paymentInfrastructureSchema.index({ 'recurringPayments.nextPaymentDate': 1 });
paymentInfrastructureSchema.index({ 'platformIntegrations.platform': 1 });

// Update timestamp before saving
paymentInfrastructureSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const PaymentInfrastructure = mongoose.model('PaymentInfrastructure', paymentInfrastructureSchema);

module.exports = PaymentInfrastructure;
