/**
 * Order Management Routes (OMS)
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const {
  createOrder,
  getClientOrders,
  getOrder,
  submitOrder,
  cancelOrder,
  getActiveOrders,
  createParentOrder,
  getOrderHistory,
  getOrdersBySymbol
} = require('../controllers/orderController');

// Apply authentication to all routes
router.use(authenticate);

// Order CRUD
router.post('/', authorize(['user', 'admin']), createOrder);
router.get('/', getClientOrders);
router.get('/history', getOrderHistory);
router.get('/active', getActiveOrders);
router.get('/:orderId', getOrder);
router.get('/symbol/:symbol', getOrdersBySymbol);

// Order Actions
router.post('/:orderId/submit', submitOrder);
router.post('/:orderId/cancel', cancelOrder);

// Parent Orders (Algo Trading)
router.post('/parent/create', authorize(['user', 'admin']), createParentOrder);

module.exports = router;
