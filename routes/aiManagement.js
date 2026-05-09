const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiManagementController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/status', aiController.getFleetStatus);
router.get('/upgrade-path', aiController.getUpgradePath);

// Only admins can manually assign agents or trigger global optimization
router.post('/assign', authenticate, authorize('admin', 'super_admin'), aiController.assignAgent);
router.post('/optimize', authenticate, authorize('admin', 'super_admin'), aiController.triggerOptimization);

module.exports = router;
