const express = require('express');
const router = express.Router();
const directInvestmentBrokerageController = require('../controllers/directInvestmentBrokerageController');
const { authenticate, authorize } = require('../middleware/auth');

// Investment account
router.get('/:userId/account',
  authenticate,
  directInvestmentBrokerageController.getInvestmentAccount
);

router.put('/:userId/goals',
  authenticate,
  directInvestmentBrokerageController.updateInvestmentGoals
);

// Holdings
router.get('/:userId/holdings',
  authenticate,
  directInvestmentBrokerageController.getHoldings
);

// Performance
router.get('/:userId/performance',
  authenticate,
  directInvestmentBrokerageController.getPerformanceReport
);

// Dividends
router.get('/:userId/dividends',
  authenticate,
  directInvestmentBrokerageController.getDividends
);

// Alerts
router.post('/:userId/alerts',
  authenticate,
  directInvestmentBrokerageController.createPriceAlert
);

router.get('/:userId/alerts',
  authenticate,
  directInvestmentBrokerageController.getAlerts
);

router.delete('/:userId/alerts/:alertId',
  authenticate,
  directInvestmentBrokerageController.deleteAlert
);

// Tax information
router.get('/:userId/tax',
  authenticate,
  directInvestmentBrokerageController.getTaxInformation
);

module.exports = router;
