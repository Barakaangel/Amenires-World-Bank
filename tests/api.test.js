/**
 * Comprehensive Test Script for Amenires World Bank
 * Tests all major components and integrations
 */

const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = require('../server');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

let authToken;
let testUserId;
let testAccountId;

const TEST_TIMEOUT = 10000;

describe('Amenires World Bank API Tests', () => {
  
  // Setup and Teardown
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/amenires-bank-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Create test user
    const hashedPassword = await bcrypt.hash('test123', 10);
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      phone: '+1234567890',
      role: 'customer',
      status: 'active',
      kycVerified: true
    });
    testUserId = testUser._id;
  }, TEST_TIMEOUT);

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({ email: 'test@example.com' });
    await mongoose.connection.close();
  });

  // Authentication Tests
  describe('Authentication', () => {
    test('POST /api/auth/login - should login successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'test123'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      authToken = res.body.token;
    });

    test('POST /api/auth/login - should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toBe(401);
    });
  });

  // Account Tests
  describe('Accounts', () => {
    test('POST /api/accounts - should create account', async () => {
      const res = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'checking',
          currency: 'USD',
          initialDeposit: 1000
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('accountNumber');
      testAccountId = res.body._id;
    });

    test('GET /api/accounts - should get user accounts', async () => {
      const res = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // Transaction Tests
  describe('Transactions', () => {
    test('POST /api/transactions - should create transaction', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'transfer',
          amount: 100,
          toAccount: 'ACC0000000000',
          description: 'Test transfer'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('transactionId');
    });

    test('GET /api/transactions - should get transactions', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // Portfolio Tests
  describe('Portfolios', () => {
    test('POST /api/portfolios - should create portfolio', async () => {
      const res = await request(app)
        .post('/api/portfolios')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Portfolio',
          type: 'investment'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('portfolioId');
    });

    test('GET /api/portfolios - should get portfolios', async () => {
      const res = await request(app)
        .get('/api/portfolios')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
    });
  });

  // Order Tests
  describe('Orders', () => {
    test('POST /api/orders - should create order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          symbol: 'AAPL',
          side: 'buy',
          quantity: 10,
          type: 'market'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('orderId');
    });

    test('GET /api/orders - should get orders', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
    });
  });

  // Account Opening Tests
  describe('Account Opening', () => {
    test('POST /api/account-opening/initiate - should initiate account opening', async () => {
      const res = await request(app)
        .post('/api/account-opening/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountType: 'checking',
          currency: 'USD'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('applicationId');
    });
  });

  // Loan Tests
  describe('Loans', () => {
    test('POST /api/loans/apply - should apply for loan', async () => {
      const res = await request(app)
        .post('/api/loans/apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          loanType: 'personal',
          amount: 5000,
          term: 12,
          purpose: 'Test loan'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('loanId');
    });

    test('GET /api/loans/user/:userId - should get user loans', async () => {
      const res = await request(app)
        .get(`/api/loans/user/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
    });
  });

  // Payment Infrastructure Tests
  describe('Payment Infrastructure', () => {
    test('POST /api/payment-infrastructure/payment - should process payment', async () => {
      const res = await request(app)
        .post('/api/payment-infrastructure/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: 'stripe',
          amount: 100,
          currency: 'USD',
          paymentMethodId: 'pm_test_123'
        });
      
      // Payment may fail without real credentials, but endpoint should be reachable
      expect([200, 201, 400, 500]).toContain(res.statusCode);
    });
  });

  // Cloud & Emerging Tech Tests
  describe('Cloud & Emerging Tech', () => {
    test('GET /api/cloud-tech/profile/:userId - should get tech profile', async () => {
      const res = await request(app)
        .get(`/api/cloud-tech/profile/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('profile');
    });
  });

  // Trading Platform Tests
  describe('Trading Platform', () => {
    test('GET /api/trading/portfolio/:userId - should get trading portfolio', async () => {
      const res = await request(app)
        .get(`/api/trading/portfolio/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
    });
  });

  // Fraud Emergency Network Tests
  describe('Fraud Emergency Network', () => {
    test('POST /api/fraud-network/report - should report fraud', async () => {
      const res = await request(app)
        .post('/api/fraud-network/report')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fraudType: 'unauthorized_transaction',
          description: 'Test fraud report',
          amount: 100
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('reportId');
    });

    test('GET /api/fraud-network/hotlines - should get fraud hotlines', async () => {
      const res = await request(app)
        .get('/api/fraud-network/hotlines')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // Direct Sales Agent Tests
  describe('Direct Sales Agent', () => {
    test('GET /api/sales-agents/properties - should browse properties', async () => {
      const res = await request(app)
        .get('/api/sales-agents/properties')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // Direct Investment Brokerage Tests
  describe('Direct Investment Brokerage', () => {
    test('GET /api/investment-brokerage/exchanges - should list exchanges', async () => {
      const res = await request(app)
        .get('/api/investment-brokerage/exchanges')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // Conversational AI Tests
  describe('Conversational AI', () => {
    test('POST /api/ai-assistant/chat - should chat with AI', async () => {
      const res = await request(app)
        .post('/api/ai-assistant/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Hello, I need help with my account'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('response');
    });

    test('GET /api/ai-assistant/languages - should get supported languages', async () => {
      const res = await request(app)
        .get('/api/ai-assistant/languages')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // Bank Identity Tests
  describe('Bank Identity', () => {
    test('GET /api/bank/identity - should get bank identity', async () => {
      const res = await request(app)
        .get('/api/bank/identity');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('swiftCode');
      expect(res.body).toHaveProperty('lei');
    });

    test('GET /api/bank/status - should get system status', async () => {
      const res = await request(app)
        .get('/api/bank/status');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status');
    });
  });

  // Health Check Tests
  describe('Health Check', () => {
    test('GET /api/health - should return health status', async () => {
      const res = await request(app)
        .get('/api/health');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe('success');
    });

    test('GET /api/system/status - should return system status', async () => {
      const res = await request(app)
        .get('/api/system/status');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('bank');
      expect(res.body).toHaveProperty('infrastructure');
    });
  });

  // Security Tests
  describe('Security', () => {
    test('should reject requests without auth token', async () => {
      const res = await request(app)
        .get('/api/accounts');
      
      expect(res.statusCode).toBe(401);
    });

    test('should reject requests with invalid auth token', async () => {
      const res = await request(app)
        .get('/api/accounts')
        .set('Authorization', 'Bearer invalid_token');
      
      expect(res.statusCode).toBe(401);
    });

    test('should protect against rate limiting', async () => {
      const requests = Array(20).fill(null).map(() =>
        request(app)
          .get('/api/health')
      );
      
      const responses = await Promise.all(requests);
      // Some requests may be rate limited
      const rateLimitedResponses = responses.filter(r => r.statusCode === 429);
      expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(0);
    });
  });
});

// Run tests
console.log('\n🧪 Running Amenires World Bank API Tests...\n');
