/**
 * Complete Professional Banking Server
 * Amenires World Bank - Full Feature Banking System
 * Includes all banking features: transfers, deposits, withdrawals, bills, loans, cards, investments
 */

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage (replace with MongoDB in production)
const users = [];
const accounts = [];
const transactions = [];
const transfers = [];
const deposits = [];
const withdrawals = [];
const bills = [];
const cards = [];
const loans = [];
const investments = [];
const savingsGoals = [];
const notifications = [];

// Rate limiting storage
const rateLimiter = new Map();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));

// Security middleware - Rate limiting
const rateLimiterMiddleware = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  if (rateLimiter.has(ip)) {
    const data = rateLimiter.get(ip);
    if (now - data.timestamp < windowMs) {
      if (data.count >= maxRequests) {
        return res.status(429).json({ 
          success: false, 
          message: 'Too many requests. Please try again later.' 
        });
      }
      data.count++;
    } else {
      data.count = 1;
      data.timestamp = now;
    }
  } else {
    rateLimiter.set(ip, { count: 1, timestamp: now });
  }

  next();
};

app.use(rateLimiterMiddleware);

// Helper Functions
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { id: userId, email, role },
    process.env.JWT_SECRET || 'amenires-secret-key-2024',
    { expiresIn: '24h' }
  );
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'amenires-secret-key-2024');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const generateAccountNumber = () => {
  return 'AWB' + crypto.randomBytes(6).toString('hex').toUpperCase();
};

const generateCardNumber = () => {
  return '4' + Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('');
};

const generateCVV = () => {
  return Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)).join('');
};

const logActivity = (userId, activity, details = {}) => {
  console.log(`[Activity] User ${userId}: ${activity}`, details);
};

// ================== AUTHENTICATION ROUTES ==================

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { fullName, firstName, lastName, email, password, phone, country, accountType, currency, dateOfBirth, address } = req.body;

    // Handle both fullName and firstName/lastName formats
    let userFirstName = firstName;
    let userLastName = lastName;
    
    if (fullName && !firstName) {
      const nameParts = fullName.split(' ');
      userFirstName = nameParts[0] || fullName;
      userLastName = nameParts.slice(1).join(' ') || '';
    }

    // Validation
    if (!userFirstName || !userLastName || !email || !password || !country) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, and country'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if user exists
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please login or use a different email.'
      });
    }

    // Create user
    const userId = crypto.randomBytes(8).toString('hex');
    const newUser = {
      id: userId,
      firstName: userFirstName,
      lastName: userLastName,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      country,
      accountType: accountType || 'individual',
      currency: currency || 'USD',
      role: 'customer',
      isActive: true,
      isVerified: false,
      dateOfBirth: dateOfBirth || null,
      address: address || '',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      twoFactorEnabled: false,
      securityQuestions: []
    };

    users.push(newUser);
    logActivity(userId, 'Account created', { email });

    // Create checking account
    const checkingAccount = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: userId,
      accountNumber: generateAccountNumber(),
      type: 'checking',
      balance: 10000.00, // Welcome bonus
      currency: currency || 'USD',
      status: 'active',
      isPrimary: true,
      createdAt: new Date().toISOString()
    };
    accounts.push(checkingAccount);

    // Create savings account
    const savingsAccount = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: userId,
      accountNumber: generateAccountNumber(),
      type: 'savings',
      balance: 0.00,
      currency: currency || 'USD',
      status: 'active',
      isPrimary: false,
      interestRate: 2.5,
      createdAt: new Date().toISOString()
    };
    accounts.push(savingsAccount);

    // Create debit card
    const debitCard = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: userId,
      accountId: checkingAccount.id,
      cardNumber: generateCardNumber(),
      cardHolder: `${userFirstName} ${userLastName}`,
      cvv: generateCVV(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'debit',
      status: 'active',
      dailyLimit: 5000,
      monthlyLimit: 20000,
      createdAt: new Date().toISOString()
    };
    cards.push(debitCard);

    // Create welcome notification
    const welcomeNotification = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: userId,
      title: 'Welcome to Amenires World Bank!',
      message: `Hello ${userFirstName}! Your account has been created successfully. You've received a $10,000 welcome bonus!`,
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(welcomeNotification);

    // Record bonus transaction
    const bonusTransaction = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: userId,
      accountId: checkingAccount.id,
      type: 'credit',
      category: 'bonus',
      description: 'Welcome Bonus',
      amount: 10000.00,
      balanceAfter: 10000.00,
      currency: currency || 'USD',
      status: 'completed',
      reference: `BON${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    transactions.push(bonusTransaction);

    // Generate token
    const token = generateToken(userId, newUser.email, newUser.role);

    console.log(`✓ New account created: ${email} (${checkingAccount.accountNumber})`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Amenires World Bank!',
      data: {
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          fullName: `${newUser.firstName} ${newUser.lastName}`,
          email: newUser.email,
          phone: newUser.phone,
          country: newUser.country,
          accountType: newUser.accountType,
          role: newUser.role
        },
        accounts: [checkingAccount, savingsAccount],
        cards: [debitCard],
        token
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration. Please try again.' 
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    logActivity(user.id, 'User logged in', { email });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          country: user.country,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get current user
app.get('/api/user/profile', verifyToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userAccounts = accounts.filter(a => a.userId === req.user.id);
    const userCards = cards.filter(c => c.userId === req.user.id);
    const userNotifications = notifications.filter(n => n.userId === req.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: {
        ...user,
        accounts: userAccounts,
        cards: userCards,
        notifications: userNotifications,
        fullName: `${user.firstName} ${user.lastName}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logout successful' });
});

// Social Login
app.post('/api/auth/social-login', async (req, res) => {
  try {
    const { provider, socialId, email, name, givenName, familyName, picture } = req.body;

    if (!provider || !socialId) {
      return res.status(400).json({
        success: false,
        message: 'Provider and social ID are required'
      });
    }

    // Check if user exists with this social account
    const existingUser = users.find(u => 
      u.socialAccounts && u.socialAccounts.some(acc => 
        acc.provider === provider && acc.socialId === socialId
      )
    );

    if (existingUser) {
      // User exists - login
      const token = generateToken(existingUser.id, existingUser.email, existingUser.role);

      logActivity(existingUser.id, 'Social login', { provider });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: existingUser.id,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            email: existingUser.email,
            country: existingUser.country,
            role: existingUser.role
          },
          token
        }
      });
    } else {
      // User not found
      res.status(404).json({
        success: false,
        message: 'User not found',
        needsRegistration: true
      });
    }
  } catch (error) {
    console.error('Social login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Complete social registration
app.post('/api/auth/social-complete', async (req, res) => {
  try {
    const { 
      provider, 
      socialId, 
      email, 
      givenName, 
      familyName, 
      phone, 
      country, 
      currency, 
      accountType,
      dateOfBirth,
      address 
    } = req.body;

    if (!provider || !socialId || !email || !country) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if email already exists
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user
    const userId = crypto.randomBytes(8).toString('hex');
    const newUser = {
      id: userId,
      firstName: givenName || 'User',
      lastName: familyName || '',
      email: email.toLowerCase(),
      password: crypto.randomBytes(32).toString('hex'), // Random password for social users
      phone: phone || '',
      country,
      accountType: accountType || 'individual',
      currency: currency || 'USD',
      role: 'customer',
      isActive: true,
      isVerified: true, // Social accounts are pre-verified
      dateOfBirth: dateOfBirth || null,
      address: address || '',
      socialAccounts: [{
        provider,
        socialId,
        email,
        linkedAt: new Date().toISOString()
      }],
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    users.push(newUser);
    logActivity(userId, 'Social account created', { provider, email });

    // Create checking account
    const checkingAccount = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: userId,
      accountNumber: generateAccountNumber(),
      type: 'checking',
      balance: 10000.00,
      currency: currency || 'USD',
      status: 'active',
      isPrimary: true,
      createdAt: new Date().toISOString()
    };
    accounts.push(checkingAccount);

    // Create savings account
    const savingsAccount = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: userId,
      accountNumber: generateAccountNumber(),
      type: 'savings',
      balance: 0.00,
      currency: currency || 'USD',
      status: 'active',
      isPrimary: false,
      interestRate: 2.5,
      createdAt: new Date().toISOString()
    };
    accounts.push(savingsAccount);

    // Create debit card
    const debitCard = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: userId,
      accountId: checkingAccount.id,
      cardNumber: generateCardNumber(),
      cardHolder: `${newUser.firstName} ${newUser.lastName}`,
      cvv: generateCVV(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'debit',
      status: 'active',
      dailyLimit: 5000,
      monthlyLimit: 20000,
      createdAt: new Date().toISOString()
    };
    cards.push(debitCard);

    // Create welcome notification
    const welcomeNotification = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: userId,
      title: 'Welcome to Amenires World Bank!',
      message: `Hello ${newUser.firstName}! Your account has been created successfully via ${provider}. You've received a $10,000 welcome bonus!`,
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(welcomeNotification);

    // Record bonus transaction
    const bonusTransaction = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: userId,
      accountId: checkingAccount.id,
      type: 'credit',
      category: 'bonus',
      description: 'Welcome Bonus',
      amount: 10000.00,
      balanceAfter: 10000.00,
      currency: currency || 'USD',
      status: 'completed',
      reference: `BON${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    transactions.push(bonusTransaction);

    // Generate token
    const token = generateToken(userId, newUser.email, newUser.role);

    console.log(`✓ New social account created: ${email} via ${provider} (${checkingAccount.accountNumber})`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Amenires World Bank!',
      data: {
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          fullName: `${newUser.firstName} ${newUser.lastName}`,
          email: newUser.email,
          phone: newUser.phone,
          country: newUser.country,
          accountType: newUser.accountType,
          role: newUser.role,
          socialAccounts: newUser.socialAccounts
        },
        accounts: [checkingAccount, savingsAccount],
        cards: [debitCard],
        token
      }
    });
  } catch (error) {
    console.error('Social registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// ================== ACCOUNT ROUTES ==================

// Get all accounts
app.get('/api/accounts', verifyToken, (req, res) => {
  try {
    const userAccounts = accounts.filter(a => a.userId === req.user.id);
    res.json({
      success: true,
      data: userAccounts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get account details
app.get('/api/accounts/:accountId', verifyToken, (req, res) => {
  try {
    const account = accounts.find(a => a.id === req.params.accountId);
    
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (account.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const accountTransactions = transactions.filter(t => t.accountId === req.params.accountId);

    res.json({
      success: true,
      data: {
        ...account,
        transactions: accountTransactions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new account
app.post('/api/accounts', verifyToken, (req, res) => {
  try {
    const { type, currency } = req.body;

    if (!type || !currency) {
      return res.status(400).json({ success: false, message: 'Account type and currency required' });
    }

    const newAccount = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      accountNumber: generateAccountNumber(),
      type: type || 'checking',
      balance: 0.00,
      currency: currency,
      status: 'active',
      isPrimary: false,
      createdAt: new Date().toISOString()
    };

    accounts.push(newAccount);

    const notification = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      title: 'New Account Created',
      message: `Your ${type} account has been created successfully.`,
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(notification);

    logActivity(req.user.id, 'Account created', { type, currency });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: newAccount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ================== TRANSACTION ROUTES ==================

// Get all transactions
app.get('/api/transactions', verifyToken, (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, startDate, endDate } = req.query;
    
    let userTransactions = transactions.filter(t => t.userId === req.user.id);

    // Filters
    if (type) {
      userTransactions = userTransactions.filter(t => t.type === type);
    }
    if (category) {
      userTransactions = userTransactions.filter(t => t.category === category);
    }
    if (startDate) {
      userTransactions = userTransactions.filter(t => new Date(t.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      userTransactions = userTransactions.filter(t => new Date(t.createdAt) <= new Date(endDate));
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = userTransactions.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedTransactions,
      pagination: {
        total: userTransactions.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(userTransactions.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get transaction details
app.get('/api/transactions/:transactionId', verifyToken, (req, res) => {
  try {
    const transaction = transactions.find(t => t.id === req.params.transactionId);
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ================== TRANSFER ROUTES ==================

// Make a transfer
app.post('/api/transfers', verifyToken, (req, res) => {
  try {
    const { fromAccountId, toAccountNumber, amount, description, scheduledDate } = req.body;

    if (!fromAccountId || !toAccountNumber || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide from account, to account, and amount' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount must be greater than 0' 
      });
    }

    const fromAccount = accounts.find(a => a.id === fromAccountId);
    
    if (!fromAccount) {
      return res.status(404).json({ success: false, message: 'Source account not found' });
    }

    if (fromAccount.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (fromAccount.balance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient funds' 
      });
    }

    const toAccount = accounts.find(a => a.accountNumber === toAccountNumber);
    
    if (!toAccount) {
      return res.status(404).json({ success: false, message: 'Recipient account not found' });
    }

    // Process transfer
    const transferId = crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();

    // Deduct from sender
    fromAccount.balance -= amount;

    // Add to recipient
    toAccount.balance += amount;

    // Create debit transaction for sender
    const debitTransaction = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      accountId: fromAccountId,
      transferId,
      type: 'debit',
      category: 'transfer',
      description: description || `Transfer to ${toAccountNumber}`,
      amount: amount,
      balanceAfter: fromAccount.balance,
      currency: fromAccount.currency,
      status: 'completed',
      reference: `TRF${transferId.toUpperCase()}`,
      createdAt: now
    };
    transactions.push(debitTransaction);

    // Create credit transaction for recipient
    const creditTransaction = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: toAccount.userId,
      accountId: toAccount.id,
      transferId,
      type: 'credit',
      category: 'transfer',
      description: description || `Transfer from ${fromAccount.accountNumber}`,
      amount: amount,
      balanceAfter: toAccount.balance,
      currency: toAccount.currency,
      status: 'completed',
      reference: `TRF${transferId.toUpperCase()}`,
      createdAt: now
    };
    transactions.push(creditTransaction);

    // Create transfer record
    const transfer = {
      id: transferId,
      userId: req.user.id,
      fromAccountId,
      toAccountId: toAccount.id,
      toAccountNumber,
      amount,
      description: description || '',
      status: scheduledDate ? 'scheduled' : 'completed',
      scheduledDate: scheduledDate || null,
      createdAt: now
    };
    transfers.push(transfer);

    // Notification for sender
    const senderNotification = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      title: 'Transfer Completed',
      message: `Your transfer of ${fromAccount.currency}${amount.toLocaleString()} to ${toAccountNumber} was successful.`,
      type: 'success',
      isRead: false,
      createdAt: now
    };
    notifications.push(senderNotification);

    // Notification for recipient
    const recipientNotification = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: toAccount.userId,
      title: 'Money Received',
      message: `You received ${toAccount.currency}${amount.toLocaleString()} from ${fromAccount.accountNumber}.`,
      type: 'success',
      isRead: false,
      createdAt: now
    };
    notifications.push(recipientNotification);

    logActivity(req.user.id, 'Transfer made', { fromAccount, toAccount, amount });

    res.status(201).json({
      success: true,
      message: 'Transfer completed successfully',
      data: {
        transfer,
        fromAccount: {
          accountNumber: fromAccount.accountNumber,
          balance: fromAccount.balance
        },
        reference: `TRF${transferId.toUpperCase()}`
      }
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get transfer history
app.get('/api/transfers', verifyToken, (req, res) => {
  try {
    const userTransfers = transfers.filter(t => t.userId === req.user.id);
    res.json({
      success: true,
      data: userTransfers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ================== DEPOSIT ROUTES ==================

// Make a deposit
app.post('/api/deposits', verifyToken, (req, res) => {
  try {
    const { accountId, amount, method, reference } = req.body;

    if (!accountId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide account and amount' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount must be greater than 0' 
      });
    }

    const account = accounts.find(a => a.id === accountId);
    
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (account.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Process deposit
    const now = new Date().toISOString();
    account.balance += amount;

    const deposit = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      accountId,
      amount,
      method: method || 'cash',
      reference: reference || '',
      status: 'completed',
      createdAt: now
    };
    deposits.push(deposit);

    const transaction = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      accountId,
      depositId: deposit.id,
      type: 'credit',
      category: 'deposit',
      description: `Deposit via ${method || 'cash'}`,
      amount: amount,
      balanceAfter: account.balance,
      currency: account.currency,
      status: 'completed',
      reference: `DEP${deposit.id.toUpperCase()}`,
      createdAt: now
    };
    transactions.push(transaction);

    const notification = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      title: 'Deposit Successful',
      message: `Your deposit of ${account.currency}${amount.toLocaleString()} has been completed.`,
      type: 'success',
      isRead: false,
      createdAt: now
    };
    notifications.push(notification);

    logActivity(req.user.id, 'Deposit made', { account: account.accountNumber, amount });

    res.status(201).json({
      success: true,
      message: 'Deposit completed successfully',
      data: {
        deposit,
        account: {
          accountNumber: account.accountNumber,
          balance: account.balance
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ================== WITHDRAWAL ROUTES ==================

// Make a withdrawal
app.post('/api/withdrawals', verifyToken, (req, res) => {
  try {
    const { accountId, amount, method, reference } = req.body;

    if (!accountId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide account and amount' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount must be greater than 0' 
      });
    }

    const account = accounts.find(a => a.id === accountId);
    
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (account.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (account.balance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient funds' 
      });
    }

    // Process withdrawal
    const now = new Date().toISOString();
    account.balance -= amount;

    const withdrawal = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      accountId,
      amount,
      method: method || 'cash',
      reference: reference || '',
      status: 'completed',
      createdAt: now
    };
    withdrawals.push(withdrawal);

    const transaction = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      accountId,
      withdrawalId: withdrawal.id,
      type: 'debit',
      category: 'withdrawal',
      description: `Withdrawal via ${method || 'cash'}`,
      amount: amount,
      balanceAfter: account.balance,
      currency: account.currency,
      status: 'completed',
      reference: `WTH${withdrawal.id.toUpperCase()}`,
      createdAt: now
    };
    transactions.push(transaction);

    const notification = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      title: 'Withdrawal Successful',
      message: `Your withdrawal of ${account.currency}${amount.toLocaleString()} has been completed.`,
      type: 'success',
      isRead: false,
      createdAt: now
    };
    notifications.push(notification);

    logActivity(req.user.id, 'Withdrawal made', { account: account.accountNumber, amount });

    res.status(201).json({
      success: true,
      message: 'Withdrawal completed successfully',
      data: {
        withdrawal,
        account: {
          accountNumber: account.accountNumber,
          balance: account.balance
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ================== BILL PAYMENT ROUTES ==================

// Pay a bill
app.post('/api/bills', verifyToken, (req, res) => {
  try {
    const { accountId, billerName, billerCode, accountNumber, amount, scheduledDate } = req.body;

    if (!accountId || !billerName || !accountNumber || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide account, biller details, and amount' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount must be greater than 0' 
      });
    }

    const account = accounts.find(a => a.id === accountId);
    
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (account.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (account.balance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient funds' 
      });
    }

    // Process bill payment
    const now = new Date().toISOString();
    const status = scheduledDate ? 'scheduled' : 'completed';

    const bill = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      accountId,
      billerName,
      billerCode,
      accountNumber,
      amount,
      status,
      scheduledDate: scheduledDate || null,
      createdAt: now
    };
    bills.push(bill);

    if (status === 'completed') {
      account.balance -= amount;

      const transaction = {
        id: crypto.randomBytes(8).toString('hex'),
        userId: req.user.id,
        accountId,
        billId: bill.id,
        type: 'debit',
        category: 'bill',
        description: `Bill payment to ${billerName}`,
        amount: amount,
        balanceAfter: account.balance,
        currency: account.currency,
        status: 'completed',
        reference: `BL${bill.id.toUpperCase()}`,
        createdAt: now
      };
      transactions.push(transaction);

      const notification = {
        id: crypto.randomBytes(8).toString('hex'),
        userId: req.user.id,
        title: 'Bill Payment Successful',
        message: `Your bill payment of ${account.currency}${amount.toLocaleString()} to ${billerName} was successful.`,
        type: 'success',
        isRead: false,
        createdAt: now
      };
      notifications.push(notification);
    }

    logActivity(req.user.id, 'Bill payment made', { billerName, amount });

    res.status(201).json({
      success: true,
      message: 'Bill payment completed successfully',
      data: {
        bill,
        account: status === 'completed' ? {
          accountNumber: account.accountNumber,
          balance: account.balance
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get bill payments
app.get('/api/bills', verifyToken, (req, res) => {
  try {
    const userBills = bills.filter(b => b.userId === req.user.id);
    res.json({
      success: true,
      data: userBills
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ================== CARD ROUTES ==================

// Get all cards
app.get('/api/cards', verifyToken, (req, res) => {
  try {
    const userCards = cards.filter(c => c.userId === req.user.id);
    res.json({
      success: true,
      data: userCards
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Request new card
app.post('/api/cards', verifyToken, (req, res) => {
  try {
    const { accountId, type } = req.body;

    if (!accountId || !type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide account and card type' 
      });
    }

    const account = accounts.find(a => a.id === accountId);
    
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (account.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const user = users.find(u => u.id === req.user.id);

    const newCard = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      accountId,
      cardNumber: generateCardNumber(),
      cardHolder: `${user.firstName} ${user.lastName}`,
      cvv: generateCVV(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      type: type,
      status: 'active',
      dailyLimit: type === 'credit' ? 10000 : 5000,
      monthlyLimit: type === 'credit' ? 50000 : 20000,
      createdAt: new Date().toISOString()
    };
    cards.push(newCard);

    const notification = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      title: 'New Card Issued',
      message: `Your new ${type} card has been issued and is ready to use.`,
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(notification);

    logActivity(req.user.id, 'Card requested', { type, account: account.accountNumber });

    res.status(201).json({
      success: true,
      message: 'Card issued successfully',
      data: newCard
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Freeze/Unfreeze card
app.put('/api/cards/:cardId/status', verifyToken, (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['active', 'frozen', 'blocked'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    const card = cards.find(c => c.id === req.params.cardId);
    
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    if (card.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    card.status = status;

    const notification = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      title: 'Card Status Updated',
      message: `Your card ending in ${card.cardNumber.slice(-4)} has been ${status}.`,
      type: 'info',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(notification);

    res.json({
      success: true,
      message: 'Card status updated successfully',
      data: card
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ================== LOAN ROUTES ==================

// Apply for loan
app.post('/api/loans', verifyToken, (req, res) => {
  try {
    const { type, amount, purpose, termMonths } = req.body;

    if (!type || !amount || !purpose || !termMonths) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide loan type, amount, purpose, and term' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount must be greater than 0' 
      });
    }

    const user = users.find(u => u.id === req.user.id);

    // Calculate interest rate based on type
    let interestRate = 5.0;
    if (type === 'personal') interestRate = 7.5;
    if (type === 'mortgage') interestRate = 4.0;
    if (type === 'auto') interestRate = 5.5;
    if (type === 'business') interestRate = 6.5;

    // Calculate monthly payment
    const monthlyRate = interestRate / 100 / 12;
    const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
    const totalPayment = monthlyPayment * termMonths;

    const loan = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      type,
      amount,
      purpose,
      termMonths,
      interestRate,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    loans.push(loan);

    const notification = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      title: 'Loan Application Submitted',
      message: `Your loan application for ${user.currency || 'USD'}${amount.toLocaleString()} has been submitted for review.`,
      type: 'info',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(notification);

    logActivity(req.user.id, 'Loan applied', { type, amount, termMonths });

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
      data: loan
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get loans
app.get('/api/loans', verifyToken, (req, res) => {
  try {
    const userLoans = loans.filter(l => l.userId === req.user.id);
    res.json({
      success: true,
      data: userLoans
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ================== SAVINGS GOALS ROUTES ==================

// Create savings goal
app.post('/api/savings-goals', verifyToken, (req, res) => {
  try {
    const { name, targetAmount, targetDate, icon, color } = req.body;

    if (!name || !targetAmount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide goal name and target amount' 
      });
    }

    const savingsGoal = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      name,
      targetAmount,
      targetDate: targetDate || null,
      icon: icon || '🎯',
      color: color || '#667eea',
      currentAmount: 0,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    savingsGoals.push(savingsGoal);

    logActivity(req.user.id, 'Savings goal created', { name, targetAmount });

    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      data: savingsGoal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get savings goals
app.get('/api/savings-goals', verifyToken, (req, res) => {
  try {
    const userGoals = savingsGoals.filter(g => g.userId === req.user.id);
    res.json({
      success: true,
      data: userGoals
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add money to savings goal
app.post('/api/savings-goals/:goalId/contribute', verifyToken, (req, res) => {
  try {
    const { amount, accountId } = req.body;

    if (!amount || !accountId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide amount and account' 
      });
    }

    const goal = savingsGoals.find(g => g.id === req.params.goalId);
    
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found' });
    }

    if (goal.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const account = accounts.find(a => a.id === accountId);
    
    if (!account || account.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (account.balance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient funds' 
      });
    }

    account.balance -= amount;
    goal.currentAmount += amount;

    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'completed';
    }

    const transaction = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      accountId,
      savingsGoalId: goal.id,
      type: 'debit',
      category: 'savings',
      description: `Contribution to savings goal: ${goal.name}`,
      amount: amount,
      balanceAfter: account.balance,
      currency: account.currency,
      status: 'completed',
      createdAt: new Date().toISOString()
    };
    transactions.push(transaction);

    const notification = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: req.user.id,
      title: 'Savings Contribution',
      message: `You've contributed ${account.currency}${amount.toLocaleString()} to "${goal.name}". Progress: ${Math.round((goal.currentAmount / goal.targetAmount) * 100)}%`,
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(notification);

    res.status(200).json({
      success: true,
      message: 'Contribution added successfully',
      data: goal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ================== NOTIFICATION ROUTES ==================

// Get notifications
app.get('/api/notifications', verifyToken, (req, res) => {
  try {
    const userNotifications = notifications.filter(n => n.userId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      data: userNotifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark notification as read
app.put('/api/notifications/:notificationId/read', verifyToken, (req, res) => {
  try {
    const notification = notifications.find(n => n.id === req.params.notificationId);
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    notification.isRead = true;

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ================== STATISTICS ROUTES ==================

// Get account statistics
app.get('/api/statistics', verifyToken, (req, res) => {
  try {
    const userAccounts = accounts.filter(a => a.userId === req.user.id);
    const userTransactions = transactions.filter(t => t.userId === req.user.id);

    const totalBalance = userAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyIncome = userTransactions
      .filter(t => {
        const date = new Date(t.createdAt);
        return t.type === 'credit' && 
               date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = userTransactions
      .filter(t => {
        const date = new Date(t.createdAt);
        return t.type === 'debit' && 
               date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const recentTransactions = userTransactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        totalBalance,
        totalAccounts: userAccounts.length,
        monthlyIncome,
        monthlyExpenses,
        netSavings: monthlyIncome - monthlyExpenses,
        recentTransactions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ================== ERROR HANDLING ==================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found' 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// ================== START SERVER ==================

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🏦 AMENIRES WORLD BANK - SERVER STARTED 🏦');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ Available Features:');
  console.log('   • User Registration & Authentication');
  console.log('   • Multiple Account Types (Checking, Savings)');
  console.log('   • Transfers & Payments');
  console.log('   • Deposits & Withdrawals');
  console.log('   • Bill Payments');
  console.log('   • Debit & Credit Cards');
  console.log('   • Loan Applications');
  console.log('   • Savings Goals');
  console.log('   • Transaction History');
  console.log('   • Notifications');
  console.log('   • Account Statistics');
  console.log('═══════════════════════════════════════════════════\n');
});

module.exports = app;
