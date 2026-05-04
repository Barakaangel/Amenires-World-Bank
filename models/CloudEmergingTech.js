const mongoose = require('mongoose');

const cloudEmergingTechSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Blockchain Integration
  blockchain: {
    enabled: {
      type: Boolean,
      default: false
    },
    walletAddress: {
      type: String,
      sparse: true
    },
    transactions: [{
      hash: String,
      type: String,
      amount: Number,
      currency: String,
      timestamp: Date,
      status: String
    }],
    smartContracts: [{
      address: String,
      name: String,
      type: String,
      deployedAt: Date
    }]
  },
  
  // AI/ML Features
  aiFeatures: {
    predictiveAnalytics: {
      enabled: Boolean,
      riskScore: Number,
      churnProbability: Number,
      nextLikelyTransaction: String,
      spendingPatterns: Map
    },
    fraudDetection: {
      enabled: Boolean,
      riskLevel: String,
      lastScan: Date,
      alerts: [{
        type: String,
        severity: String,
        description: String,
        timestamp: Date,
        resolved: Boolean
      }]
    },
    personalizedOffers: [{
      offerId: String,
      type: String,
      description: String,
      confidence: Number,
      expiryDate: Date,
      accepted: Boolean
    }]
  },
  
  // IoT Integration
  iotDevices: [{
    deviceId: String,
    type: String,
    status: String,
    lastSeen: Date,
    permissions: [String],
    dataStreams: [{
      dataType: String,
      frequency: String,
      lastUpdate: Date
    }]
  }],
  
  // Biometric Authentication
  biometrics: {
    faceId: {
      enabled: Boolean,
      template: String,
      registeredAt: Date
    },
    fingerprint: {
      enabled: Boolean,
      template: String,
      registeredAt: Date
    },
    voicePrint: {
      enabled: Boolean,
      template: String,
      registeredAt: Date
    },
    behaviorAnalysis: {
      enabled: Boolean,
      patterns: Map,
      lastAnalyzed: Date
    }
  },
  
  // Cloud Services Integration
  cloudServices: {
    storage: [{
      provider: String,
      bucketName: String,
      region: String,
      accessLevel: String,
      createdAt: Date
    }],
    computing: [{
      provider: String,
      serviceType: String,
      instanceId: String,
      status: String,
      createdAt: Date
    }],
    apiGateways: [{
      provider: String,
      endpoint: String,
      apiKey: String,
      rateLimit: Number,
      createdAt: Date
    }]
  },
  
  // Digital Twins
  digitalTwins: [{
    name: String,
    type: String,
    description: String,
    state: Map,
    lastSync: Date,
    createdAt: Date
  }],
  
  // Quantum Readiness (for future use)
  quantumReady: {
    enabled: Boolean,
    algorithm: String,
    keySize: Number,
    lastUpdated: Date
  },
  
  // Edge Computing
  edgeNodes: [{
    nodeId: String,
    location: {
      latitude: Number,
      longitude: Number
    },
    capabilities: [String],
    status: String,
    lastHeartbeat: Date
  }],
  
  // 5G Integration
  network5g: {
    enabled: Boolean,
    sliceType: String,
    bandwidth: Number,
    latency: Number,
    reliability: Number
  },
  
  // Privacy & Security
  privacySettings: {
    dataSharing: {
      analytics: Boolean,
      personalization: Boolean,
      thirdParty: Boolean
    },
    encryptionLevel: String,
    anonymizationEnabled: Boolean
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
cloudEmergingTechSchema.index({ userId: 1 });
cloudEmergingTechSchema.index({ 'blockchain.walletAddress': 1 });
cloudEmergingTechSchema.index({ 'aiFeatures.fraudDetection.alerts.timestamp': -1 });
cloudEmergingTechSchema.index({ 'iotDevices.deviceId': 1 });
cloudEmergingTechSchema.index({ createdAt: -1 });

// Update timestamp before saving
cloudEmergingTechSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const CloudEmergingTech = mongoose.model('CloudEmergingTech', cloudEmergingTechSchema);

module.exports = CloudEmergingTech;
