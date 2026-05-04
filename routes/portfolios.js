/**
 * Portfolio Management Routes (PMS)
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const {
  createPortfolio,
  getClientPortfolios,
  getPortfolio,
  addPosition,
  updatePosition,
  removePosition,
  rebalancePortfolio,
  getPortfolioPerformance,
  addGoal,
  updateGoalProgress
} = require('../controllers/portfolioController');

// Apply authentication to all routes
router.use(authenticate);

// Portfolio CRUD
router.post('/', authorize(['user', 'admin']), createPortfolio);
router.get('/', getClientPortfolios);
router.get('/:portfolioId', getPortfolio);

// Position Management
router.post('/:portfolioId/positions', addPosition);
router.put('/:portfolioId/positions/:positionId', updatePosition);
router.delete('/:portfolioId/positions/:positionId', removePosition);

// Portfolio Operations
router.post('/:portfolioId/rebalance', rebalancePortfolio);
router.get('/:portfolioId/performance', getPortfolioPerformance);

// Goal Management
router.post('/:portfolioId/goals', addGoal);
router.put('/:portfolioId/goals/:goalId/progress', updateGoalProgress);

module.exports = router;
