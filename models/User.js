/**
 * User Model for Amenires World Bank
 * Supports multiple account types including royalty and business entities
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  
  // Account Type
  accountType: {
    type: String,
    enum: ['individual', 'business', 'royalty', 'government', 'country_owner', 'continental'],
    default: 'individual',
    required: true
  },
  
  // Contact Information
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[\d\s-]{10,20}$/, 'Please provide a valid phone number']
  },
  
  // Location Information
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  continent: {
    type: String,
    required: [true, 'Continent is required'],
    enum: ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica']
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String
  },
  
  // Business/Royalty Specific Fields
  businessName: {
    type: String,
    trim: true,
    required: function() { return this.accountType === 'business'; }
  },
  businessType: {
    type: String,
    enum: ['corporation', 'llc', 'partnership', 'sole_proprietorship', 'ngo', 'non_profit'],
    required: function() { return this.accountType === 'business'; }
  },
  taxId: {
    type: String,
    trim: true
  },
  
  // Royalty/Government Specific Fields
  title: {
    type: String,
    trim: true,
    required: function() { return this.accountType === 'royalty'; }
  },
  royalHouse: {
    type: String,
    trim: true,
    required: function() { return this.accountType === 'royalty'; }
  },
  governmentPosition: {
    type: String,
    trim: true,
    required: function() { return this.accountType === 'government'; }
  },
  countryOwned: {
    type: String,
    trim: true,
    required: function() { return this.accountType === 'country_owner'; }
  },
  
  // Authentication
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [12, 'Password must be at least 12 characters'],
    select: false
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Two-Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  twoFactorBackupCodes: [String],
  
  // Security Settings
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  isLocked: {
    type: Boolean,
    default: false
  },
  lastLoginAt: Date,
  lastLoginIP: String,
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationExpires: Date,
  
  // Role-Based Access
  role: {
    type: String,
    enum: ['customer', 'vip', 'royal', 'business', 'admin', 'super_admin'],
    default: 'customer'
  },
  
  // IP Whitelist for Enhanced Security
  ipWhitelist: [String],
  
  // Session Management
  sessions: [{
    token: String,
    device: String,
    browser: String,
    ip: String,
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now }
  }],
  
  // Preferences
  language: {
    type: String,
    default: 'en'
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Notifications
  emailNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  
  // Audit Trail
  auditLog: [{
    action: String,
    details: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ accountType: 1 });
userSchema.index({ country: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  
  // Hash the password with cost factor of 12
  this.password = await bcrypt.hash(this.password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Method to check if password is correct
userSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = function() {
  // If lock has expired, reset attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock the account if we've reached max attempts
  if (this.loginAttempts + 1 >= parseInt(process.env.MAX_LOGIN_ATTEMPTS) && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + parseInt(process.env.LOCKOUT_TIME_MS),
      isLocked: true
    };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts on successful login
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1, isLocked: 1 }
  });
};

// Static method to find available usernames
userSchema.statics.findAvailableUsername = async function(baseUsername) {
  let username = baseUsername;
  let counter = 1;
  
  while (await this.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  return username;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
