const express = require('express');
const router = express.Router();
const paymentInfrastructureController = require('../controllers/paymentInfrastructureController');
const { authenticate, authorize } = require('../middleware/auth');

// User routes
router.post('/:userId/payment-methods',
  authenticate,
  paymentInfrastructureController.addPaymentMethod
);

router.get('/:userId/payment-methods',
  authenticate,
  paymentInfrastructureController.getPaymentMethods
);

router.post('/:userId/process-payment',
  authenticate,
  paymentInfrastructureController.processPayment
);

router.post('/:userId/receive-payment',
  authenticate,
  paymentInfrastructureController.receivePayment
);

router.post('/:userId/platform-integration',
  authenticate,
  paymentInfrastructureController.setupPlatformIntegration
);

router.get('/:userId/analytics',
  authenticate,
  paymentInfrastructureController.getAnalytics
);

router.post('/:userId/recurring-payments',
  authenticate,
  paymentInfrastructureController.createRecurringPayment
);

module.exports = router;
