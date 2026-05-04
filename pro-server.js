/**
 * Professional Server for Amenires World Bank
 * Complete authentication system with signup and login
 * Works without database for immediate use
 */

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage (replace with MongoDB in production)
const users = [];
const accounts = [];
const transactions = [];

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

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
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ================== AUTHENTICATION ROUTES ==================

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { fullName, firstName, lastName, email, password, phone, country, accountType, currency } = req.body;

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

    // Check if user exists
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please login or use a different email.'
      });
    }

    // Create user
    const userId = Math.random().toString(36).substr(2, 9);
    const newUser = {
      id: userId,
      firstName: userFirstName,
      lastName: userLastName,
      email: email.toLowerCase(),
      password, // In production, hash this with bcrypt
      phone: phone || '',
      country,
      accountType: accountType || 'individual',
      currency: currency || 'USD',
      role: 'customer',
      isActive: true,
      isVerified: true,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Create default account with bonus
    const accountNumber = 'AWB' + Math.random().toString(36).substr(2, 10).toUpperCase();
    const newAccount = {
      id: Math.random().toString(36).substr(2, 9),
      userId: userId,
      accountNumber,
      type: 'checking',
      balance: 10000.00, // Welcome bonus
      currency: currency || 'USD',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    accounts.push(newAccount);

    // Generate token
    const token = generateToken(userId, newUser.email, newUser.role);

    console.log(`✓ New account created: ${email} (${accountNumber})`);

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
        account: {
          accountNumber: newAccount.accountNumber,
          balance: newAccount.balance,
          currency: newAccount.currency,
          type: newAccount.type,
          status: newAccount.status
        },
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

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
          role: user.role
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
app.get('/api/auth/me', verifyToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          country: user.country,
          role: user.role
        }
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

// ================== ACCOUNT ROUTES ==================

// Get current user and accounts
app.get('/api/user/profile', verifyToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userAccounts = accounts.filter(a => a.userId === req.user.id);

    res.json({
      success: true,
      data: {
        ...user,
        accounts: userAccounts,
        fullName: `${user.firstName} ${user.lastName}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get accounts list
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

// ================== TRANSACTION ROUTES ==================

app.get('/api/transactions', verifyToken, (req, res) => {
  try {
    const userAccounts = accounts.filter(a => a.userId === req.user.id).map(a => a.id);
    const userTransactions = transactions.filter(t => 
      userAccounts.includes(t.accountId) || 
      userAccounts.includes(t.fromAccountId) || 
      userAccounts.includes(t.toAccountId)
    );
    res.json({
      success: true,
      data: userTransactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/transactions', verifyToken, (req, res) => {
  try {
    const { type, amount, description, toAccountId } = req.body;
    
    const newTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: req.user.id,
      accountId: accounts.find(a => a.userId === req.user.id)?.id,
      type: type || 'transfer',
      amount: parseFloat(amount) || 0,
      description: description || 'Transaction',
      toAccountId,
      status: 'completed',
      createdAt: new Date().toISOString()
    };
    
    transactions.push(newTransaction);
    res.json({
      success: true,
      message: 'Transaction created successfully',
      data: newTransaction
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ================== SYSTEM ROUTES ==================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/api/system/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'operational',
      bank: {
        name: 'Amenires World Bank',
        type: 'Global Universal Banking System',
        securityLevel: 'Maximum'
      },
      accounts: {
        total: users.length,
        countries: 195,
        continents: 7
      }
    }
  });
});

// ================== SERVE HTML ==================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ================== START SERVER ==================

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║        AMENIRES WORLD BANK - PROFESSIONAL SERVER         ║');
  console.log('║                                                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n✓ Server running on http://localhost:${PORT}`);
  console.log('✓ Authentication: Enabled');
  console.log('✓ Signup & Login: Available');
  console.log('✓ CORS: Enabled');
  console.log('\n📱 Open your browser: http://localhost:' + PORT);
  console.log('🔑 Demo: Create a new account or use existing credentials\n');
});
