const DirectInvestmentBrokerage = require('../models/DirectInvestmentBrokerage');

class DirectInvestmentBrokerageController {
  // Get investment account
  async getInvestmentAccount(req, res) {
    try {
      const { userId } = req.params;

      const account = await DirectInvestmentBrokerage.findOne({ userId });
      if (!account) {
        return res.status(404).json({ error: 'Investment account not found' });
      }

      res.json({ account });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching investment account',
        details: error.message
      });
    }
  }

  // Update investment goals
  async updateInvestmentGoals(req, res) {
    try {
      const { userId } = req.params;
      const { investmentGoals, preferredSectors, riskTolerance } = req.body;

      const account = await DirectInvestmentBrokerage.findOne({ userId });
      if (!account) {
        return res.status(404).json({ error: 'Investment account not found' });
      }

      if (investmentGoals) account.investmentAccount.investmentGoals = investmentGoals;
      if (preferredSectors) account.investmentAccount.preferredSectors = preferredSectors;
      if (riskTolerance) account.investmentAccount.riskTolerance = riskTolerance;

      await account.save();

      res.json({
        message: 'Investment goals updated',
        investmentAccount: account.investmentAccount
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error updating investment goals',
        details: error.message
      });
    }
  }

  // Get holdings
  async getHoldings(req, res) {
    try {
      const { userId } = req.params;
      const { type, sector } = req.query;

      const account = await DirectInvestmentBrokerage.findOne({ userId });
      if (!account) {
        return res.status(404).json({ error: 'Investment account not found' });
      }

      let holdings = account.holdings;

      if (type) {
        holdings = holdings.filter(h => h.type === type);
      }
      if (sector) {
        holdings = holdings.filter(h => h.sector === sector);
      }

      const summary = {
        totalHoldings: holdings.length,
        totalValue: holdings.reduce((sum, h) => sum + h.marketValue, 0),
        totalGainLoss: holdings.reduce((sum, h) => sum + h.unrealizedGainLoss, 0),
        topGainers: holdings.filter(h => h.unrealizedGainLossPercent > 0)
          .sort((a, b) => b.unrealizedGainLossPercent - a.unrealizedGainLossPercent)
          .slice(0, 5),
        topLosers: holdings.filter(h => h.unrealizedGainLossPercent < 0)
          .sort((a, b) => a.unrealizedGainLossPercent - b.unrealizedGainLossPercent)
          .slice(0, 5)
      };

      res.json({
        holdings,
        summary
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching holdings',
        details: error.message
      });
    }
  }

  // Get performance report
  async getPerformanceReport(req, res) {
    try {
      const { userId } = req.params;
      const { period } = req.query;

      const account = await DirectInvestmentBrokerage.findOne({ userId });
      if (!account) {
        return res.status(404).json({ error: 'Investment account not found' });
      }

      const performance = {
        totalDeposits: account.performance.totalDeposits || 0,
        totalWithdrawals: account.performance.totalWithdrawals || 0,
        totalReturn: account.performance.totalReturn || 0,
        totalReturnPercent: account.performance.totalReturnPercent || 0,
        annualizedReturn: account.performance.annualizedReturn || 0,
        sharpeRatio: account.performance.sharpeRatio || 0,
        maxDrawdown: account.performance.maxDrawdown || 0,
        volatility: account.performance.volatility || 0,
        benchmarkReturn: account.performance.benchmarkReturn || 0,
        benchmarkReturnPercent: account.performance.benchmarkReturnPercent || 0
      };

      res.json({ performance });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching performance report',
        details: error.message
      });
    }
  }

  // Get dividends
  async getDividends(req, res) {
    try {
      const { userId } = req.params;
      const { year } = req.query;

      const account = await DirectInvestmentBrokerage.findOne({ userId });
      if (!account) {
        return res.status(404).json({ error: 'Investment account not found' });
      }

      let dividends = account.dividends;

      if (year) {
        dividends = dividends.filter(d => new Date(d.payDate).getFullYear() === parseInt(year));
      }

      const summary = {
        totalDividends: dividends.reduce((sum, d) => sum + d.amount, 0),
        totalDividendsThisYear: dividends.filter(d => 
          new Date(d.payDate).getFullYear() === new Date().getFullYear()
        ).reduce((sum, d) => sum + d.amount, 0)
      };

      res.json({
        dividends: dividends.sort((a, b) => b.payDate - a.payDate),
        summary
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching dividends',
        details: error.message
      });
    }
  }

  // Create price alert
  async createPriceAlert(req, res) {
    try {
      const { userId } = req.params;
      const { symbol, type, condition, value } = req.body;

      const account = await DirectInvestmentBrokerage.findOne({ userId });
      if (!account) {
        return res.status(404).json({ error: 'Investment account not found' });
      }

      const alert = {
        alertId: `ALERT${Date.now()}`,
        type,
        symbol: symbol.toUpperCase(),
        condition,
        value,
        triggered: false,
        createdAt: new Date()
      };

      account.alerts.push(alert);
      await account.save();

      res.status(201).json({
        message: 'Price alert created',
        alert
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error creating price alert',
        details: error.message
      });
    }
  }

  // Get alerts
  async getAlerts(req, res) {
    try {
      const { userId } = req.params;
      const { triggered } = req.query;

      const account = await DirectInvestmentBrokerage.findOne({ userId });
      if (!account) {
        return res.status(404).json({ error: 'Investment account not found' });
      }

      let alerts = account.alerts;

      if (triggered !== undefined) {
        alerts = alerts.filter(a => a.triggered === (triggered === 'true'));
      }

      res.json({
        alerts: alerts.sort((a, b) => b.createdAt - a.createdAt)
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching alerts',
        details: error.message
      });
    }
  }

  // Delete alert
  async deleteAlert(req, res) {
    try {
      const { userId, alertId } = req.params;

      const account = await DirectInvestmentBrokerage.findOne({ userId });
      if (!account) {
        return res.status(404).json({ error: 'Investment account not found' });
      }

      account.alerts = account.alerts.filter(a => a.alertId !== alertId);
      await account.save();

      res.json({ message: 'Alert deleted' });
    } catch (error) {
      res.status(500).json({
        error: 'Error deleting alert',
        details: error.message
      });
    }
  }

  // Get tax information
  async getTaxInformation(req, res) {
    try {
      const { userId } = req.params;
      const { year } = req.query;

      const account = await DirectInvestmentBrokerage.findOne({ userId });
      if (!account) {
        return res.status(404).json({ error: 'Investment account not found' });
      }

      const taxYear = year || new Date().getFullYear();

      // In real implementation, calculate actual tax data
      const taxInfo = {
        year: taxYear,
        shortTermGains: account.tax.shortTermGains || 0,
        longTermGains: account.tax.longTermGains || 0,
        dividends: account.tax.dividends || 0,
        interest: account.tax.interest || 0,
        costBasis: account.tax.costBasis || 0,
        washSales: account.tax.washSales || 0
      };

      res.json({ taxInfo });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching tax information',
        details: error.message
      });
    }
  }
}

module.exports = new DirectInvestmentBrokerageController();
