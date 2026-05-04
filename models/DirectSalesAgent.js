const mongoose = require('mongoose');

const directSalesAgentSchema = new mongoose.Schema({
  agentId: {
    type: String,
    unique: true,
    required: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Agent Profile
  profile: {
    name: String,
    phone: String,
    email: String,
    photo: String,
    bio: String,
    specializations: [String],
    languages: [String],
    territory: String,
    branchId: String
  },
  
  // Certification & Licensing
  certifications: [{
    name: String,
    number: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    status: {
      type: String,
      enum: ['active', 'expired', 'suspended']
    }
  }],
  
  // Performance
  performance: {
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
      default: 'bronze'
    },
    totalSales: Number,
    salesThisMonth: Number,
    salesThisQuarter: Number,
    salesThisYear: Number,
    targets: {
      monthly: Number,
      quarterly: Number,
      yearly: Number
    },
    achievements: [{
      name: String,
      date: Date,
      description: String
    }]
  },
  
  // Commission Structure
  commission: {
    structure: {
      type: String,
      enum: ['flat', 'tiered', 'percentage'],
      default: 'percentage'
    },
    rates: [{
      productType: String,
      rate: Number,
      minVolume: Number,
      maxVolume: Number
    }],
    totalCommission: Number,
    commissionThisMonth: Number,
    commissionThisQuarter: Number,
    commissionThisYear: Number,
    pendingCommission: Number
  },
  
  // Clients
  clients: [{
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    relationshipDate: Date,
    status: {
      type: String,
      enum: ['active', 'inactive', 'prospect']
    },
    lastContact: Date,
    notes: String,
    totalValue: Number
  }],
  
  // Products & Services
  products: [{
    productId: String,
    name: String,
    type: String,
    status: {
      type: String,
      enum: ['authorized', 'unauthorized']
    },
    salesCount: Number,
    totalSalesValue: Number
  }],
  
  // Leads
  leads: [{
    leadId: String,
    name: String,
    phone: String,
    email: String,
    source: String,
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
    },
    value: Number,
    probability: Number,
    notes: String,
    followUpDate: Date,
    createdAt: Date,
    updatedAt: Date
  }],
  
  // Activities
  activities: [{
    activityId: String,
    type: {
      type: String,
      enum: ['call', 'meeting', 'email', 'visit', 'presentation', 'follow_up']
    },
    clientId: mongoose.Schema.Types.ObjectId,
    description: String,
    outcome: String,
    duration: Number,
    scheduledDate: Date,
    completedDate: Date,
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'missed']
    }
  }],
  
  // Training & Development
  training: [{
    trainingId: String,
    title: String,
    provider: String,
    startDate: Date,
    endDate: Date,
    status: String,
    score: Number,
    certificateUrl: String
  }],
  
  // Goals & Objectives
  goals: [{
    goalId: String,
    title: String,
    description: String,
    type: {
      type: String,
      enum: ['sales', 'clients', 'revenue', 'commission', 'product']
    },
    target: Number,
    current: Number,
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'achieved', 'missed']
    }
  }],
  
  // Analytics
  analytics: {
    conversionRate: Number,
    averageDealSize: Number,
    clientRetentionRate: Number,
    topSellingProducts: [{
      product: String,
      salesCount: Number,
      revenue: Number
    }],
    salesTrend: [{
      period: String,
      sales: Number,
      revenue: Number
    }]
  },
  
  // Documents
  documents: [{
    documentId: String,
    name: String,
    type: String,
    url: String,
    uploadedAt: Date,
    expiryDate: Date
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'on_leave', 'suspended', 'terminated'],
    default: 'active'
  },
  
  hiringDate: Date,
  
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
directSalesAgentSchema.index({ agentId: 1 });
directSalesAgentSchema.index({ userId: 1 });
directSalesAgentSchema.index({ 'clients.clientId': 1 });
directSalesAgentSchema.index({ 'leads.status': 1 });
directSalesAgentSchema.index({ status: 1 });

// Update timestamp before saving
directSalesAgentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const DirectSalesAgent = mongoose.model('DirectSalesAgent', directSalesAgentSchema);

module.exports = DirectSalesAgent;
