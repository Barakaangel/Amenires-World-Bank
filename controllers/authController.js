/**
 * Authentication Controller
 * Handles user signup, login, and authentication operations
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// In-memory user storage (for development - replace with MongoDB in production)
let users = [];

/**
 * Generate JWT Token
 */
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { id: userId, email, role },
    process.env.JWT_SECRET || 'amenires-jwt-secret-key',
    { expiresIn: '24h' }
  );
};

/**
 * User Signup
 */
exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      country,
      accountType
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !country) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = {
      id: crypto.randomBytes(16).toString('hex'),
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      country,
      continent: country,
      accountType: accountType || 'individual',
      role: 'customer',
      isActive: true,
      isVerified: true,
      createdAt: new Date()
    };

    users.push(newUser);

    // Generate token
    const token = generateToken(newUser.id, newUser.email, newUser.role);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          country: newUser.country,
          accountType: newUser.accountType,
          role: newUser.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration'
    });
  }
};

/**
 * User Login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
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

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    user.lastLoginIP = req.ip;

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
          accountType: user.accountType,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
};

/**
 * Get Current User
 */
exports.getMe = async (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          country: user.country,
          accountType: user.accountType,
          role: user.role,
          isActive: user.isActive,
          isVerified: user.isVerified,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching user data'
    });
  }
};

/**
 * Logout
 */
exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during logout'
    });
  }
};

/**
 * Get all users (for development)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const safeUsers = users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      country: user.country,
      accountType: user.accountType,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    }));

    res.status(200).json({
      success: true,
      data: {
        users: safeUsers,
        count: safeUsers.length
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching users'
    });
  }
};

module.exports = exports;
