/**
 * Database Index Creation Script
 * Optimizes performance for Amenires World Bank
 */

const mongoose = require('mongoose');
require('dotenv').config();

const createIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for index creation...');

    const db = mongoose.connection;

    // Users Collection
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ accountType: 1 });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ country: 1 });

    // Accounts Collection
    await db.collection('accounts').createIndex({ accountNumber: 1 }, { unique: true });
    await db.collection('accounts').createIndex({ userId: 1 });
    await db.collection('accounts').createIndex({ status: 1 });

    // Transactions Collection
    await db.collection('transactions').createIndex({ reference: 1 }, { unique: true });
    await db.collection('transactions').createIndex({ userId: 1 });
    await db.collection('transactions').createIndex({ senderAccountNumber: 1 });
    await db.collection('transactions').createIndex({ receiverAccountNumber: 1 });
    await db.collection('transactions').createIndex({ createdAt: -1 });

    // AI Management
    await db.collection('aiagents').createIndex({ agentId: 1 }, { unique: true });
    await db.collection('aiagents').createIndex({ status: 1 });

    // Fraud Network
    await db.collection('fraudalerts').createIndex({ userId: 1 });
    await db.collection('fraudalerts').createIndex({ severity: 1 });
    await db.collection('fraudalerts').createIndex({ status: 1 });

    console.log('✓ All database indexes created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Index creation failed:', error);
    process.exit(1);
  }
};

createIndexes();
