const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiManagementController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/status', aiController.getFleetStatus);
router.get('/upgrade-path', aiController.getUpgradePath);

// Only admins can manually assign agents or trigger global optimization
router.post('/assign', protect, restrictTo('admin', 'super_admin'), aiController.assignAgent);
router.post('/optimize', protect, restrictTo('admin', 'super_admin'), aiController.triggerOptimization);

module.exports = router;
