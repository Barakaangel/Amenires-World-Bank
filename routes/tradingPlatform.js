const express = require('express');
const router = express.Router();
const tradingPlatformController = require('../controllers/tradingPlatformController');
const { authenticate, authorize } = require('../middleware/auth');

// Investment account routes
router.post('/:userId/account',
  authenticate,
  tradingPlatformController.createInvestmentAccount
);

router.get('/:userId/portfolio',
  authenticate,
  tradingPlatformController.getPortfolio
);

// Order routes
router.post('/:userId/orders',
  authenticate,
  tradingPlatformController.placeOrder
);

router.get('/:userId/orders',
  authenticate,
  tradingPlatformController.getOrderHistory
);

// Watchlist routes
router.post('/:userId/watchlist',
  authenticate,
  tradingPlatformController.addToWatchlist
);

router.get('/:userId/watchlist',
  authenticate,
  tradingPlatformController.getWatchlist
);

// Market data
router.get('/market/:symbol',
  authenticate,
  tradingPlatformController.getMarketData
);

// Fund management
router.post('/:userId/deposit',
  authenticate,
  tradingPlatformController.depositFunds
);

router.post('/:userId/withdraw',
  authenticate,
  tradingPlatformController.withdrawFunds
);

module.exports = router;
