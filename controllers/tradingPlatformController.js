const DirectInvestmentBrokerage = require('../models/DirectInvestmentBrokerage');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');

class TradingPlatformController {
  // Create investment account
  async createInvestmentAccount(req, res) {
    try {
      const { userId } = req.params;
      const { accountType, riskTolerance, investmentGoals, preferredSectors } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let account = await DirectInvestmentBrokerage.findOne({ userId });
      if (account) {
        return res.status(400).json({ error: 'Investment account already exists' });
      }

      const accountNumber = `INV${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      account = await DirectInvestmentBrokerage.create({
        userId,
        investmentAccount: {
          accountNumber,
          accountType,
          riskTolerance,
          investmentGoals,
          preferredSectors,
          status: 'pending'
        }
      });

      res.status(201).json({
        message: 'Investment account created',
        account
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error creating investment account',
        details: error.message
      });
    }
  }

  // Place order
  async placeOrder(req, res) {
    try {
      const { userId } = req.params;
      const {
        symbol,
        type,
        side,
        quantity,
        price,
        stopPrice,
        timeInForce
      } = req.body;

      const account = await DirectInvestmentBrokerage.findOne({ userId });
      if (!account) {
        return res.status(404).json({ error: 'Investment account not found' });
      }

      if (account.investmentAccount.status !== 'active') {
        return res.status(400).json({ error: 'Account not active' });
      }

      // Calculate order amount
      const orderPrice = type === 'market' ? await this.getMarketPrice(symbol) : price;
      const totalAmount = orderPrice * quantity;
      const commission = this.calculateCommission(totalAmount);

      // Check available funds for buy orders
      if (side === 'buy') {
        if (account.investmentAccount.availableFunds < totalAmount + commission) {
          return res.status(400).json({ error: 'Insufficient funds' });
        }
      } else {
        // Check holdings for sell orders
        const holding = account.holdings.find(h => h.symbol === symbol);
        if (!holding || holding.quantity < quantity) {
          return res.status(400).json({ error: 'Insufficient holdings' });
        }
      }

      const order = {
        orderId: `ORD${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
        symbol: symbol.toUpperCase(),
        type,
        side,
        quantity,
        price: orderPrice,
        stopPrice,
        timeInForce,
        status: 'pending',
        filledQuantity: 0,
        filledPrice: 0,
        commission,
        totalAmount: totalAmount + commission,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      account.orders.push(order);

      // Execute market orders immediately
      if (type === 'market') {
        const executionResult = await this.executeOrder(account, order);
        account.orders[account.orders.length - 1] = executionResult.order;
      }

      await account.save();

      res.status(201).json({
        message: 'Order placed successfully',
        order: account.orders[account.orders.length - 1]
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error placing order',
        details: error.message
      });
    }
  }

  // Get portfolio
  async getPortfolio(req, res) {
    try {
      const { userId } = req.params;

      const account = await DirectInvestmentBrokerage.findOne({ userId });
      if (!account) {
        return res.status(404).json({ error: 'Investment account not found' });
      }

      // Update market prices
      await this.updateMarketPrices(account);
      await account.save();

      const portfolio = {
        accountNumber: account.investmentAccount.accountNumber,
        balance: account.investmentAccount.balance,
        availableFunds: account.investmentAccount.availableFunds,
        buyingPower: account.investmentAccount.buyingPower,
        holdings: account.holdings,
        totalValue: account.holdings.reduce((sum, h) => sum + h.marketValue, 0),
        totalGainLoss: account.holdings.reduce((sum, h) => sum + h.unrealizedGainLoss, 0),
        totalGainLossPercent: this.calculateOverallReturn(account),
        assetAllocation: account.analytics.assetAllocation,
        sectorAllocation: account.analytics.sectorAllocation
      };

      res.json({ portfolio });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching portfolio',
        details: error.message
      });
    }
  }

  // Add to watchlist
  async addToWatchlist(req, res) {
    try {
      const { userId } = req.params;
      const { symbol, notes } = req.body;

      const account = await DirectInvestmentBrokerage.findOne({ userId });
      if (!account) {
        return res.status(404).json({ error: 'Investment account not found' });
      }

      // Check if already in watchlist
      const existing = account.watchlist.find(w => w.symbol.toUpperCase() === symbol.toUpperCase());
      if (existing) {
        return res.status(400).json({ error: 'Already in watchlist' });
      }

      const marketData = await this.getMarketData(symbol);

      account.watchlist.push({
        symbol: symbol.toUpperCase(),
        name: marketData.name || symbol,
        type: marketData.type || 'stock',
        currentPrice: marketData.price || 0,
        change: marketData.change || 0,
        changePercent: marketData.changePercent || 0,
        addedAt: new Date(),
        notes
      });

      await account.save();

      res.json({
        message: 'Added to watchlist',
        item: account.watchlist[account.watchlist.length - 1]
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error adding to watchlist',
        details: error.message
      });
    }
  }

  // Get watchlist
  async getWatchlist(req, res) {
    try {
      const { userId } = req.params;

      const account = await DirectInvestmentBrokerage.findOne({ userId });
      if (!account) {
        return res.status(404).json({ error: 'Investment account not found' });
      }

      // Update prices
      for (let item of account.watchlist) {
        const marketData = await this.getMarketData(item.symbol);
        item.currentPrice = marketData.price;
        item.change = marketData.change;
        item.changePercent = marketData.changePercent;
      }

      await account.save();

      res.json({ watchlist: account.watchlist });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching watchlist',
        details: error.message
      });
    }
  }

  // Get order history
  async getOrderHistory(req, res) {
    try {
      const { userId } = req.params;
      const { status, symbol, limit = 50 } = req.query;

      const account = await DirectInvestmentBrokerage.findOne({ userId });
      if (!account) {
        return res.status(404).json({ error: 'Investment account not found' });
      }

      let orders = account.orders;

      if (status) {
        orders = orders.filter(o => o.status === status);
      }
      if (symbol) {
        orders = orders.filter(o => o.symbol === symbol.toUpperCase());
      }

      orders = orders
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, parseInt(limit));

      res.json({ orders });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching order history',
        details: error.message
      });
    }
  }

  // Get market data
  async getMarketData(req, res) {
    try {
      const { symbol } = req.params;

      const marketData = await this.getMarketDataInternal(symbol);

      res.json(marketData);
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching market data',
        details: error.message
      });
    }
  }

  // Deposit funds
  async depositFunds(req, res) {
    try {
      const { userId } = req.params;
      const { amount } = req.body;

      const account = await DirectInvestmentBrokerage.findOne({ userId });
      if (!account) {
        return res.status(404).json({ error: 'Investment account not found' });
      }

      account.investmentAccount.balance += amount;
      account.investmentAccount.availableFunds += amount;
      account.investmentAccount.buyingPower = this.calculateBuyingPower(account);
      account.performance.totalDeposits = (account.performance.totalDeposits || 0) + amount;

      await account.save();

      // Create transaction record
      await Transaction.create({
        userId,
        type: 'deposit',
        amount,
        description: 'Deposit to investment account',
        reference: `TXN${Date.now()}`,
        status: 'completed'
      });

      res.json({
        message: 'Funds deposited successfully',
        balance: account.investmentAccount.balance,
        availableFunds: account.investmentAccount.availableFunds
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error depositing funds',
        details: error.message
      });
    }
  }

  // Withdraw funds
  async withdrawFunds(req, res) {
    try {
      const { userId } = req.params;
      const { amount } = req.body;

      const account = await DirectInvestmentBrokerage.findOne({ userId });
      if (!account) {
        return res.status(404).json({ error: 'Investment account not found' });
      }

      if (account.investmentAccount.availableFunds < amount) {
        return res.status(400).json({ error: 'Insufficient available funds' });
      }

      account.investmentAccount.balance -= amount;
      account.investmentAccount.availableFunds -= amount;
      account.investmentAccount.buyingPower = this.calculateBuyingPower(account);
      account.performance.totalWithdrawals = (account.performance.totalWithdrawals || 0) + amount;

      await account.save();

      // Create transaction record
      await Transaction.create({
        userId,
        type: 'withdrawal',
        amount,
        description: 'Withdrawal from investment account',
        reference: `TXN${Date.now()}`,
        status: 'completed'
      });

      res.json({
        message: 'Funds withdrawn successfully',
        balance: account.investmentAccount.balance,
        availableFunds: account.investmentAccount.availableFunds
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error withdrawing funds',
        details: error.message
      });
    }
  }

  // Helper methods
  async getMarketPrice(symbol) {
    // In real implementation, integrate with market data API
    // Returning simulated prices
    const prices = {
      'AAPL': 178.50,
      'GOOGL': 142.30,
      'MSFT': 378.90,
      'AMZN': 178.25,
      'TSLA': 248.50,
      'META': 505.75,
      'NVDA': 875.30
    };
    return prices[symbol.toUpperCase()] || 100 + Math.random() * 50;
  }

  async getMarketDataInternal(symbol) {
    const price = await this.getMarketPrice(symbol);
    return {
      symbol: symbol.toUpperCase(),
      name: `${symbol.toUpperCase()} Corp`,
      type: 'stock',
      price,
      change: price * (Math.random() * 0.1 - 0.05),
      changePercent: (Math.random() * 10 - 5),
      volume: Math.floor(Math.random() * 10000000),
      marketCap: Math.floor(Math.random() * 1000000000000),
      pe: 20 + Math.random() * 30,
      high: price * 1.05,
      low: price * 0.95,
      open: price * 0.98
    };
  }

  calculateCommission(amount) {
    return Math.max(4.95, amount * 0.0095); // Minimum $4.95 or 0.95%
  }

  async executeOrder(account, order) {
    // Simulate order execution
    order.status = 'filled';
    order.filledQuantity = order.quantity;
    order.filledPrice = order.price;
    order.filledAt = new Date();

    const totalCost = order.filledPrice * order.filledQuantity;

    if (order.side === 'buy') {
      // Update holdings
      let holding = account.holdings.find(h => h.symbol === order.symbol);
      if (!holding) {
        holding = {
          symbol: order.symbol,
          name: order.symbol,
          type: 'stock',
          quantity: 0,
          averageCost: 0,
          currentPrice: order.price,
          marketValue: 0,
          unrealizedGainLoss: 0,
          unrealizedGainLossPercent: 0,
          sector: 'Technology',
          exchange: 'NASDAQ',
          purchasedAt: new Date(),
          lastUpdated: new Date()
        };
        account.holdings.push(holding);
      }

      const newQuantity = holding.quantity + order.filledQuantity;
      holding.averageCost = ((holding.averageCost * holding.quantity) + totalCost) / newQuantity;
      holding.quantity = newQuantity;
      holding.currentPrice = order.price;
      holding.lastUpdated = new Date();

      // Deduct from available funds
      account.investmentAccount.availableFunds -= (totalCost + order.commission);
    } else {
      // Sell
      const holding = account.holdings.find(h => h.symbol === order.symbol);
      if (holding) {
        holding.quantity -= order.filledQuantity;
        holding.currentPrice = order.price;
        holding.lastUpdated = new Date();

        // Add to available funds
        account.investmentAccount.availableFunds += (totalCost - order.commission);

        // Remove holding if quantity is 0
        if (holding.quantity <= 0) {
          account.holdings = account.holdings.filter(h => h.symbol !== order.symbol);
        }
      }
    }

    account.investmentAccount.buyingPower = this.calculateBuyingPower(account);
    await this.updatePerformance(account);

    return { order };
  }

  calculateBuyingPower(account) {
    // Simple calculation: available funds + margin (if enabled)
    return account.investmentAccount.availableFunds;
  }

  async updateMarketPrices(account) {
    for (let holding of account.holdings) {
      const currentPrice = await this.getMarketPrice(holding.symbol);
      holding.currentPrice = currentPrice;
      holding.marketValue = holding.quantity * currentPrice;
      holding.unrealizedGainLoss = (currentPrice - holding.averageCost) * holding.quantity;
      holding.unrealizedGainLossPercent = ((currentPrice - holding.averageCost) / holding.averageCost) * 100;
      holding.lastUpdated = new Date();
    }

    // Update analytics
    account.analytics.assetAllocation = this.calculateAssetAllocation(account);
    account.analytics.sectorAllocation = this.calculateSectorAllocation(account);
  }

  calculateAssetAllocation(account) {
    const allocation = {};
    const totalValue = account.holdings.reduce((sum, h) => sum + h.marketValue, 0);

    account.holdings.forEach(h => {
      if (!allocation[h.type]) {
        allocation[h.type] = { value: 0, percentage: 0 };
      }
      allocation[h.type].value += h.marketValue;
    });

    Object.keys(allocation).forEach(key => {
      allocation[key].percentage = (allocation[key].value / totalValue) * 100;
    });

    return allocation;
  }

  calculateSectorAllocation(account) {
    const allocation = {};
    const totalValue = account.holdings.reduce((sum, h) => sum + h.marketValue, 0);

    account.holdings.forEach(h => {
      if (!allocation[h.sector]) {
        allocation[h.sector] = { value: 0, percentage: 0 };
      }
      allocation[h.sector].value += h.marketValue;
    });

    Object.keys(allocation).forEach(key => {
      allocation[key].percentage = (allocation[key].value / totalValue) * 100;
    });

    return allocation;
  }

  calculateOverallReturn(account) {
    const totalCost = account.holdings.reduce((sum, h) => sum + (h.quantity * h.averageCost), 0);
    const totalValue = account.holdings.reduce((sum, h) => sum + h.marketValue, 0);
    return totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
  }

  async updatePerformance(account) {
    const totalValue = account.holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const totalCost = account.performance.totalDeposits || 0;
    const withdrawals = account.performance.totalWithdrawals || 0;

    account.performance.totalReturn = totalValue - (totalCost - withdrawals);
    account.performance.totalReturnPercent = totalCost > 0
      ? (account.performance.totalReturn / totalCost) * 100
      : 0;
    account.performance.lastUpdated = new Date();
  }
}

module.exports = new TradingPlatformController();
