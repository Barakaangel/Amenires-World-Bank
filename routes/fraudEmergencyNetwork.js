const express = require('express');
const router = express.Router();
const globalFraudEmergencyNetworkController = require('../controllers/globalFraudEmergencyNetworkController');
const { authenticate, authorize } = require('../middleware/auth');

// Profile routes
router.get('/:userId/profile',
  authenticate,
  globalFraudEmergencyNetworkController.getProfile
);

router.post('/:userId/fraud-detection',
  authenticate,
  globalFraudEmergencyNetworkController.runFraudDetection
);

// Device management
router.post('/:userId/devices',
  authenticate,
  globalFraudEmergencyNetworkController.registerDevice
);

// Emergency actions
router.post('/:userId/emergency-actions',
  authenticate,
  authorize('admin'),
  globalFraudEmergencyNetworkController.triggerEmergencyAction
);

// Alert management
router.get('/:userId/alerts',
  authenticate,
  globalFraudEmergencyNetworkController.getAlerts
);

router.put('/:userId/alerts/:alertId',
  authenticate,
  authorize('admin', 'staff'),
  globalFraudEmergencyNetworkController.resolveAlert
);

// Account recovery
router.post('/:userId/unfreeze',
  authenticate,
  globalFraudEmergencyNetworkController.unfreezeAccount
);

// Verification
router.post('/:userId/verification',
  authenticate,
  globalFraudEmergencyNetworkController.submitVerification
);

module.exports = router;
