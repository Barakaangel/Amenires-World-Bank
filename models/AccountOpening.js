/**
 * Account Opening Model
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountOpeningSchema = new Schema({
  // Application ID
  applicationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Account Type
  accountType: {
    type: String,
    required: true,
    enum: [
      // Retail
      'current', 'savings', 'time_deposit', 'foreign_currency', 'numbered', 'trust', 'escrow', 'custodial', 'joint', 'student', 'senior', 'diaspora', 'refugee',
      // Business
      'sole_proprietorship', 'partnership', 'llc', 'corporation', 'holding_company', 'spv', 'fund', 'non_profit', 'government', 'intergovernmental', 'crypto_vasp'
    ]
  },
  accountTiers: {
    type: String,
    enum: ['standard', 'premium', 'private_banking', 'wealth_management', 'family_office'],
    default: 'standard'
  },
  
  // Personal Information
  personalInfo: {
    title: String,
    firstName: String,
    middleName: String,
    lastName: String,
    dateOfBirth: Date,
    placeOfBirth: String,
    nationality: String,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed', 'civil_partnership']
    },
    occupation: String,
    employer: String,
    employmentStatus: {
      type: String,
      enum: ['employed', 'self_employed', 'unemployed', 'retired', 'student', 'homemaker']
    },
    annualIncome: Number,
    netWorth: Number,
    sourceOfWealth: String,
    sourceOfFunds: String
  },
  
  // Contact Information
  contactInfo: {
    primaryAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      addressProof: String,
      addressProofType: String
    },
    mailingAddress: {
      sameAsPrimary: { type: Boolean, default: true },
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    email: String,
    primaryPhone: String,
    secondaryPhone: String,
    preferredContactMethod: {
      type: String,
      enum: ['email', 'phone', 'sms', 'mail', 'secure_message']
    }
  },
  
  // Identity Verification
  identityVerification: {
    idType: {
      type: String,
      enum: ['passport', 'national_id', 'driving_license', 'residence_permit', 'military_id', 'other']
    },
    idNumber: String,
    idCountry: String,
    idIssueDate: Date,
    idExpiryDate: Date,
    idFrontImage: String,
    idBackImage: String,
    idVerificationStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'verified', 'rejected', 'manual_review'],
      default: 'pending'
    },
    idVerificationScore: Number,
    idVerificationDetails: {
      ocrConfidence: Number,
      hologramDetection: Boolean,
      uvPatternDetection: Boolean,
      faceMatchScore: Number,
      livenessDetection: Boolean
    },
    biometricData: {
      facialGeometry: String,
      fingerprints: [String],
      irisScan: String,
      voiceprint: String
    },
    eIDIntegration: {
      provider: String,
      integrationId: String,
      verified: Boolean,
      verifiedAt: Date
    }
  },
  
  // KYC & Compliance
  kycCompliance: {
    riskRating: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high'],
      default: 'medium'
    },
    riskScore: Number,
    pepCheck: {
      isPEP: Boolean,
      pepDetails: String,
      checkedAt: Date,
      listUsed: String
    },
    sanctionsScreening: {
      isSanctioned: Boolean,
      sanctionDetails: String,
      lists: [String],
      checkedAt: Date
    },
    adverseMedia: {
      hasAdverseMedia: Boolean,
      mediaLinks: [String],
      checkedAt: Date
    },
    ultimateBeneficialOwners: [{
      name: String,
      ownershipPercentage: Number,
      relationship: String,
      idNumber: String,
      nationality: String,
      isPEP: Boolean,
      isSanctioned: Boolean
    }],
    sourceOfFundsVerified: Boolean,
    sourceOfFundsDocuments: [String],
    taxResidency: [{
      country: String,
      taxId: String,
      fatcaClassification: String,
      crsClassification: String
    }]
  },
  
  // Business Information (for corporate accounts)
  businessInfo: {
    companyName: String,
    registrationNumber: String,
    dateOfIncorporation: Date,
    countryOfIncorporation: String,
    businessAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    businessType: {
      type: String,
      enum: ['sole_proprietorship', 'partnership', 'llc', 'corporation', 'trust', 'fund']
    },
    industry: String,
    sector: String,
    businessActivity: String,
    authorizedSignatories: [{
      name: String,
      position: String,
      idNumber: String,
      authorityLevel: {
        type: String,
        enum: ['full', 'limited', 'view_only']
      }
    }],
    boardResolution: String,
    certificateOfIncorporation: String,
    articlesOfAssociation: String,
    shareholdingStructure: [{
      shareholder: String,
      shares: Number,
      percentage: Number
    }]
  },
  
  // Video KYC
  videoKYC: {
    enabled: Boolean,
    scheduledAt: Date,
    completedAt: Date,
    videoUrl: String,
    agentId: String,
    agentNotes: String,
    verificationResult: {
      type: String,
      enum: ['passed', 'failed', 'inconclusive'],
      confidenceScore: Number
    },
    geolocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      timestamp: Date
    }
  },
  
  // Product Selection
  products: [{
    productType: String,
    productName: String,
    features: [String],
    initialDeposit: Number,
    currency: String
  }],
  
  // Account Terms
  accountTerms: {
    currency: {
      type: String,
      default: 'USD'
    },
    expectedTransactionVolume: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high']
    },
    expectedMonthlyBalance: {
      type: String,
      enum: ['below_5000', '5000_25000', '25000_100000', '100000_500000', 'above_500000']
    },
    accountPurpose: String,
    countriesOfTransaction: [String]
  },
  
  // Digital Signature
  digitalSignature: {
    signatureHash: String,
    timestamp: Date,
    ipAddress: String,
    deviceFingerprint: String,
    publicKey: String
  },
  
  // Application Status
  status: {
    type: String,
    required: true,
    enum: ['draft', 'submitted', 'under_review', 'additional_info_required', 'approved', 'rejected', 'on_hold', 'suspended'],
    default: 'draft',
    index: true
  },
  rejectionReason: String,
  approvalDate: Date,
  rejectedDate: Date,
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: String,
  
  // Onboarding Channel
  onboardingChannel: {
    type: String,
    enum: ['mobile_app', 'web', 'branch_tablet', 'api_embedded', 'kiosk', 'correspondent_bank', 'embassy'],
    required: true
  },
  referralCode: String,
  
  // Additional Documents
  documents: [{
    documentType: String,
    documentName: String,
    documentUrl: String,
    uploadDate: Date,
    verified: Boolean,
    verificationDate: Date
  }],
  
  // Security Questions
  securityQuestions: [{
    question: String,
    answerHash: String,
    custom: Boolean
  }],
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  deviceFingerprint: String,
  geolocation: {
    latitude: Number,
    longitude: Number,
    city: String,
    country: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  submittedAt: Date,
  lastUpdated: Date,
  completedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
accountOpeningSchema.index({ applicationId: 1 });
accountOpeningSchema.index({ userId: 1, status: 1 });
accountOpeningSchema.index({ 'contactInfo.email': 1 });
accountOpeningSchema.index({ status: 1, createdAt: -1 });

// Virtuals
accountOpeningSchema.virtual('isComplete').get(function() {
  return this.status === 'approved' && this.completedAt;
});

accountOpeningSchema.virtual('age').get(function() {
  if (this.personalInfo.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.personalInfo.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  return null;
});

// Methods
accountOpeningSchema.methods.submit = function() {
  this.status = 'submitted';
  this.submittedAt = new Date();
  return this.save();
};

accountOpeningSchema.methods.approve = function(reviewerId, notes) {
  this.status = 'approved';
  this.approvalDate = new Date();
  this.completedAt = new Date();
  this.reviewedBy = reviewerId;
  if (notes) this.reviewNotes = notes;
  return this.save();
};

accountOpeningSchema.methods.reject = function(reason, reviewerId) {
  this.status = 'rejected';
  this.rejectedDate = new Date();
  this.rejectionReason = reason;
  this.reviewedBy = reviewerId;
  return this.save();
};

accountOpeningSchema.methods.requestAdditionalInfo = function(infoRequest) {
  this.status = 'additional_info_required';
  this.reviewNotes = infoRequest;
  return this.save();
};

// Static methods
accountOpeningSchema.statics.getByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

accountOpeningSchema.statics.getUserApplications = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('AccountOpening', accountOpeningSchema);
