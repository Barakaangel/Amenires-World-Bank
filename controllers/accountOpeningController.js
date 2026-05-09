/**
 * Account Opening Controller
 * Manages digital onboarding, KYC, and account creation workflows
 */

const AccountOpening = require('../models/AccountOpening');
const Account = require('../models/Account');
const User = require('../models/User');
const { auditLog } = require('../middleware/security');
const crypto = require('crypto');

/**
 * Create new account opening application
 */
const createApplication = async (req, res) => {
  try {
    const { userId, accountType, productType, ...applicationData } = req.body;

    // Validate user exists
    const user = await User.findById(String(userId));
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Generate application ID
    const applicationId = `AO-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create application
    const application = await AccountOpening.create({
      applicationId,
      userId,
      accountType,
      productType,
      ...applicationData
    });

    await auditLog('ACCOUNT_OPENING_APPLICATION', userId, {
      applicationId,
      accountType
    });

    res.status(201).json({
      status: 'success',
      message: 'Account opening application created successfully',
      data: { application }
    });
  } catch (error) {
    console.error('Account opening error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating account opening application'
    });
  }
};

/**
 * Get account opening application by ID
 */
const getApplication = async (req, res) => {
  try {
    const application = await AccountOpening.findOne({ 
      applicationId: { $eq: String(req.params.applicationId) }
    });

    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { application }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching application'
    });
  }
};

/**
 * Get all applications for a user
 */
const getUserApplications = async (req, res) => {
  try {
    const applications = await AccountOpening.find({ 
      userId: { $eq: String(req.params.userId) }
    }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { applications }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching applications'
    });
  }
};

/**
 * Update application status
 */
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, rejectionReason, reviewedBy, notes } = req.body;

    const application = await AccountOpening.findOne({ applicationId });

    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found'
      });
    }

    application.status = status;
    if (status === 'rejected') {
      application.rejectionReason = rejectionReason;
    }
    if (reviewedBy) {
      application.reviewedBy = reviewedBy;
      application.reviewedAt = new Date();
    }
    if (notes) {
      application.notes = notes;
    }

    await application.save();

    await auditLog('APPLICATION_STATUS_UPDATED', application.userId, {
      applicationId,
      newStatus: status
    });

    res.status(200).json({
      status: 'success',
      message: 'Application status updated successfully',
      data: { application }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating application status'
    });
  }
};

/**
 * Submit KYC documents
 */
const submitKYCDocuments = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { documents } = req.body;

    const application = await AccountOpening.findOne({ applicationId });

    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found'
      });
    }

    // Add documents to application
    application.kycDocuments = documents;
    application.kycSubmittedAt = new Date();
    application.status = 'kyc_submitted';

    await application.save();

    await auditLog('KYC_DOCUMENTS_SUBMITTED', application.userId, {
      applicationId,
      documentCount: documents.length
    });

    res.status(200).json({
      status: 'success',
      message: 'KYC documents submitted successfully',
      data: { application }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while submitting KYC documents'
    });
  }
};

/**
 * Perform KYC verification
 */
const verifyKYC = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { verified, verificationDetails, riskScore, verifiedBy } = req.body;

    const application = await AccountOpening.findOne({ applicationId });

    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found'
      });
    }

    application.kycVerified = verified;
    application.kycVerificationDetails = verificationDetails;
    application.riskScore = riskScore;
    application.kycVerifiedAt = new Date();
    application.verifiedBy = verifiedBy;

    if (verified) {
      application.status = 'kyc_approved';
    } else {
      application.status = 'kyc_rejected';
    }

    await application.save();

    await auditLog('KYC_VERIFICATION_COMPLETED', application.userId, {
      applicationId,
      verified,
      riskScore
    });

    res.status(200).json({
      status: 'success',
      message: 'KYC verification completed',
      data: { application }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during KYC verification'
    });
  }
};

/**
 * Create account from approved application
 */
const createAccountFromApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await AccountOpening.findOne({ applicationId });

    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found'
      });
    }

    if (application.status !== 'approved') {
      return res.status(400).json({
        status: 'error',
        message: 'Application must be approved before creating account'
      });
    }

    // Create account
    const account = await Account.create({
      accountType: application.accountType,
      accountName: application.accountName,
      userId: application.userId,
      currency: application.currency,
      balance: application.initialDeposit || 0,
      availableBalance: application.initialDeposit || 0
    });

    // Update application
    application.accountCreated = true;
    application.accountNumber = account.accountNumber;
    application.status = 'completed';
    application.completedAt = new Date();
    await application.save();

    await auditLog('ACCOUNT_CREATED_FROM_APPLICATION', application.userId, {
      applicationId,
      accountNumber: account.accountNumber
    });

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully from application',
      data: { account, application }
    });
  } catch (error) {
    console.error('Account creation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating account'
    });
  }
};

/**
 * Get pending applications (admin)
 */
const getPendingApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { status: { $in: ['submitted', 'kyc_submitted', 'kcy_approved'] } };

    const applications = await AccountOpening.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AccountOpening.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        applications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching pending applications'
    });
  }
};

/**
 * Update application details
 */
const updateApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const updates = req.body;

    const application = await AccountOpening.findOne({ applicationId });

    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found'
      });
    }

    // Only allow updates for certain statuses
    if (!['submitted', 'requires_info'].includes(application.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot update application in current status'
      });
    }

    Object.assign(application, updates);
    await application.save();

    await auditLog('APPLICATION_UPDATED', application.userId, {
      applicationId,
      fields: Object.keys(updates)
    });

    res.status(200).json({
      status: 'success',
      message: 'Application updated successfully',
      data: { application }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating application'
    });
  }
};

module.exports = {
  createApplication,
  getApplication,
  getUserApplications,
  updateApplicationStatus,
  submitKYCDocuments,
  verifyKYC,
  createAccountFromApplication,
  getPendingApplications,
  updateApplication
};
