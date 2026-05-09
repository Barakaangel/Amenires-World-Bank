const Loan = require('../models/Loan');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');

class LoanController {
  // Create new loan application
  async createLoan(req, res) {
    try {
      const {
        userId,
        type,
        amount,
        purpose,
        term,
        interestRate,
        collateralDetails,
        guarantorDetails
      } = req.body;

      // Validate user exists
      const user = await User.findById(String(userId));
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user has pending loan applications
      const pendingLoan = await Loan.findOne({
        userId: String(userId),
        status: { $in: ['pending', 'under_review'] }
      });

      if (pendingLoan) {
        return res.status(400).json({
          error: 'You have a pending loan application'
        });
      }

      // Calculate monthly payment
      const monthlyRate = interestRate / 12 / 100;
      const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, term)) /
                            (Math.pow(1 + monthlyRate, term) - 1);

      // Generate loan reference
      const loanRef = `LN${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      const loan = new Loan({
        userId,
        loanNumber: loanRef,
        type,
        amount,
        purpose,
        term,
        interestRate,
        monthlyPayment,
        totalPayment: monthlyPayment * term,
        collateralDetails,
        guarantorDetails,
        status: 'pending',
        applicationDate: new Date(),
        documents: req.files ? req.files.map(f => f.path) : []
      });

      await loan.save();

      res.status(201).json({
        message: 'Loan application submitted successfully',
        loan
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error creating loan application',
        details: error.message
      });
    }
  }

  // Get all loan applications (admin)
  async getAllLoans(req, res) {
    try {
      const { status, type, page = 1, limit = 20 } = req.query;
      const filter = {};

      if (status) filter.status = status;
      if (type) filter.type = type;

      const loans = await Loan.find(filter)
        .populate('userId', 'name email phone')
        .sort({ applicationDate: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Loan.countDocuments(filter);

      res.json({
        loans,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching loans',
        details: error.message
      });
    }
  }

  // Get user's loans
  async getUserLoans(req, res) {
    try {
      const { userId } = req.params;
      const { status } = req.query;

      const filter = { userId };
      if (status) filter.status = status;

      const loans = await Loan.find(filter)
        .sort({ applicationDate: -1 });

      res.json({ loans });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching user loans',
        details: error.message
      });
    }
  }

  // Get loan by ID
  async getLoanById(req, res) {
    try {
      const loan = await Loan.findById(req.params.id)
        .populate('userId', 'name email phone address');

      if (!loan) {
        return res.status(404).json({ error: 'Loan not found' });
      }

      res.json({ loan });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching loan',
        details: error.message
      });
    }
  }

  // Update loan status (admin)
  async updateLoanStatus(req, res) {
    try {
      const { status, rejectionReason, approvedAmount, approvedTerm, approvedRate } = req.body;

      const loan = await Loan.findById(req.params.id);

      if (!loan) {
        return res.status(404).json({ error: 'Loan not found' });
      }

      // Validate status transition
      const validTransitions = {
        'pending': ['under_review', 'rejected'],
        'under_review': ['approved', 'rejected', 'pending'],
        'approved': ['active', 'cancelled'],
        'active': ['completed', 'defaulted'],
        'completed': [],
        'rejected': [],
        'defaulted': [],
        'cancelled': []
      };

      if (!validTransitions[loan.status].includes(status)) {
        return res.status(400).json({
          error: `Cannot transition from ${loan.status} to ${status}`
        });
      }

      // Update loan details
      loan.status = status;
      if (rejectionReason) loan.rejectionReason = rejectionReason;
      if (approvedAmount) loan.amount = approvedAmount;
      if (approvedTerm) loan.term = approvedTerm;
      if (approvedRate) loan.interestRate = approvedRate;

      // Recalculate payments if approved
      if (status === 'approved' || status === 'active') {
        const monthlyRate = loan.interestRate / 12 / 100;
        loan.monthlyPayment = loan.amount * (monthlyRate * Math.pow(1 + monthlyRate, loan.term)) /
                             (Math.pow(1 + monthlyRate, loan.term) - 1);
        loan.totalPayment = loan.monthlyPayment * loan.term;
        loan.approvalDate = new Date();
        loan.startDate = new Date();
        loan.endDate = new Date();
        loan.endDate.setMonth(loan.endDate.getMonth() + loan.term);
      }

      await loan.save();

      // Create transaction if loan is disbursed
      if (status === 'active') {
        const user = await User.findById(loan.userId);
        
        // Find or create default account
        let account = user.accounts.find(a => a.type === 'savings');
        if (!account) {
          account = {
            type: 'savings',
            accountNumber: `ACC${Date.now()}`,
            balance: 0,
            currency: 'USD'
          };
          user.accounts.push(account);
        }

        // Add loan amount to account
        account.balance += loan.amount;

        // Create transaction record
        const transaction = new Transaction({
          userId: loan.userId,
          type: 'loan_disbursement',
          amount: loan.amount,
          description: `Loan disbursement - ${loan.loanNumber}`,
          reference: `TXN${Date.now()}`,
          status: 'completed',
          metadata: {
            loanId: loan._id,
            loanNumber: loan.loanNumber
          }
        });

        await transaction.save();
        await user.save();

        // Schedule repayment reminders
        await this.scheduleRepaymentReminders(loan);
      }

      res.json({
        message: 'Loan status updated successfully',
        loan
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error updating loan status',
        details: error.message
      });
    }
  }

  // Process loan payment
  async processPayment(req, res) {
    try {
      const { loanId } = req.params;
      const { amount, paymentMethod, transactionId } = req.body;

      const loan = await Loan.findById(loanId);
      if (!loan) {
        return res.status(404).json({ error: 'Loan not found' });
      }

      if (loan.status !== 'active' && loan.status !== 'overdue') {
        return res.status(400).json({
          error: 'Loan is not in a payable status'
        });
      }

      // Calculate overdue amount if any
      const today = new Date();
      let overdueAmount = 0;
      const missedPayments = loan.repaymentSchedule.filter(r => 
        r.dueDate < today && r.status !== 'paid'
      );
      overdueAmount = missedPayments.reduce((sum, r) => sum + r.amount, 0);

      // Apply payment to overdue payments first
      let remainingAmount = amount;
      let paymentsApplied = [];

      for (let schedule of loan.repaymentSchedule) {
        if (schedule.status === 'pending' && remainingAmount > 0) {
          const paymentAmount = Math.min(remainingAmount, schedule.amount);
          schedule.amountPaid += paymentAmount;
          schedule.status = schedule.amountPaid >= schedule.amount ? 'paid' : 'partial';
          schedule.paidDate = schedule.status === 'paid' ? today : null;
          schedule.paymentMethod = paymentMethod;
          schedule.transactionId = transactionId;

          paymentsApplied.push({
            installmentNumber: schedule.installmentNumber,
            amountPaid: paymentAmount
          });

          remainingAmount -= paymentAmount;
        }
      }

      // Update loan totals
      loan.amountPaid += amount;
      loan.balanceDue = loan.totalPayment - loan.amountPaid;
      loan.lastPaymentDate = today;

      // Check if loan is fully paid
      if (loan.balanceDue <= 0) {
        loan.status = 'completed';
        loan.completionDate = today;
      }

      await loan.save();

      // Create transaction record
      const transaction = new Transaction({
        userId: loan.userId,
        type: 'loan_repayment',
        amount: amount,
        description: `Loan repayment - ${loan.loanNumber}`,
        reference: `TXN${Date.now()}`,
        status: 'completed',
        metadata: {
          loanId: loan._id,
          loanNumber: loan.loanNumber,
          paymentsApplied
        }
      });

      await transaction.save();

      res.json({
        message: 'Payment processed successfully',
        loan,
        amountPaid: amount,
        remainingBalance: loan.balanceDue
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error processing payment',
        details: error.message
      });
    }
  }

  // Get loan repayment schedule
  async getRepaymentSchedule(req, res) {
    try {
      const loan = await Loan.findById(req.params.id);

      if (!loan) {
        return res.status(404).json({ error: 'Loan not found' });
      }

      res.json({
        loanNumber: loan.loanNumber,
        monthlyPayment: loan.monthlyPayment,
        totalPayment: loan.totalPayment,
        amountPaid: loan.amountPaid,
        balanceDue: loan.balanceDue,
        schedule: loan.repaymentSchedule
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching repayment schedule',
        details: error.message
      });
    }
  }

  // Calculate loan eligibility
  async calculateEligibility(req, res) {
    try {
      const { userId, loanType, loanAmount, term } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Basic eligibility criteria
      const eligibility = {
        eligible: true,
        score: 0,
        factors: [],
        maxLoanAmount: 0,
        suggestedInterestRate: 0
      };

      // Age factor (must be 18-65)
      const age = this.calculateAge(user.dateOfBirth);
      if (age < 18 || age > 65) {
        eligibility.eligible = false;
        eligibility.factors.push({
          factor: 'Age',
          status: 'fail',
          message: 'Must be between 18 and 65 years old'
        });
      } else {
        eligibility.score += 20;
        eligibility.factors.push({
          factor: 'Age',
          status: 'pass',
          message: 'Age requirement met'
        });
      }

      // Credit score simulation (in real system, integrate with credit bureau)
      const creditScore = this.simulateCreditScore(user);
      eligibility.factors.push({
        factor: 'Credit Score',
        status: creditScore >= 600 ? 'pass' : 'fail',
        message: `Credit score: ${creditScore}`
      });
      if (creditScore >= 600) {
        eligibility.score += 30;
      }

      // Income verification
      if (user.monthlyIncome > 0) {
        const debtToIncomeRatio = (user.totalDebt || 0) / user.monthlyIncome;
        if (debtToIncomeRatio < 0.5) {
          eligibility.score += 30;
          eligibility.maxLoanAmount = user.monthlyIncome * 0.5 * term;
          eligibility.factors.push({
            factor: 'Debt-to-Income Ratio',
            status: 'pass',
            message: `Ratio: ${(debtToIncomeRatio * 100).toFixed(2)}%`
          });
        } else {
          eligibility.eligible = false;
          eligibility.factors.push({
            factor: 'Debt-to-Income Ratio',
            status: 'fail',
            message: `Ratio too high: ${(debtToIncomeRatio * 100).toFixed(2)}%`
          });
        }
      } else {
        eligibility.eligible = false;
        eligibility.factors.push({
          factor: 'Income',
          status: 'fail',
          message: 'No income information'
        });
      }

      // Employment status
      if (user.employmentStatus === 'employed') {
        eligibility.score += 20;
      } else if (user.employmentStatus === 'self-employed') {
        eligibility.score += 10;
      } else {
        eligibility.score -= 10;
      }

      // Calculate suggested interest rate based on score
      if (eligibility.score >= 80) {
        eligibility.suggestedInterestRate = 8.5;
      } else if (eligibility.score >= 60) {
        eligibility.suggestedInterestRate = 10.5;
      } else if (eligibility.score >= 40) {
        eligibility.suggestedInterestRate = 13.5;
      } else {
        eligibility.suggestedInterestRate = 16.5;
      }

      // Cap maximum loan amount
      const maxAmounts = {
        'personal': 50000,
        'home': 500000,
        'auto': 75000,
        'business': 100000
      };
      eligibility.maxLoanAmount = Math.min(
        eligibility.maxLoanAmount,
        maxAmounts[loanType] || 50000
      );

      res.json(eligibility);
    } catch (error) {
      res.status(500).json({
        error: 'Error calculating eligibility',
        details: error.message
      });
    }
  }

  // Get loan statistics (admin)
  async getLoanStatistics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const matchQuery = {};

      if (startDate || endDate) {
        matchQuery.applicationDate = {};
        if (startDate) matchQuery.applicationDate.$gte = new Date(startDate);
        if (endDate) matchQuery.applicationDate.$lte = new Date(endDate);
      }

      const stats = await Loan.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalApplications: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            approvedAmount: {
              $sum: {
                $cond: [{ $in: ['$status', ['approved', 'active', 'completed']] }, '$amount', 0]
              }
            },
            totalDisbursed: {
              $sum: {
                $cond: [{ $in: ['$status', ['active', 'completed']] }, '$amount', 0]
              }
            },
            totalCollected: { $sum: '$amountPaid' },
            outstandingBalance: { $sum: '$balanceDue' },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            approvedCount: {
              $sum: { $cond: [{ $in: ['$status', ['approved', 'active']] }, 1, 0] }
            },
            completedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            rejectedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
            }
          }
        }
      ]);

      const statusBreakdown = await Loan.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      res.json({
        statistics: stats[0] || {},
        byType: statusBreakdown
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching statistics',
        details: error.message
      });
    }
  }

  // Helper methods
  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  simulateCreditScore(user) {
    // In real implementation, integrate with credit bureau API
    let score = 650;
    score += (user.accounts?.length || 0) * 10;
    score -= Math.floor(Math.random() * 100);
    return Math.min(850, Math.max(300, score));
  }

  async scheduleRepaymentReminders(loan) {
    // In real implementation, integrate with notification service
    // to send reminders before each due date
    console.log(`Scheduled repayment reminders for loan ${loan.loanNumber}`);
  }
}

module.exports = new LoanController();
