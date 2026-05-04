const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Account opening validation
const validateAccountOpening = [
  body('accountType').isIn(['savings', 'checking', 'business', 'investment']),
  body('currency').isLength({ min: 3, max: 3 }),
  body('initialDeposit').isFloat({ min: 0 }),
  body('personalInfo').isObject(),
  handleValidationErrors
];

// Loan application validation
const validateLoanApplication = [
  body('type').isIn(['personal', 'home', 'auto', 'business', 'education']),
  body('amount').isFloat({ min: 100 }),
  body('term').isInt({ min: 1, max: 360 }),
  body('interestRate').isFloat({ min: 0, max: 30 }),
  body('purpose').isString().isLength({ min: 10, max: 500 }),
  handleValidationErrors
];

// User ID validation
const validateUserId = [
  param('userId').isMongoId(),
  handleValidationErrors
];

// Account number validation
const validateAccountNumber = [
  param('accountNumber').isLength({ min: 10, max: 30 }),
  handleValidationErrors
];

// Transaction validation
const validateTransaction = [
  body('amount').isFloat({ min: 0.01 }),
  body('currency').isLength({ min: 3, max: 3 }),
  body('type').isIn(['deposit', 'withdrawal', 'transfer', 'payment']),
  body('accountNumber').notEmpty(),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateAccountOpening,
  validateLoanApplication,
  validateUserId,
  validateAccountNumber,
  validateTransaction,
  validatePagination
};
