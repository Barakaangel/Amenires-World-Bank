/**
 * Bank Identity Routes
 */

const express = require('express');
const router = express.Router();
const {
  getBankIdentity,
  getBankBalance,
  getBankLogo,
  getSystemStatus
} = require('../controllers/bankIdentityController');
const { authenticate } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/identity', getBankIdentity);
router.get('/balance', getBankBalance);
router.get('/logo', getBankLogo);
router.get('/status', getSystemStatus);

// Protected routes (authentication required)
router.get('/identity/detailed', authenticate, getBankIdentity);

module.exports = router;
