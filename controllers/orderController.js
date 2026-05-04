/**
 * Order Management Controller (OMS)
 */

const Order = require('../models/Order');
const Portfolio = require('../models/Portfolio');
const { v4: uuidv4 } = require('uuid');
const logger = require('../middleware/logging');

// Create Order
exports.createOrder = async (req, res) => {
  try {
    const { portfolioId, orderType, side, symbol, securityType, quantity, price, stopPrice, limitPrice, timeInForce, executionAlgorithm } = req.body;
    
    const orderId = `ORD-${uuidv4().toUpperCase()}`;
    
    const order = new Order({
      orderId,
      clientId: req.user.id,
      portfolioId,
      orderType,
      side,
      symbol: symbol.toUpperCase(),
      securityType,
      quantity,
      price,
      stopPrice,
      limitPrice,
      timeInForce: timeInForce || 'day',
      executionAlgorithm,
      createdBy: req.user.id
    });
    
    await order.runPreTradeChecks();
    
    if (!order.preTradeChecks.passed) {
      return res.status(400).json({
        status: 'error',
        message: 'Pre-trade checks failed',
        data: { checks: order.preTradeChecks.checks }
      });
    }
    
    await order.save();
    
    logger.info('Order created', { orderId, clientId: req.user.id, symbol, side, quantity });
    
    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: { order }
    });
  } catch (error) {
    logger.error('Order creation failed', { error: error.message, clientId: req.user.id });
    res.status(500).json({
      status: 'error',
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Get Client Orders
exports.getClientOrders = async (req, res) => {
  try {
    const { status, symbol, limit = 50, skip = 0 } = req.query;
    
    const query = { clientId: req.user.id };
    if (status) query.status = status;
    if (symbol) query.symbol = symbol.toUpperCase();
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('portfolioId', 'portfolioName portfolioType');
    
    const total = await Order.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      count: orders.length,
      total,
      data: { orders }
    });
  } catch (error) {
    logger.error('Failed to get client orders', { error: error.message, clientId: req.user.id });
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve orders',
      error: error.message
    });
  }
};

// Get Order Details
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ 
      orderId: req.params.orderId,
      clientId: req.user.id 
    }).populate('portfolioId');
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    logger.error('Failed to get order', { error: error.message, orderId: req.params.orderId });
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve order',
      error: error.message
    });
  }
};

// Submit Order
exports.submitOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ 
      orderId: req.params.orderId,
      clientId: req.user.id 
    });
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    if (order.status !== 'draft') {
      return res.status(400).json({
        status: 'error',
        message: 'Order has already been submitted'
      });
    }
    
    await order.submit();
    
    logger.info('Order submitted', { orderId: order.orderId });
    
    res.status(200).json({
      status: 'success',
      message: 'Order submitted successfully',
      data: { order }
    });
  } catch (error) {
    logger.error('Failed to submit order', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit order',
      error: error.message
    });
  }
};

// Cancel Order
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ 
      orderId: req.params.orderId,
      clientId: req.user.id 
    });
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    if (!['draft', 'submitted', 'acknowledged', 'partial'].includes(order.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Order cannot be cancelled'
      });
    }
    
    await order.cancel(req.body.reason);
    
    logger.info('Order cancelled', { orderId: order.orderId, reason: req.body.reason });
    
    res.status(200).json({
      status: 'success',
      message: 'Order cancelled successfully',
      data: { order }
    });
  } catch (error) {
    logger.error('Failed to cancel order', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

// Get Active Orders
exports.getActiveOrders = async (req, res) => {
  try {
    const orders = await Order.getActiveOrders(req.user.id);
    
    res.status(200).json({
      status: 'success',
      count: orders.length,
      data: { orders }
    });
  } catch (error) {
    logger.error('Failed to get active orders', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve active orders',
      error: error.message
    });
  }
};

// Create Parent Order (with slicing)
exports.createParentOrder = async (req, res) => {
  try {
    const { portfolioId, orderType, side, symbol, securityType, totalQuantity, price, sliceCount, executionAlgorithm, timeInForce } = req.body;
    
    const parentOrderId = `PORD-${uuidv4().toUpperCase()}`;
    const sliceQuantity = Math.floor(totalQuantity / sliceCount);
    
    const parentOrder = new Order({
      orderId: parentOrderId,
      clientId: req.user.id,
      portfolioId,
      orderType,
      side,
      symbol: symbol.toUpperCase(),
      securityType,
      quantity: totalQuantity,
      price,
      timeInForce: timeInForce || 'day',
      executionAlgorithm,
      isParentOrder: true,
      sliceCount,
      currentSlice: 0,
      createdBy: req.user.id
    });
    
    await parentOrder.save();
    
    // Create child orders
    const childOrders = [];
    let remainingQuantity = totalQuantity;
    
    for (let i = 0; i < sliceCount; i++) {
      const sliceQty = (i === sliceCount - 1) ? remainingQuantity : sliceQuantity;
      
      const childOrder = new Order({
        orderId: `ORD-${uuidv4().toUpperCase()}`,
        clientId: req.user.id,
        portfolioId,
        parentOrderId: parentOrderId,
        orderType,
        side,
        symbol: symbol.toUpperCase(),
        securityType,
        quantity: sliceQty,
        price,
        timeInForce: timeInForce || 'day',
        executionAlgorithm,
        createdBy: req.user.id
      });
      
      await childOrder.save();
      childOrders.push(childOrder.orderId);
      parentOrder.childOrders.push(childOrder.orderId);
      remainingQuantity -= sliceQty;
    }
    
    await parentOrder.save();
    
    logger.info('Parent order created', { parentOrderId, sliceCount });
    
    res.status(201).json({
      status: 'success',
      message: 'Parent order created successfully',
      data: { 
        parentOrder,
        childOrders
      }
    });
  } catch (error) {
    logger.error('Failed to create parent order', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to create parent order',
      error: error.message
    });
  }
};

// Get Order History
exports.getOrderHistory = async (req, res) => {
  try {
    const { startDate, endDate, symbol, status } = req.query;
    
    const query = { clientId: req.user.id };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (symbol) query.symbol = symbol.toUpperCase();
    if (status) query.status = status;
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('portfolioId', 'portfolioName');
    
    res.status(200).json({
      status: 'success',
      count: orders.length,
      data: { orders }
    });
  } catch (error) {
    logger.error('Failed to get order history', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve order history',
      error: error.message
    });
  }
};

// Get Orders by Symbol
exports.getOrdersBySymbol = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { status, limit = 50 } = req.query;
    
    const orders = await Order.getOrdersBySymbol(symbol, {
      clientId: req.user.id,
      status,
      limit: parseInt(limit)
    });
    
    res.status(200).json({
      status: 'success',
      count: orders.length,
      data: { orders }
    });
  } catch (error) {
    logger.error('Failed to get orders by symbol', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve orders',
      error: error.message
    });
  }
};
