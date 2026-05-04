const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');

class ConversationalAIController {
  // Process user query
  async processQuery(req, res) {
    try {
      const { userId } = req.params;
      const { query, context, language } = req.body;

      const intent = await this.detectIntent(query);
      const response = await this.generateResponse(intent, userId, query, context);

      res.json({
        intent,
        response,
        suggestions: this.getSuggestions(intent),
        followUpActions: this.getFollowUpActions(intent)
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error processing query',
        details: error.message
      });
    }
  }

  // Get account balance (natural language)
  async getAccountBalance(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const balances = user.accounts.map(account => ({
        accountNumber: account.accountNumber,
        type: account.type,
        balance: account.balance,
        currency: account.currency
      }));

      const totalBalance = balances.reduce((sum, acc) => sum + acc.balance, 0);

      res.json({
        message: 'Here is your account balance',
        balances,
        totalBalance
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching balance',
        details: error.message
      });
    }
  }

  // Get transaction history (natural language)
  async getTransactionHistory(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 10, type, startDate, endDate } = req.query;

      const filter = { userId };
      if (type) filter.type = type;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const transactions = await Transaction.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      const summary = {
        totalDeposits: transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
        totalWithdrawals: transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0),
        totalTransfers: transactions.filter(t => t.type === 'transfer').reduce((sum, t) => sum + t.amount, 0)
      };

      res.json({
        message: `Here are your recent transactions`,
        transactions,
        summary
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching transactions',
        details: error.message
      });
    }
  }

  // Get loan information
  async getLoanInfo(req, res) {
    try {
      const { userId } = req.params;

      const loans = await Loan.find({ userId })
        .sort({ applicationDate: -1 });

      const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');
      const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.balanceDue, 0);
      const nextPayment = activeLoans.sort((a, b) => 
        a.repaymentSchedule.find(r => r.status === 'pending')?.dueDate -
        b.repaymentSchedule.find(r => r.status === 'pending')?.dueDate
      )[0];

      res.json({
        message: 'Here is your loan information',
        totalLoans: loans.length,
        activeLoans: activeLoans.length,
        totalOutstanding,
        nextPayment: nextPayment ? {
          amount: nextPayment.monthlyPayment,
          dueDate: nextPayment.repaymentSchedule.find(r => r.status === 'pending')?.dueDate
        } : null,
        loans: loans.slice(0, 5)
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching loan information',
        details: error.message
      });
    }
  }

  // Initiate money transfer via chat
  async initiateTransfer(req, res) {
    try {
      const { userId } = req.params;
      const { recipient, amount, accountType, description } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const account = user.accounts.find(a => a.type === accountType);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      if (account.balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Create transaction
      const transaction = await Transaction.create({
        userId,
        accountNumber: account.accountNumber,
        type: 'transfer',
        amount,
        description: description || `Transfer to ${recipient}`,
        reference: `TXN${Date.now()}`,
        status: 'completed',
        metadata: { recipient }
      });

      // Update balance
      account.balance -= amount;
      await user.save();

      res.json({
        message: `Transfer of $${amount} to ${recipient} completed successfully`,
        transaction
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error initiating transfer',
        details: error.message
      });
    }
  }

  // Get help and FAQs
  async getHelp(req, res) {
    try {
      const { topic } = req.query;

      const helpContent = this.getHelpContent(topic);

      res.json({
        message: 'Here is the information you requested',
        topic: topic || 'general',
        content: helpContent,
        commonQuestions: this.getCommonQuestions(topic)
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching help',
        details: error.message
      });
    }
  }

  // Chat context management
  async saveContext(req, res) {
    try {
      const { userId } = req.params;
      const { context } = req.body;

      // In real implementation, save context to database or session
      res.json({
        message: 'Context saved',
        contextId: `CTX${Date.now()}`
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error saving context',
        details: error.message
      });
    }
  }

  // Helper methods
  async detectIntent(query) {
    const lowerQuery = query.toLowerCase();

    // Simple keyword-based intent detection
    if (lowerQuery.includes('balance') || lowerQuery.includes('how much')) {
      return 'get_balance';
    } else if (lowerQuery.includes('transaction') || lowerQuery.includes('history') || lowerQuery.includes('recent')) {
      return 'get_transactions';
    } else if (lowerQuery.includes('loan') || lowerQuery.includes('borrow')) {
      return 'get_loans';
    } else if (lowerQuery.includes('transfer') || lowerQuery.includes('send money') || lowerQuery.includes('pay')) {
      return 'transfer_money';
    } else if (lowerQuery.includes('help') || lowerQuery.includes('how to')) {
      return 'get_help';
    } else if (lowerQuery.includes('account') || lowerQuery.includes('open')) {
      return 'account_info';
    } else if (lowerQuery.includes('card') || lowerQuery.includes('debit') || lowerQuery.includes('credit')) {
      return 'card_info';
    } else if (lowerQuery.includes('invest') || lowerQuery.includes('trade') || lowerQuery.includes('stock')) {
      return 'investment_info';
    } else {
      return 'general_query';
    }
  }

  async generateResponse(intent, userId, query, context) {
    const responses = {
      'get_balance': 'I can help you check your account balance. Which account would you like to check?',
      'get_transactions': `Here are your recent transactions. Would you like to see more details or filter by type?`,
      'get_loans': 'I can provide information about your loans. Do you want to see your active loans, payment schedule, or check eligibility for a new loan?',
      'transfer_money': 'To initiate a transfer, I\'ll need some details: recipient, amount, and which account to use. Would you like to proceed?',
      'get_help': 'I can help you with various topics. What would you like to know?',
      'account_info': 'I can provide information about your accounts. What specific information do you need?',
      'card_info': 'I can help you with card-related queries. What would you like to know about your cards?',
      'investment_info': 'I can provide investment information. Are you interested in viewing your portfolio, checking market data, or placing orders?',
      'general_query': 'I understand you have a query. Could you please provide more details so I can assist you better?'
    };

    return responses[intent] || responses['general_query'];
  }

  getSuggestions(intent) {
    const suggestions = {
      'get_balance': ['Show all balances', 'Checking account balance', 'Savings account balance'],
      'get_transactions': ['Last 10 transactions', 'This month\'s transactions', 'Deposits only', 'Withdrawals only'],
      'get_loans': ['Active loans', 'Payment schedule', 'Apply for new loan'],
      'transfer_money': ['Transfer to saved payee', 'New recipient', 'Schedule transfer'],
      'get_help': ['Account management', 'Security', 'Payments & transfers', 'Loans'],
      'account_info': ['Account details', 'Account statement', 'Change account settings'],
      'card_info': ['Card details', 'Block card', 'Request new card'],
      'investment_info': ['Portfolio summary', 'Watchlist', 'Place order'],
      'general_query': ['Account balance', 'Recent transactions', 'Help & support']
    };

    return suggestions[intent] || suggestions['general_query'];
  }

  getFollowUpActions(intent) {
    const actions = {
      'get_balance': [
        { action: 'view_transactions', label: 'View Transactions' },
        { action: 'transfer_money', label: 'Transfer Money' }
      ],
      'get_transactions': [
        { action: 'download_statement', label: 'Download Statement' },
        { action: 'search_transactions', label: 'Search Transactions' }
      ],
      'get_loans': [
        { action: 'make_payment', label: 'Make Payment' },
        { action: 'apply_loan', label: 'Apply for Loan' }
      ],
      'transfer_money': [
        { action: 'saved_payees', label: 'Saved Payees' },
        { action: 'schedule_transfer', label: 'Schedule Transfer' }
      ],
      'get_help': [
        { action: 'contact_support', label: 'Contact Support' },
        { action: 'faq', label: 'FAQ' }
      ],
      'account_info': [
        { action: 'account_settings', label: 'Account Settings' },
        { action: 'documents', label: 'Documents' }
      ],
      'card_info': [
        { action: 'card_limits', label: 'Card Limits' },
        { action: 'block_card', label: 'Block Card' }
      ],
      'investment_info': [
        { action: 'portfolio', label: 'View Portfolio' },
        { action: 'market_data', label: 'Market Data' }
      ],
      'general_query': [
        { action: 'help', label: 'Help' },
        { action: 'support', label: 'Contact Support' }
      ]
    };

    return actions[intent] || actions['general_query'];
  }

  getHelpContent(topic) {
    const helpContents = {
      'balance': 'To check your balance, say "What\'s my balance" or "How much money do I have?"',
      'transfer': 'To transfer money, say "Transfer $100 to John" or "Send money to 1234567890"',
      'loan': 'To apply for a loan, say "I want to apply for a loan" or "Check my loan eligibility"',
      'card': 'To manage your card, say "Block my card" or "Get card details"',
      'investment': 'To check investments, say "Show my portfolio" or "What\'s AAPL trading at?"',
      'security': 'To secure your account, say "Enable 2FA" or "Change password"',
      'general': 'I can help you with account balance, transactions, loans, transfers, and more. Just ask me anything!'
    };

    return helpContents[topic] || helpContents['general'];
  }

  getCommonQuestions(topic) {
    const questions = {
      'balance': ['What\'s my balance?', 'How much is in my checking account?', 'Show me all my accounts'],
      'transfer': ['How do I transfer money?', 'Transfer to a new recipient', 'What\'s my transfer limit?'],
      'loan': ['What\'s my loan balance?', 'When is my next payment?', 'How much can I borrow?'],
      'card': ['Block my card', 'Get card details', 'What\'s my card limit?'],
      'investment': ['Show my portfolio', 'What are my top performers?', 'How to place an order?'],
      'security': ['How to enable 2FA?', 'Change my password', 'Recent login attempts'],
      'general': ['Check balance', 'Recent transactions', 'Transfer money', 'Apply for loan']
    };

    return questions[topic] || questions['general'];
  }
}

module.exports = new ConversationalAIController();
