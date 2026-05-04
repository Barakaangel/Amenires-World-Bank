const PaymentInfrastructure = require('../models/PaymentInfrastructure');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');

class PaymentInfrastructureController {
  // Add payment method
  async addPaymentMethod(req, res) {
    try {
      const { userId } = req.params;
      const { type, provider, details, isDefault } = req.body;

      let profile = await PaymentInfrastructure.findOne({ userId });
      if (!profile) {
        profile = await PaymentInfrastructure.create({ userId });
      }

      const paymentMethod = {
        id: `PM${Date.now()}${crypto.randomBytes(2).toString('hex')}`,
        type,
        provider,
        details,
        isDefault: isDefault || profile.paymentMethods.length === 0,
        isVerified: type === 'bank_transfer' || type === 'digital_wallet',
        createdAt: new Date()
      };

      // Remove default from other methods if this is set as default
      if (paymentMethod.isDefault) {
        profile.paymentMethods.forEach(pm => pm.isDefault = false);
      }

      profile.paymentMethods.push(paymentMethod);
      await profile.save();

      res.status(201).json({
        message: 'Payment method added successfully',
        paymentMethod
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error adding payment method',
        details: error.message
      });
    }
  }

  // Get all payment methods
  async getPaymentMethods(req, res) {
    try {
      const { userId } = req.params;

      const profile = await PaymentInfrastructure.findOne({ userId });
      
      if (!profile) {
        return res.json({ paymentMethods: [] });
      }

      const paymentMethods = profile.paymentMethods.map(pm => ({
        id: pm.id,
        type: pm.type,
        provider: pm.provider,
        isDefault: pm.isDefault,
        isVerified: pm.isVerified,
        details: {
          last4: pm.details.last4,
          expiryMonth: pm.details.expiryMonth,
          expiryYear: pm.details.expiryYear,
          brand: pm.details.brand,
          bankName: pm.details.bankName,
          phoneNumber: pm.details.phoneNumber,
          email: pm.details.email
        },
        createdAt: pm.createdAt,
        lastUsed: pm.lastUsed
      }));

      res.json({ paymentMethods });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching payment methods',
        details: error.message
      });
    }
  }

  // Process payment from any platform
  async processPayment(req, res) {
    try {
      const { userId } = req.params;
      const {
        amount,
        currency,
        paymentMethodId,
        receiverDetails,
        description,
        category
      } = req.body;

      const profile = await PaymentInfrastructure.findOne({ userId });
      if (!profile) {
        return res.status(404).json({ error: 'Payment profile not found' });
      }

      const paymentMethod = profile.paymentMethods.find(pm => pm.id === paymentMethodId);
      if (!paymentMethod) {
        return res.status(404).json({ error: 'Payment method not found' });
      }

      if (!paymentMethod.isVerified) {
        return res.status(400).json({ error: 'Payment method not verified' });
      }

      // Check compliance limits
      const usage = profile.compliance.currentUsage;
      const limits = profile.compliance.limits;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);

      // Calculate current usage (simplified)
      const recentTransactions = profile.transactions.filter(t => t.createdAt >= today);
      const todayTotal = recentTransactions.reduce((sum, t) => sum + t.amount, 0);

      if (limits.daily && todayTotal + amount > limits.daily) {
        return res.status(400).json({ error: 'Daily limit exceeded' });
      }

      // Calculate fee
      const fee = this.calculateFee(paymentMethod.type, amount);
      const totalAmount = amount + fee;

      // Create transaction
      const transaction = {
        reference: `PAY${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
        type: 'outgoing',
        amount,
        currency: currency || 'USD',
        fee,
        totalAmount,
        paymentMethodId,
        paymentMethodType: paymentMethod.type,
        sender: {
          userId,
          name: req.body.senderName || 'User'
        },
        receiver: receiverDetails,
        status: 'pending',
        description,
        category,
        createdAt: new Date()
      };

      // Process through platform
      const platformResult = await this.processThroughPlatform(
        paymentMethod,
        transaction,
        profile
      );

      if (platformResult.success) {
        transaction.status = 'completed';
        transaction.completedAt = new Date();
        transaction.platform = platformResult.platform;

        // Update payment method last used
        paymentMethod.lastUsed = new Date();

        // Update analytics
        profile.analytics.totalSent += amount;
        profile.analytics.totalFees += fee;
        profile.analytics.transactionCount++;
      } else {
        transaction.status = 'failed';
        return res.status(400).json({
          error: 'Payment processing failed',
          details: platformResult.error
        });
      }

      profile.transactions.push(transaction);
      await profile.save();

      // Also create transaction record
      await Transaction.create({
        userId,
        type: 'transfer',
        amount,
        description: description || 'Payment transfer',
        reference: transaction.reference,
        status: transaction.status,
        metadata: {
          paymentMethod: paymentMethod.type,
          platform: platformResult.platform?.name
        }
      });

      res.json({
        message: 'Payment processed successfully',
        transaction
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error processing payment',
        details: error.message
      });
    }
  }

  // Receive money from any platform
  async receivePayment(req, res) {
    try {
      const { userId } = req.params;
      const {
        amount,
        currency,
        senderDetails,
        platform,
        platformTransactionId,
        description
      } = req.body;

      let profile = await PaymentInfrastructure.findOne({ userId });
      if (!profile) {
        profile = await PaymentInfrastructure.create({ userId });
      }

      // Create incoming transaction
      const transaction = {
        reference: `IN${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
        type: 'incoming',
        amount,
        currency: currency || 'USD',
        fee: 0,
        totalAmount: amount,
        sender: senderDetails,
        receiver: { userId },
        status: 'completed',
        completedAt: new Date(),
        platform: {
          name: platform,
          transactionId: platformTransactionId,
          status: 'completed'
        },
        description: description || 'Incoming payment',
        createdAt: new Date()
      };

      profile.transactions.push(transaction);

      // Update analytics
      profile.analytics.totalReceived += amount;
      profile.analytics.transactionCount++;
      profile.analytics.successRate = this.calculateSuccessRate(profile);

      // Add to wallet if currency exists
      let wallet = profile.wallets.find(w => w.currency === currency);
      if (!wallet) {
        profile.wallets.push({
          currency: currency || 'USD',
          balance: amount,
          lockedBalance: 0,
          exchangeRate: 1,
          lastUpdated: new Date()
        });
      } else {
        wallet.balance += amount;
        wallet.lastUpdated = new Date();
      }

      await profile.save();

      // Credit to user account
      const userAccount = await Account.findOne({ userId });
      if (userAccount) {
        userAccount.balance += amount;
        await userAccount.save();
      }

      // Create transaction record
      await Transaction.create({
        userId,
        type: 'deposit',
        amount,
        description: description || `Payment from ${senderDetails.name}`,
        reference: transaction.reference,
        status: 'completed',
        metadata: {
          platform,
          platformTransactionId
        }
      });

      res.status(201).json({
        message: 'Payment received successfully',
        transaction,
        wallet: profile.wallets.find(w => w.currency === (currency || 'USD'))
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error receiving payment',
        details: error.message
      });
    }
  }

  // Set up platform integration
  async setupPlatformIntegration(req, res) {
    try {
      const { userId } = req.params;
      const { platform, accountId, accessToken, webhookSecret } = req.body;

      const profile = await PaymentInfrastructure.findOne({ userId });
      if (!profile) {
        return res.status(404).json({ error: 'Payment profile not found' });
      }

      const integration = {
        platform,
        accountId,
        accessToken,
        webhookSecret,
        enabled: true,
        capabilities: this.getPlatformCapabilities(platform),
        lastSync: new Date()
      };

      // Remove existing integration for same platform
      profile.platformIntegrations = profile.platformIntegrations.filter(
        i => i.platform !== platform
      );

      profile.platformIntegrations.push(integration);
      await profile.save();

      res.json({
        message: 'Platform integration set up successfully',
        integration
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error setting up platform integration',
        details: error.message
      });
    }
  }

  // Get payment analytics
  async getAnalytics(req, res) {
    try {
      const { userId } = req.params;
      const { period } = req.query;

      const profile = await PaymentInfrastructure.findOne({ userId });
      
      if (!profile) {
        return res.json({
          totalReceived: 0,
          totalSent: 0,
          transactionCount: 0,
          analytics: {}
        });
      }

      // Filter transactions by period
      let startDate = new Date();
      if (period === 'day') startDate.setDate(startDate.getDate() - 1);
      else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
      else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
      else startDate = new Date(0);

      const periodTransactions = profile.transactions.filter(
        t => t.createdAt >= startDate
      );

      const analytics = {
        period: period || 'all',
        totalReceived: periodTransactions
          .filter(t => t.type === 'incoming')
          .reduce((sum, t) => sum + t.amount, 0),
        totalSent: periodTransactions
          .filter(t => t.type === 'outgoing')
          .reduce((sum, t) => sum + t.amount, 0),
        totalFees: periodTransactions.reduce((sum, t) => sum + (t.fee || 0), 0),
        transactionCount: periodTransactions.length,
        successRate: profile.analytics.successRate,
        averageAmount: periodTransactions.length > 0
          ? periodTransactions.reduce((sum, t) => sum + t.amount, 0) / periodTransactions.length
          : 0,
        transactionsByStatus: this.groupByStatus(periodTransactions),
        transactionsByType: this.groupByType(periodTransactions)
      };

      res.json(analytics);
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching analytics',
        details: error.message
      });
    }
  }

  // Create recurring payment
  async createRecurringPayment(req, res) {
    try {
      const { userId } = req.params;
      const {
        name,
        type,
        amount,
        currency,
        frequency,
        dayOfMonth,
        paymentMethodId,
        recipient,
        startDate,
        endDate
      } = req.body;

      const profile = await PaymentInfrastructure.findOne({ userId });
      if (!profile) {
        return res.status(404).json({ error: 'Payment profile not found' });
      }

      const nextPaymentDate = this.calculateNextPaymentDate(frequency, dayOfMonth, startDate);

      const recurringPayment = {
        id: `RP${Date.now()}`,
        name,
        type,
        amount,
        currency: currency || 'USD',
        frequency,
        dayOfMonth,
        paymentMethodId,
        recipient,
        startDate: startDate || new Date(),
        endDate,
        nextPaymentDate,
        status: 'active',
        totalPaid: 0,
        paymentCount: 0,
        createdAt: new Date()
      };

      profile.recurringPayments.push(recurringPayment);
      await profile.save();

      res.status(201).json({
        message: 'Recurring payment created',
        recurringPayment
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error creating recurring payment',
        details: error.message
      });
    }
  }

  // Helper methods
  calculateFee(type, amount) {
    const feeStructure = {
      'credit_card': { percentage: 0.029, fixed: 0.30 },
      'debit_card': { percentage: 0.019, fixed: 0.25 },
      'bank_transfer': { percentage: 0.01, fixed: 0 },
      'mobile_money': { percentage: 0.015, fixed: 0.10 },
      'digital_wallet': { percentage: 0.025, fixed: 0.20 },
      'crypto': { percentage: 0.01, fixed: 0.50 }
    };

    const fees = feeStructure[type] || { percentage: 0, fixed: 0 };
    return (amount * fees.percentage) + fees.fixed;
  }

  async processThroughPlatform(paymentMethod, transaction, profile) {
    // In real implementation, integrate with actual payment gateways
    const platform = profile.platformIntegrations.find(
      i => i.platform === paymentMethod.provider
    );

    if (platform) {
      // Simulate successful processing
      return {
        success: true,
        platform: {
          name: platform.platform,
          transactionId: `PLAT${Date.now()}`,
          status: 'completed'
        }
      };
    }

    // Default processing
    return {
      success: true,
      platform: {
        name: paymentMethod.provider,
        transactionId: `TXN${Date.now()}`,
        status: 'completed'
      }
    };
  }

  calculateSuccessRate(profile) {
    const completed = profile.transactions.filter(t => t.status === 'completed').length;
    const total = profile.transactions.length;
    return total > 0 ? (completed / total) * 100 : 100;
  }

  getPlatformCapabilities(platform) {
    const capabilities = {
      stripe: ['cards', 'bank_transfer', 'alipay'],
      paypal: ['paypal', 'cards', 'bank'],
      square: ['cards', 'bank'],
      razorpay: ['upi', 'cards', 'netbanking', 'wallet'],
      flutterwave: ['mobile_money', 'cards', 'bank'],
      mpesa: ['mobile_money'],
      gcash: ['mobile_money'],
      paytm: ['wallet', 'upi', 'cards'],
      upi: ['upi'],
      wise: ['bank_transfer'],
      revolut: ['bank_transfer', 'cards']
    };

    return capabilities[platform] || [];
  }

  calculateNextPaymentDate(frequency, dayOfMonth, startDate) {
    const date = new Date(startDate || new Date());
    
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'bi_weekly':
        date.setDate(date.getDate() + 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        if (dayOfMonth) date.setDate(dayOfMonth);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }

    return date;
  }

  groupByStatus(transactions) {
    const grouped = {};
    transactions.forEach(t => {
      grouped[t.status] = (grouped[t.status] || 0) + 1;
    });
    return grouped;
  }

  groupByType(transactions) {
    const grouped = {};
    transactions.forEach(t => {
      grouped[t.type] = (grouped[t.type] || 0) + t.amount;
    });
    return grouped;
  }
}

module.exports = new PaymentInfrastructureController();
