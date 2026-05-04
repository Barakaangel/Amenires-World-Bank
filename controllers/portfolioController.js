/**
 * Portfolio Management Controller (PMS)
 */

const Portfolio = require('../models/Portfolio');
const Order = require('../models/Order');
const { v4: uuidv4 } = require('uuid');
const logger = require('../middleware/logging');

// Create Portfolio
exports.createPortfolio = async (req, res) => {
  try {
    const { portfolioName, portfolioType, goals, managedBy, riskTolerance } = req.body;
    
    const portfolioId = `PTF-${uuidv4().toUpperCase()}`;
    
    const portfolio = new Portfolio({
      portfolioId,
      clientId: req.user.id,
      portfolioName,
      portfolioType,
      managedBy,
      goals: goals || [],
      riskMetrics: { beta: 1, standardDeviation: 15 }
    });
    
    await portfolio.save();
    
    logger.info('Portfolio created', { portfolioId, clientId: req.user.id });
    
    res.status(201).json({
      status: 'success',
      message: 'Portfolio created successfully',
      data: { portfolio }
    });
  } catch (error) {
    logger.error('Portfolio creation failed', { error: error.message, clientId: req.user.id });
    res.status(500).json({
      status: 'error',
      message: 'Failed to create portfolio',
      error: error.message
    });
  }
};

// Get Client Portfolios
exports.getClientPortfolios = async (req, res) => {
  try {
    const portfolios = await Portfolio.getClientPortfolios(req.user.id);
    
    res.status(200).json({
      status: 'success',
      count: portfolios.length,
      data: { portfolios }
    });
  } catch (error) {
    logger.error('Failed to get client portfolios', { error: error.message, clientId: req.user.id });
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve portfolios',
      error: error.message
    });
  }
};

// Get Portfolio Details
exports.getPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ 
      portfolioId: req.params.portfolioId,
      clientId: req.user.id 
    }).populate('positions.symbol');
    
    if (!portfolio) {
      return res.status(404).json({
        status: 'error',
        message: 'Portfolio not found'
      });
    }
    
    // Get recent orders
    const recentOrders = await Order.find({ portfolioId: portfolio._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.status(200).json({
      status: 'success',
      data: { 
        portfolio,
        recentOrders
      }
    });
  } catch (error) {
    logger.error('Failed to get portfolio', { error: error.message, portfolioId: req.params.portfolioId });
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve portfolio',
      error: error.message
    });
  }
};

// Add Position to Portfolio
exports.addPosition = async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const { 
      symbol, securityType, quantity, averageCost, 
      currentPrice, currency, exchange, country, sector 
    } = req.body;
    
    const portfolio = await Portfolio.findOne({ 
      portfolioId,
      clientId: req.user.id 
    });
    
    if (!portfolio) {
      return res.status(404).json({
        status: 'error',
        message: 'Portfolio not found'
      });
    }
    
    const positionId = `POS-${uuidv4().toUpperCase()}`;
    const currentValue = quantity * (currentPrice || averageCost);
    const gainLoss = currentValue - (quantity * averageCost);
    const gainLossPercent = averageCost > 0 ? (gainLoss / (quantity * averageCost)) * 100 : 0;
    
    portfolio.positions.push({
      positionId,
      symbol: symbol.toUpperCase(),
      securityType,
      quantity,
      averageCost,
      currentPrice: currentPrice || averageCost,
      currentValue,
      gainLoss,
      gainLossPercent,
      currency: currency || 'USD',
      exchange,
      country,
      sector,
      purchaseDate: new Date(),
      lastUpdate: new Date()
    });
    
    await portfolio.calculateTotalValue();
    await portfolio.calculateAssetAllocation();
    portfolio.lastValuationDate = new Date();
    await portfolio.save();
    
    logger.info('Position added', { portfolioId, positionId, symbol });
    
    res.status(201).json({
      status: 'success',
      message: 'Position added successfully',
      data: { portfolio }
    });
  } catch (error) {
    logger.error('Failed to add position', { error: error.message, portfolioId: req.params.portfolioId });
    res.status(500).json({
      status: 'error',
      message: 'Failed to add position',
      error: error.message
    });
  }
};

// Update Position
exports.updatePosition = async (req, res) => {
  try {
    const { portfolioId, positionId } = req.params;
    const { quantity, currentPrice } = req.body;
    
    const portfolio = await Portfolio.findOne({ 
      portfolioId,
      clientId: req.user.id 
    });
    
    if (!portfolio) {
      return res.status(404).json({
        status: 'error',
        message: 'Portfolio not found'
      });
    }
    
    const position = portfolio.positions.find(p => p.positionId === positionId);
    if (!position) {
      return res.status(404).json({
        status: 'error',
        message: 'Position not found'
      });
    }
    
    position.quantity = quantity;
    position.currentPrice = currentPrice;
    position.currentValue = quantity * currentPrice;
    position.gainLoss = position.currentValue - (position.quantity * position.averageCost);
    position.gainLossPercent = position.averageCost > 0 
      ? (position.gainLoss / (position.quantity * position.averageCost)) * 100 
      : 0;
    position.lastUpdate = new Date();
    
    await portfolio.calculateTotalValue();
    await portfolio.calculateAssetAllocation();
    portfolio.lastValuationDate = new Date();
    await portfolio.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Position updated successfully',
      data: { portfolio }
    });
  } catch (error) {
    logger.error('Failed to update position', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to update position',
      error: error.message
    });
  }
};

// Remove Position
exports.removePosition = async (req, res) => {
  try {
    const { portfolioId, positionId } = req.params;
    
    const portfolio = await Portfolio.findOne({ 
      portfolioId,
      clientId: req.user.id 
    });
    
    if (!portfolio) {
      return res.status(404).json({
        status: 'error',
        message: 'Portfolio not found'
      });
    }
    
    portfolio.positions = portfolio.positions.filter(p => p.positionId !== positionId);
    await portfolio.calculateTotalValue();
    await portfolio.calculateAssetAllocation();
    portfolio.lastValuationDate = new Date();
    await portfolio.save();
    
    logger.info('Position removed', { portfolioId, positionId });
    
    res.status(200).json({
      status: 'success',
      message: 'Position removed successfully',
      data: { portfolio }
    });
  } catch (error) {
    logger.error('Failed to remove position', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove position',
      error: error.message
    });
  }
};

// Rebalance Portfolio
exports.rebalancePortfolio = async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const { targetAllocation } = req.body;
    
    const portfolio = await Portfolio.findOne({ 
      portfolioId,
      clientId: req.user.id 
    });
    
    if (!portfolio) {
      return res.status(404).json({
        status: 'error',
        message: 'Portfolio not found'
      });
    }
    
    const trades = portfolio.rebalance(targetAllocation);
    
    logger.info('Portfolio rebalanced', { portfolioId, trades });
    
    res.status(200).json({
      status: 'success',
      message: 'Rebalancing calculated successfully',
      data: { 
        portfolio,
        recommendedTrades: trades
      }
    });
  } catch (error) {
    logger.error('Failed to rebalance portfolio', { error: error.message, portfolioId: req.params.portfolioId });
    res.status(500).json({
      status: 'error',
      message: 'Failed to rebalance portfolio',
      error: error.message
    });
  }
};

// Get Portfolio Performance
exports.getPortfolioPerformance = async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const { period } = req.query;
    
    const portfolio = await Portfolio.findOne({ 
      portfolioId,
      clientId: req.user.id 
    });
    
    if (!portfolio) {
      return res.status(404).json({
        status: 'error',
        message: 'Portfolio not found'
      });
    }
    
    // Calculate performance based on period
    const performanceData = {
      period: period || 'ytd',
      totalValue: portfolio.totalValue,
      totalCost: portfolio.totalCost,
      unrealizedGainLoss: portfolio.unrealizedGainLoss,
      unrealizedGainLossPercent: portfolio.unrealizedGainLossPercent,
      realizedGainLoss: portfolio.realizedGainLoss,
      assetAllocation: portfolio.assetAllocation,
      performance: portfolio.performance,
      riskMetrics: portfolio.riskMetrics,
      benchmark: portfolio.benchmark,
      esg: portfolio.esg
    };
    
    res.status(200).json({
      status: 'success',
      data: performanceData
    });
  } catch (error) {
    logger.error('Failed to get portfolio performance', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve performance data',
      error: error.message
    });
  }
};

// Add Goal to Portfolio
exports.addGoal = async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const { goalName, targetAmount, targetDate, priority, riskTolerance, allocation } = req.body;
    
    const portfolio = await Portfolio.findOne({ 
      portfolioId,
      clientId: req.user.id 
    });
    
    if (!portfolio) {
      return res.status(404).json({
        status: 'error',
        message: 'Portfolio not found'
      });
    }
    
    const goalId = `GL-${uuidv4().toUpperCase()}`;
    
    portfolio.goals.push({
      goalId,
      goalName,
      targetAmount,
      currentAmount: 0,
      targetDate: new Date(targetDate),
      priority,
      riskTolerance,
      allocation: new Map(Object.entries(allocation || {}))
    });
    
    await portfolio.save();
    
    logger.info('Goal added', { portfolioId, goalId });
    
    res.status(201).json({
      status: 'success',
      message: 'Goal added successfully',
      data: { portfolio }
    });
  } catch (error) {
    logger.error('Failed to add goal', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to add goal',
      error: error.message
    });
  }
};

// Update Goal Progress
exports.updateGoalProgress = async (req, res) => {
  try {
    const { portfolioId, goalId } = req.params;
    const { currentAmount } = req.body;
    
    const portfolio = await Portfolio.findOne({ 
      portfolioId,
      clientId: req.user.id 
    });
    
    if (!portfolio) {
      return res.status(404).json({
        status: 'error',
        message: 'Portfolio not found'
      });
    }
    
    const goal = portfolio.goals.find(g => g.goalId === goalId);
    if (!goal) {
      return res.status(404).json({
        status: 'error',
        message: 'Goal not found'
      });
    }
    
    goal.currentAmount = currentAmount;
    await portfolio.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Goal progress updated',
      data: { 
        goal,
        progress: (currentAmount / goal.targetAmount) * 100
      }
    });
  } catch (error) {
    logger.error('Failed to update goal progress', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to update goal progress',
      error: error.message
    });
  }
};
