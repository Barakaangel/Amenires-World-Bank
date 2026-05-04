const mongoose = require('mongoose');

const globalFraudEmergencyNetworkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Fraud Detection
  fraudDetection: {
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    lastAssessment: Date,
    factors: [{
      type: String,
      weight: Number,
      value: Number
    }]
  },
  
  // Alerts & Incidents
  alerts: [{
    alertId: {
      type: String,
      unique: true
    },
    type: {
      type: String,
      enum: ['transaction_suspicious', 'login_unusual', 'account_takeover', 'phishing_attempt', 'identity_theft', 'money_laundering', 'device_compromised']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    description: String,
    details: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'false_positive', 'closed']
    },
    relatedTransactionId: mongoose.Schema.Types.ObjectId,
    relatedOrderId: String,
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    updatedAt: Date,
    resolvedAt: Date,
    resolvedBy: mongoose.Schema.Types.ObjectId,
    notes: String
  }],
  
  // Blocked Activities
  blockedActivities: [{
    activityId: String,
    type: {
      type: String,
      enum: ['transaction', 'login', 'withdrawal', 'transfer', 'account_access']
    },
    reason: String,
    ipAddress: String,
    deviceId: String,
    location: {
      latitude: Number,
      longitude: Number,
      city: String,
      country: String
    },
    timestamp: Date,
    duration: Number, // in hours
    expiresAt: Date,
    status: String
  }],
  
  // Emergency Actions
  emergencyActions: [{
    actionId: String,
    type: {
      type: String,
      enum: ['account_freeze', 'card_block', 'suspension', 'temporary_limit', 'force_logout', 'password_reset']
    },
    triggeredBy: {
      type: String,
      enum: ['system', 'admin', 'user']
    },
    reason: String,
    executedAt: Date,
    expiresAt: Date,
    status: {
      type: String,
      enum: ['active', 'expired', 'revoked']
    },
    revokedAt: Date,
    revokedBy: mongoose.Schema.Types.ObjectId
  }],
  
  // Network Sharing
  networkSharing: {
    enabled: {
      type: Boolean,
      default: false
    },
    sharedAlerts: [{
      alertId: String,
      sharedWith: [String],
      networkType: {
        type: String,
        enum: ['banking_network', 'global_fraud_network', 'law_enforcement']
      },
      sharedAt: Date,
      responseReceived: [String]
    }],
    receivedAlerts: [{
      alertId: String,
      source: String,
      sourceType: String,
      threatLevel: String,
      description: String,
      receivedAt: Date,
      actionTaken: String
    }]
  },
  
  // Verification Requirements
  verification: {
    required: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: ['identity', 'document', 'in_person', 'enhanced_kyc']
    },
    requestedAt: Date,
    completedAt: Date,
    documents: [{
      type: String,
      url: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected']
      },
      reviewedAt: Date,
      reviewedBy: mongoose.Schema.Types.ObjectId,
      notes: String
    }]
  },
  
  // Device Fingerprinting
  devices: [{
    deviceId: String,
    userAgent: String,
    browser: String,
    os: String,
    screenResolution: String,
    timezone: String,
    language: String,
    firstSeen: Date,
    lastSeen: Date,
    isTrusted: {
      type: Boolean,
      default: false
    },
    riskScore: {
      type: Number,
      default: 0
    },
    locationHistory: [{
      latitude: Number,
      longitude: Number,
      city: String,
      country: String,
      timestamp: Date
    }]
  }],
  
  // Behavioral Analysis
  behaviorProfile: {
    normalLoginTimes: [Number],
    normalLocations: [String],
    normalTransactionAmounts: {
      min: Number,
      max: Number,
      average: Number
    },
    transactionPatterns: [{
      category: String,
      frequency: Number,
      typicalAmount: Number
    }],
    lastAnalyzed: Date
  },
  
  // Recovery Actions
  recovery: {
    accountFrozen: {
      type: Boolean,
      default: false
    },
    freezeReason: String,
    frozenAt: Date,
    freezeExpiresAt: Date,
    unfreezeRequested: Boolean,
    unfreezeRequestedAt: Date,
    stepsCompleted: [String],
    stepsRemaining: [String]
  },
  
  // Communication Log
  communications: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'call', 'in_app']
    },
    channel: String,
    recipient: String,
    subject: String,
    message: String,
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date
  }],
  
  // Analytics & Reporting
  analytics: {
    totalAlerts: Number,
    resolvedAlerts: Number,
    falsePositives: Number,
    truePositives: Number,
    detectionAccuracy: Number,
    averageResponseTime: Number,
    incidentsByType: Map,
    incidentsBySeverity: Map
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
globalFraudEmergencyNetworkSchema.index({ userId: 1 });
globalFraudEmergencyNetworkSchema.index({ 'alerts.alertId': 1 });
globalFraudEmergencyNetworkSchema.index({ 'alerts.status': 1, 'alerts.createdAt': -1 });
globalFraudEmergencyNetworkSchema.index({ 'alerts.severity': 1 });
globalFraudEmergencyNetworkSchema.index({ 'devices.deviceId': 1 });

// Update timestamp before saving
globalFraudEmergencyNetworkSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const GlobalFraudEmergencyNetwork = mongoose.model('GlobalFraudEmergencyNetwork', globalFraudEmergencyNetworkSchema);

module.exports = GlobalFraudEmergencyNetwork;
