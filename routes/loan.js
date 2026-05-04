const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateLoanApplication } = require('../middleware/validation');
const upload = require('../middleware/upload');

// Public routes
router.post('/calculate-eligibility',
  authenticate,
  loanController.calculateEligibility
);

// User routes
router.post('/',
  authenticate,
  upload.fields([
    { name: 'documents', maxCount: 10 }
  ]),
  validateLoanApplication,
  loanController.createLoan
);

router.get('/my-loans',
  authenticate,
  (req, res, next) => {
    req.params.userId = req.user.id;
    next();
  },
  loanController.getUserLoans
);

router.get('/:id',
  authenticate,
  loanController.getLoanById
);

router.get('/:id/schedule',
  authenticate,
  loanController.getRepaymentSchedule
);

router.post('/:id/payment',
  authenticate,
  loanController.processPayment
);

// Admin routes
router.get('/',
  authenticate,
  authorize('admin', 'staff'),
  loanController.getAllLoans
);

router.patch('/:id/status',
  authenticate,
  authorize('admin'),
  loanController.updateLoanStatus
);

router.get('/statistics/overview',
  authenticate,
  authorize('admin'),
  loanController.getLoanStatistics
);

module.exports = router;
