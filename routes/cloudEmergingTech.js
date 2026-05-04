const express = require('express');
const router = express.Router();
const cloudEmergingTechController = require('../controllers/cloudEmergingTechController');
const { authenticate, authorize } = require('../middleware/auth');

// User routes
router.get('/:userId/profile',
  authenticate,
  cloudEmergingTechController.getProfile
);

router.put('/:userId/blockchain',
  authenticate,
  cloudEmergingTechController.updateBlockchain
);

router.post('/:userId/blockchain/transactions',
  authenticate,
  cloudEmergingTechController.recordBlockchainTransaction
);

router.get('/:userId/ai/analytics',
  authenticate,
  cloudEmergingTechController.getAIAnalytics
);

router.post('/:userId/ai/fraud-detection',
  authenticate,
  cloudEmergingTechController.runFraudDetection
);

router.post('/:userId/iot/devices',
  authenticate,
  cloudEmergingTechController.registerIoTDevice
);

router.put('/:userId/iot/devices/:deviceId',
  authenticate,
  cloudEmergingTechController.updateIoTDevice
);

router.post('/:userId/biometrics',
  authenticate,
  cloudEmergingTechController.registerBiometric
);

router.post('/:userId/cloud-services',
  authenticate,
  cloudEmergingTechController.addCloudService
);

router.post('/:userId/digital-twins',
  authenticate,
  cloudEmergingTechController.createDigitalTwin
);

router.put('/:userId/privacy',
  authenticate,
  cloudEmergingTechController.updatePrivacySettings
);

module.exports = router;
