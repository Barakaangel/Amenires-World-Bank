/**
 * Loan Model - Company Growth & Lending
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const loanSchema = new Schema({
  // Loan Identification
  loanId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  applicationId: {
    type: String,
    required: true,
    index: true
  },
  borrowerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Loan Type
  loanType: {
    type: String,
    required: true,
    enum: [
      // Working Capital
      'revolving_credit_facility', 'overdraft', 'invoice_financing', 'invoice_discounting',
      // Growth & Expansion
      'term_loan', 'growth_capital', 'acquisition_finance', 'equipment_financing', 'commercial_real_estate', 'project_finance',
      // Green & Sustainable
      'green_loan', 'sustainability_linked_loan', 'transition_finance', 'blue_finance',
      // Islamic Finance
      'murabaha', 'ijara', 'mudaraba', 'musharaka', 'sukuk',
      // Venture & Equity-Linked
      'venture_debt', 'mezzanine_finance', 'convertible_loan', 'safe', 'kiss', 'bridge_financing',
      // Specialized
      'trade_finance', 'supply_chain_finance', 'export_credit', 'import_credit', 'working_capital_term'
    ]
  },
  
  // Loan Purpose
  loanPurpose: {
    type: String,
    required: true
  },
  useOfProceeds: [String],
  
  // Loan Amounts
  requestedAmount: {
    type: Number,
    required: true
  },
  approvedAmount: Number,
  disbursedAmount: {
    type: Number,
    default: 0
  },
  outstandingBalance: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Loan Terms
  interestRate: {
    type: Number,
    required: true
  },
  interestRateType: {
    type: String,
    enum: ['fixed', 'variable', 'floating', 'base_plus_spread', 'capped', 'collared'],
    default: 'fixed'
  },
  baseRate: String,
  spread: Number,
  floor: Number,
  cap: Number,
  
  // Repayment Terms
  term: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['days', 'months', 'years'],
      default: 'years'
    }
  },
  repaymentType: {
    type: String,
    enum: ['amortizing', 'interest_only', 'bullet', 'balloon', 'deferred'],
    default: 'amortizing'
  },
  repaymentFrequency: {
    type: String,
    enum: ['weekly', 'bi_weekly', 'monthly', 'quarterly', 'semi_annual', 'annual'],
    default: 'monthly'
  },
  
  // Key Dates
  applicationDate: {
    type: Date,
    required: true
  },
  approvalDate: Date,
  disbursementStartDate: Date,
  maturityDate: Date,
  firstPaymentDate: Date,
  lastPaymentDate: Date,
  
  // Collateral
  collateral: [{
    type: {
      type: String,
      enum: ['real_estate', 'equipment', 'inventory', 'accounts_receivable', 'cash', 'securities', 'personal_guarantee', 'other']
    },
    description: String,
    value: Number,
    location: String,
    ownershipDocument: String,
    insurancePolicy: String,
    ltvRatio: Number
  }],
  totalCollateralValue: Number,
  collateralCoverageRatio: Number,
  
  // Guarantees
  guarantees: [{
    guarantorId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    guarantorName: String,
    guaranteeType: {
      type: String,
      enum: ['personal', 'corporate', 'government', 'third_party']
    },
    guaranteeAmount: Number,
    guaranteePercentage: Number
  }],
  totalGuaranteeAmount: Number,
  
  // Covenants
  covenants: [{
    type: {
      type: String,
      enum: ['financial', 'non_financial', 'performance', 'reporting']
    },
    description: String,
    metric: String,
    threshold: String,
    frequency: String,
    monitoringMethod: String,
    status: {
      type: String,
      enum: ['compliant', 'breached', 'waived'],
      default: 'compliant'
    },
    lastChecked: Date,
    lastCompliantDate: Date
  }],
  
  // Fees
  fees: {
    originationFee: Number,
    commitmentFee: Number,
    unusedLineFee: Number,
    processingFee: Number,
    latePaymentFee: Number,
    prepaymentFee: Number,
    otherFees: [{
      name: String,
      amount: Number,
      description: String
    }],
    totalFees: Number
  },
  
  // Insurance Requirements
  insuranceRequirements: [{
    type: String,
    coverageAmount: Number,
    provider: String,
    policyNumber: String,
    expiryDate: Date,
    status: {
      type: String,
      enum: ['required', 'provided', 'expired'],
      default: 'required'
    }
  }],
  
  // Interest Calculation
  interestCalculation: {
    method: {
      type: String,
      enum: ['simple', 'compound', 'add_on', 'discount'],
      default: 'simple'
    },
    dayCountConvention: {
      type: String,
      enum: ['actual_360', 'actual_365', '30_360', 'actual_actual'],
      default: 'actual_360'
    },
    paymentInArrears: {
      type: Boolean,
      default: true
    }
  },
  
  // ESG & Sustainability
  esg: {
    isGreenLoan: Boolean,
    sustainabilityLinked: Boolean,
    esgKPIs: [{
      kpi: String,
      target: String,
      current: String,
      measurementMethod: String,
      impactOnMargin: String
    }],
    sustainabilityRating: String,
    useOfProceedsGreen: Boolean,
    reportingFrequency: String
  },
  
  // Syndication
  syndication: {
    isSyndicated: Boolean,
    arranger: String,
    leadBank: String,
    participantBanks: [{
      bankName: String,
      participationPercentage: Number,
      participationAmount: Number,
      role: String
    }],
    facilityType: String
  },
  
  // Status
  status: {
    type: String,
    required: true,
    enum: ['application', 'under_review', 'approved', 'disbursed', 'repaid', 'defaulted', 'restructured', 'forgiven', 'cancelled'],
    default: 'application',
    index: true
  },
  subStatus: String,
  
  // Risk Assessment
  riskAssessment: {
    creditScore: Number,
    riskRating: {
      type: String,
      enum: ['low', 'moderate', 'high', 'very_high', 'extreme']
    },
    probabilityOfDefault: Number,
    lossGivenDefault: Number,
    expectedLoss: Number,
    riskAdjustedReturn: Number,
    stressTestResults: {
      baseline: Number,
      adverse: Number,
      severelyAdverse: Number
    }
  },
  
  // Disbursement Schedule
  disbursementSchedule: [{
    trancheNumber: Number,
    disbursementDate: Date,
    disbursementAmount: Number,
    conditionPrecedent: String,
    status: {
      type: String,
      enum: ['pending', 'released', 'cancelled'],
      default: 'pending'
    },
    actualDisbursementDate: Date
  }],
  
  // Repayment Schedule
  repaymentSchedule: [{
    installmentNumber: Number,
    dueDate: Date,
    principalAmount: Number,
    interestAmount: Number,
    totalAmount: Number,
    remainingBalance: Number,
    paidDate: Date,
    status: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'waived', 'defaulted'],
      default: 'pending'
    }
  }],
  
  // Payment History
  paymentHistory: [{
    paymentId: String,
    paymentDate: Date,
    amount: Number,
    principalPortion: Number,
    interestPortion: Number,
    feePortion: Number,
    paymentMethod: String,
    late: Boolean,
    lateDays: Number,
    lateFees: Number
  }],
  
  // Early Warning Indicators
  earlyWarningIndicators: [{
    indicator: String,
    threshold: String,
    currentValue: String,
    status: {
      type: String,
      enum: ['normal', 'warning', 'critical']
    },
    triggeredAt: Date,
    resolvedAt: Date,
    notes: String
  }],
  
  // Restructuring
  restructuring: {
    isRestructured: Boolean,
    originalTerms: Schema.Types.Mixed,
    restructureDate: Date,
    restructureType: String,
    restructureReason: String,
    approvalDetails: String
  },
  
  // Default Management
  defaultManagement: {
    inDefault: Boolean,
    defaultDate: Date,
    defaultReason: String,
    recoveryActions: [{
      action: String,
      actionDate: Date,
      responsible: String,
      outcome: String
    }],
    recoveryAmount: Number,
    writeOffAmount: Number,
    provisionedAmount: Number
  },
  
  // Documents
  documents: [{
    documentType: String,
    documentName: String,
    documentUrl: String,
    uploadDate: Date,
    required: Boolean,
    received: Boolean
  }],
  
  // Comments & Notes
  comments: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    comment: String,
    isInternal: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  branch: String,
  region: String,
  
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
  lastPaymentDate: Date,
  nextPaymentDate: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
loanSchema.index({ loanId: 1 });
loanSchema.index({ borrowerId: 1, status: 1 });
loanSchema.index({ applicationId: 1 });
loanSchema.index({ status: 1, nextPaymentDate: 1 });

// Virtuals
loanSchema.virtual('utilizationRate').get(function() {
  return this.approvedAmount > 0 ? (this.disbursedAmount / this.approvedAmount) * 100 : 0;
});

loanSchema.virtual('remainingTerm').get(function() {
  if (this.maturityDate) {
    const today = new Date();
    const diff = this.maturityDate.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }
  return null;
});

loanSchema.virtual('totalPaid').get(function() {
  return this.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
});

loanSchema.virtual('totalPrincipalPaid').get(function() {
  return this.paymentHistory.reduce((sum, payment) => sum + payment.principalPortion, 0);
});

loanSchema.virtual('totalInterestPaid').get(function() {
  return this.paymentHistory.reduce((sum, payment) => sum + payment.interestPortion, 0);
});

// Methods
loanSchema.methods.approve = function(approvedAmount, terms) {
  this.status = 'approved';
  this.approvedAmount = approvedAmount;
  this.approvalDate = new Date();
  Object.assign(this, terms);
  return this.save();
};

loanSchema.methods.disburse = function(amount) {
  this.status = 'disbursed';
  this.disbursedAmount += amount;
  this.outstandingBalance += amount;
  return this.save();
};

loanSchema.methods.makePayment = function(paymentAmount, paymentMethod) {
  const installment = this.repaymentSchedule.find(r => r.status === 'pending');
  if (installment) {
    installment.status = 'paid';
    installment.paidDate = new Date();
    installment.totalAmount = paymentAmount;
    this.lastPaymentDate = new Date();
    
    // Update outstanding balance
    this.outstandingBalance -= installment.principalAmount;
    
    // Add to payment history
    this.paymentHistory.push({
      paymentId: `PAY-${Date.now()}`,
      paymentDate: new Date(),
      amount: paymentAmount,
      principalAmount: installment.principalAmount,
      interestAmount: installment.interestAmount,
      paymentMethod,
      late: false
    });
    
    // Check if fully repaid
    if (this.outstandingBalance <= 0) {
      this.status = 'repaid';
    }
    
    return this.save();
  }
};

loanSchema.methods.checkCovenants = async function() {
  // This would integrate with financial systems to check covenant compliance
  for (const covenant of this.covenants) {
    // Simulated check
    const isCompliant = Math.random() > 0.1;
    covenant.lastChecked = new Date();
    if (!isCompliant) {
      covenant.status = 'breached';
      if (!covenant.lastCompliantDate) {
        covenant.lastCompliantDate = new Date();
      }
    } else {
      covenant.status = 'compliant';
      covenant.lastCompliantDate = new Date();
    }
  }
  return this.save();
};

// Static methods
loanSchema.statics.getActiveLoans = function(borrowerId) {
  return this.find({
    borrowerId,
    status: { $in: ['approved', 'disbursed'] }
  }).sort({ maturityDate: 1 });
};

loanSchema.statics.getDuePayments = function(dateRange) {
  return this.find({
    status: 'disbursed',
    'repaymentSchedule.dueDate': { $gte: dateRange.start, $lte: dateRange.end },
    'repaymentSchedule.status': 'pending'
  });
};

module.exports = mongoose.model('Loan', loanSchema);
