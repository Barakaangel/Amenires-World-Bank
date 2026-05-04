const express = require('express');
const router = express.Router();
const conversationalAIController = require('../controllers/conversationalAIController');
const { authenticate } = require('../middleware/auth');

// Query processing
router.post('/:userId/query',
  authenticate,
  conversationalAIController.processQuery
);

// Balance
router.get('/:userId/balance',
  authenticate,
  conversationalAIController.getAccountBalance
);

// Transactions
router.get('/:userId/transactions',
  authenticate,
  conversationalAIController.getTransactionHistory
);

// Loans
router.get('/:userId/loans',
  authenticate,
  conversationalAIController.getLoanInfo
);

// Transfer
router.post('/:userId/transfer',
  authenticate,
  conversationalAIController.initiateTransfer
);

// Help
router.get('/:userId/help',
  authenticate,
  conversationalAIController.getHelp
);

// Context management
router.post('/:userId/context',
  authenticate,
  conversationalAIController.saveContext
);

module.exports = router;
