const express = require('express');
const router = express.Router();
const accountOpeningController = require('../controllers/accountOpeningController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateAccountOpening } = require('../middleware/validation');
const upload = require('../middleware/upload');

// User routes
router.post(
  '/submit',
  authenticate,
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'proofOfAddress', maxCount: 1 },
    { name: 'incomeProof', maxCount: 1 }
  ]),
  accountOpeningController.createApplication
);

router.get('/my-applications', authenticate, accountOpeningController.getUserApplications);

router.get('/:applicationId', authenticate, accountOpeningController.getApplication);

router.put('/:applicationId/documents',
  authenticate,
  upload.fields([
    { name: 'documents', maxCount: 10 }
  ]),
  accountOpeningController.submitKYCDocuments
);

// Admin routes
router.get('/', authenticate, authorize('admin', 'staff'), accountOpeningController.getPendingApplications);

router.patch('/:applicationId/status',
  authenticate, 
  authorize('admin', 'staff'),
  accountOpeningController.updateApplicationStatus
);

router.post('/:applicationId/verify-kyc',
  authenticate,
  authorize('admin', 'staff'),
  accountOpeningController.verifyKYC
);

router.post('/:applicationId/create-account',
  authenticate,
  authorize('admin'),
  accountOpeningController.createAccountFromApplication
);

router.put('/:applicationId',
  authenticate,
  accountOpeningController.updateApplication
);

module.exports = router;
