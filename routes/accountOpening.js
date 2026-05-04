const express = require('express');
const router = express.Router();
const accountOpeningController = require('../controllers/accountOpeningController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateAccountOpening } = require('../middleware/validation');
const upload = require('../middleware/upload');

// Public routes
router.post(
  '/submit',
  authenticate,
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'proofOfAddress', maxCount: 1 },
    { name: 'incomeProof', maxCount: 1 }
  ]),
  validateAccountOpening,
  accountOpeningController.submitApplication
);

router.get('/eligibility', authenticate, accountOpeningController.checkEligibility);

// User routes
router.get('/my-applications', authenticate, accountOpeningController.getUserApplications);

router.get('/:id', authenticate, accountOpeningController.getApplicationById);

router.put('/:id/documents', 
  authenticate,
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'proofOfAddress', maxCount: 1 },
    { name: 'incomeProof', maxCount: 1 }
  ]),
  accountOpeningController.uploadDocuments
);

// Admin routes
router.get('/', authenticate, authorize('admin', 'staff'), accountOpeningController.getAllApplications);

router.patch('/:id/status', 
  authenticate, 
  authorize('admin', 'staff'),
  accountOpeningController.updateApplicationStatus
);

router.get('/statistics/dashboard',
  authenticate,
  authorize('admin'),
  accountOpeningController.getApplicationStatistics
);

router.post('/:id/reject',
  authenticate,
  authorize('admin', 'staff'),
  accountOpeningController.rejectApplication
);

router.post('/:id/approve',
  authenticate,
  authorize('admin'),
  accountOpeningController.approveApplication
);

module.exports = router;
