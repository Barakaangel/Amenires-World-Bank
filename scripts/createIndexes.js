const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const AccountOpening = require('../models/AccountOpening');

async function createIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ phone: 1 }, { unique: true });
    await User.collection.createIndex({ nationalId: 1 }, { unique: true });
    await User.collection.createIndex({ status: 1 });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ createdAt: -1 });
    await User.collection.createIndex({ 'accounts.accountNumber': 1 });
    console.log('✓ User indexes created');

    // Account indexes
    await Account.collection.createIndex({ accountNumber: 1 }, { unique: true });
    await Account.collection.createIndex({ userId: 1 });
    await Account.collection.createIndex({ type: 1 });
    await Account.collection.createIndex({ status: 1 });
    await Account.collection.createIndex({ balance: 1 });
    await Account.collection.createIndex({ currency: 1 });
    await Account.collection.createIndex({ createdAt: -1 });
    console.log('✓ Account indexes created');

    // Transaction indexes
    await Transaction.collection.createIndex({ reference: 1 }, { unique: true });
    await Transaction.collection.createIndex({ userId: 1 });
    await Transaction.collection.createIndex({ accountNumber: 1 });
    await Transaction.collection.createIndex({ type: 1 });
    await Transaction.collection.createIndex({ status: 1 });
    await Transaction.collection.createIndex({ amount: 1 });
    await Transaction.collection.createIndex({ createdAt: -1 });
    await Transaction.collection.createIndex({ userId: 1, createdAt: -1 });
    await Transaction.collection.createIndex({ accountNumber: 1, createdAt: -1 });
    console.log('✓ Transaction indexes created');

    // Loan indexes
    await Loan.collection.createIndex({ loanNumber: 1 }, { unique: true });
    await Loan.collection.createIndex({ userId: 1 });
    await Loan.collection.createIndex({ status: 1 });
    await Loan.collection.createIndex({ type: 1 });
    await Loan.collection.createIndex({ amount: 1 });
    await Loan.collection.createIndex({ applicationDate: -1 });
    await Loan.collection.createIndex({ status: 1, applicationDate: -1 });
    await Loan.collection.createIndex({ userId: 1, status: 1 });
    await Loan.collection.createIndex({ 'repaymentSchedule.dueDate': 1 });
    await Loan.collection.createIndex({ endDate: 1 });
    console.log('✓ Loan indexes created');

    // AccountOpening indexes
    await AccountOpening.collection.createIndex({ applicationNumber: 1 }, { unique: true });
    await AccountOpening.collection.createIndex({ userId: 1 });
    await AccountOpening.collection.createIndex({ status: 1 });
    await AccountOpening.collection.createIndex({ accountType: 1 });
    await AccountOpening.collection.createIndex({ applicationDate: -1 });
    await AccountOpening.collection.createIndex({ status: 1, applicationDate: -1 });
    console.log('✓ AccountOpening indexes created');

    // Compound indexes for common queries
    await User.collection.createIndex({ role: 1, status: 1, createdAt: -1 });
    await Transaction.collection.createIndex({ type: 1, status: 1, createdAt: -1 });
    await Loan.collection.createIndex({ type: 1, status: 1, applicationDate: -1 });
    await AccountOpening.collection.createIndex({ accountType: 1, status: 1, applicationDate: -1 });
    console.log('✓ Compound indexes created');

    // Text search indexes
    await User.collection.createIndex({ 
      name: 'text', 
      email: 'text',
      'address.city': 'text',
      'address.state': 'text'
    });
    await Transaction.collection.createIndex({ 
      description: 'text',
      'metadata.category': 'text'
    });
    console.log('✓ Text search indexes created');

    console.log('\n✅ All indexes created successfully!');
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

createIndexes();
