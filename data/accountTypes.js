/**
 * Complete Account Types for Amenires World Bank
 * Including all banking account types, investment options, and corporate accounts
 */

const accountTypes = [
  // Personal Accounts
  {
    id: 'personal-checking',
    category: 'personal',
    name: 'Personal Checking Account',
    description: 'Everyday banking for personal needs',
    features: [
      'Free debit card',
      'Mobile banking',
      'Online bill pay',
      'No minimum balance',
      'Unlimited transactions'
    ],
    interestRate: 0.01,
    fees: {
      monthly: 0,
      atm: 0,
      overdraft: 25
    },
    requirements: {
      minAge: 18,
      minDeposit: 25
    },
    availableCountries: ['all']
  },
  {
    id: 'personal-savings',
    category: 'personal',
    name: 'Personal Savings Account',
    description: 'Grow your money with competitive interest rates',
    features: [
      'High interest rate',
      'No monthly fees',
      'Online access',
      'Automatic transfers',
      'Compound interest'
    ],
    interestRate: 2.5,
    fees: {
      monthly: 0,
      withdrawal: 0,
      transfer: 0
    },
    requirements: {
      minAge: 18,
      minDeposit: 100
    },
    availableCountries: ['all']
  },
  {
    id: 'student-checking',
    category: 'personal',
    name: 'Student Checking Account',
    description: 'Designed for students with special benefits',
    features: [
      'No monthly fees',
      'Free ATM withdrawals',
      'Mobile banking',
      'Budgeting tools',
      'Student discounts'
    ],
    interestRate: 0.01,
    fees: {
      monthly: 0,
      atm: 0,
      overdraft: 0
    },
    requirements: {
      minAge: 16,
      minDeposit: 10,
      proofOfEnrollment: true
    },
    availableCountries: ['all']
  },
  {
    id: 'senior-checking',
    category: 'personal',
    name: 'Senior Checking Account',
    description: 'Exclusive benefits for customers 65+',
    features: [
      'Free checks',
      'No monthly fees',
      'Free safety deposit box',
      'Priority support',
      'Health discounts'
    ],
    interestRate: 0.05,
    fees: {
      monthly: 0,
      atm: 0,
      checkOrder: 0
    },
    requirements: {
      minAge: 65,
      minDeposit: 0
    },
    availableCountries: ['all']
  },

  // Investment Accounts
  {
    id: 'investment-brokerage',
    category: 'investment',
    name: 'Investment Brokerage Account',
    description: 'Trade stocks, bonds, ETFs and more',
    features: [
      'Real-time trading',
      'Research tools',
      'Market analysis',
      'Portfolio tracking',
      'Dividend reinvestment'
    ],
    interestRate: null,
    fees: {
      monthly: 0,
      trade: 4.95,
      transfer: 0
    },
    requirements: {
      minAge: 21,
      minDeposit: 1000,
      riskAcknowledgment: true
    },
    availableCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'SG', 'HK']
  },
  {
    id: 'investment-mutual-funds',
    category: 'investment',
    name: 'Mutual Funds Account',
    description: 'Diversified investment with professional management',
    features: [
      'Professional management',
      'Diversification',
      'Regular updates',
      'Automatic investments',
      'Flexible redemption'
    ],
    interestRate: null,
    fees: {
      annual: 0.75,
      management: 0.5
    },
    requirements: {
      minAge: 18,
      minDeposit: 500,
      riskProfile: 'required'
    },
    availableCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'SG']
  },
  {
    id: 'investment-retirement-401k',
    category: 'investment',
    name: '401(k) Retirement Account',
    description: 'Save for retirement with tax advantages',
    features: [
      'Tax-deferred growth',
      'Employer matching',
      'Investment choices',
      'Loan options',
      'Rollover support'
    ],
    interestRate: null,
    fees: {
      annual: 0.5,
      management: 0.3
    },
    requirements: {
      minAge: 21,
      minDeposit: 0,
      usResident: true,
      employment: 'required'
    },
    availableCountries: ['US']
  },
  {
    id: 'investment-retirement-ira',
    category: 'investment',
    name: 'Individual Retirement Account (IRA)',
    description: 'Personal retirement savings account',
    features: [
      'Tax advantages',
      'Wide investment options',
      'Compound growth',
      'Flexible contributions',
      'Roth/Traditional options'
    ],
    interestRate: null,
    fees: {
      annual: 0.4,
      maintenance: 25
    },
    requirements: {
      minAge: 18,
      minDeposit: 100,
      usResident: true
    },
    availableCountries: ['US']
  },
  {
    id: 'investment-cd',
    category: 'investment',
    name: 'Certificate of Deposit (CD)',
    description: 'Fixed-term savings with guaranteed returns',
    features: [
      'Fixed interest rate',
      'FDIC insured',
      'Various terms',
      'Laddering options',
      'Early withdrawal options'
    ],
    interestRate: 4.5,
    fees: {
      earlyWithdrawal: '3 months interest'
    },
    requirements: {
      minAge: 18,
      minDeposit: 1000,
      termSelection: 'required'
    },
    availableCountries: ['US']
  },
  {
    id: 'investment-money-market',
    category: 'investment',
    name: 'Money Market Account',
    description: 'Higher interest with check-writing privileges',
    features: [
      'Higher interest rates',
      'Check writing',
      'ATM access',
      'Tiered rates',
      'Liquidity'
    ],
    interestRate: 3.5,
    fees: {
      monthly: 0,
      minBalance: 0,
      excessTransaction: 10
    },
    requirements: {
      minAge: 18,
      minDeposit: 2500
    },
    availableCountries: ['US', 'CA']
  },
  {
    id: 'investment-forex',
    category: 'investment',
    name: 'Forex Trading Account',
    description: 'Trade foreign currencies 24/7',
    features: [
      '24/7 trading',
      'Major currency pairs',
      'Leverage options',
      'Real-time quotes',
      'Risk management'
    ],
    interestRate: null,
    fees: {
      spread: 'variable',
      overnight: 'variable'
    },
    requirements: {
      minAge: 21,
      minDeposit: 500,
      riskAcknowledgment: true
    },
    availableCountries: ['US', 'GB', 'AU', 'SG', 'HK', 'JP']
  },
  {
    id: 'investment-crypto',
    category: 'investment',
    name: 'Cryptocurrency Account',
    description: 'Buy, sell and hold cryptocurrencies',
    features: [
      'Multiple coins',
      'Secure storage',
      'Real-time prices',
      'Easy conversions',
      'Portfolio tracking'
    ],
    interestRate: null,
    fees: {
      trade: 1.5,
      withdrawal: 'variable'
    },
    requirements: {
      minAge: 18,
      minDeposit: 50,
      kyc: 'required'
    },
    availableCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'SG', 'JP']
  },

  // Corporate/Business Accounts
  {
    id: 'business-checking',
    category: 'business',
    name: 'Business Checking Account',
    description: 'Essential banking for businesses',
    features: [
      'Unlimited transactions',
      'Mobile deposit',
      'Payroll services',
      'Online invoicing',
      'Cash management'
    ],
    interestRate: 0.01,
    fees: {
      monthly: 15,
      perTransaction: 0.05
    },
    requirements: {
      businessRegistration: 'required',
      taxId: 'required',
      businessLicense: 'required'
    },
    availableCountries: ['all']
  },
  {
    id: 'business-savings',
    category: 'business',
    name: 'Business Savings Account',
    description: 'Earn interest on business cash reserves',
    features: [
      'Competitive rates',
      'Easy transfers',
      'Online access',
      'No monthly fees',
      'Interest compounding'
    ],
    interestRate: 1.5,
    fees: {
      monthly: 0,
      transfer: 0
    },
    requirements: {
      businessRegistration: 'required',
      taxId: 'required'
    },
    availableCountries: ['all']
  },
  {
    id: 'business-merchant',
    category: 'business',
    name: 'Merchant Services Account',
    description: 'Accept payments from customers',
    features: [
      'Credit card processing',
      'POS integration',
      'Online payments',
      'Recurring billing',
      'Fraud protection'
    ],
    interestRate: null,
    fees: {
      monthly: 30,
      perTransaction: 2.9,
      cardPresent: 2.6
    },
    requirements: {
      businessRegistration: 'required',
      taxId: 'required',
      bankStatement: 'required'
    },
    availableCountries: ['US', 'CA', 'GB', 'AU', 'SG', 'HK']
  },
  {
    id: 'business-payroll',
    category: 'business',
    name: 'Payroll Account',
    description: 'Simplify employee payments',
    features: [
      'Direct deposit',
      'Tax withholding',
      'Automatic deductions',
      'Employee portal',
      'Compliance reporting'
    ],
    interestRate: 0.01,
    fees: {
      monthly: 25,
      perEmployee: 5
    },
    requirements: {
      businessRegistration: 'required',
      taxId: 'required',
      minEmployees: 1
    },
    availableCountries: ['all']
  },
  {
    id: 'corporate-treasury',
    category: 'business',
    name: 'Corporate Treasury Account',
    description: 'Advanced cash management for large corporations',
    features: [
      'Multi-currency',
      'Global transfers',
      'Liquidity management',
      'Risk hedging',
      'API access'
    ],
    interestRate: null,
    fees: {
      monthly: 'custom',
      transaction: 'custom',
      transfer: 'custom'
    },
    requirements: {
      businessRegistration: 'required',
      annualRevenue: 10000000,
      creditApproval: 'required'
    },
    availableCountries: ['US', 'GB', 'DE', 'FR', 'JP', 'SG', 'HK']
  },

  // International Accounts
  {
    id: 'international-multicurrency',
    category: 'international',
    name: 'Multi-Currency Account',
    description: 'Hold and manage multiple currencies',
    features: [
      '10+ currencies',
      'Real-time exchange',
      'No conversion fees',
      'Global transfers',
      'Debit card'
    ],
    interestRate: 0.1,
    fees: {
      monthly: 10,
      exchange: 0.5,
      transfer: 0
    },
    requirements: {
      minAge: 18,
      minDeposit: 500,
      internationalResident: true
    },
    availableCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'SG', 'HK', 'JP', 'AE']
  },
  {
    id: 'international-expat',
    category: 'international',
    name: 'Expat Banking Account',
    description: 'Banking solutions for expatriates',
    features: [
      'Cross-border transfers',
      'Multi-language support',
      'Concierge service',
      'Insurance options',
      'Tax advisory'
    ],
    interestRate: 0.5,
    fees: {
      monthly: 20,
      transfer: 0,
      atm: 0
    },
    requirements: {
      minAge: 18,
      minDeposit: 1000,
      expatStatus: 'required'
    },
    availableCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'SG', 'HK']
  },

  // Special Accounts
  {
    id: 'trust-account',
    category: 'special',
    name: 'Trust Account',
    description: 'Manage assets for beneficiaries',
    features: [
      'Professional trustee',
      'Asset protection',
      'Estate planning',
      'Tax efficiency',
      'Beneficiary management'
    ],
    interestRate: null,
    fees: {
      annual: 0.5,
      setup: 1000
    },
    requirements: {
      legalDocuments: 'required',
      trusteeAgreement: 'required'
    },
    availableCountries: ['US', 'CA', 'GB', 'AU']
  },
  {
    id: 'escrow-account',
    category: 'special',
    name: 'Escrow Account',
    description: 'Secure funds for transactions',
    features: [
      'Neutral third-party',
      'Secure holding',
      'Release conditions',
      'Dispute resolution',
      'Audit trail'
    ],
    interestRate: 0.01,
    fees: {
      setup: 500,
      perTransaction: 50,
      annual: 0.25
    },
    requirements: {
      escrowAgreement: 'required',
      businessPurpose: 'required'
    },
    availableCountries: ['US', 'CA', 'GB', 'AU', 'SG']
  },

  // Bank Incorporation
  {
    id: 'bank-incorporation-branch',
    category: 'incorporation',
    name: 'Bank Branch Incorporation',
    description: 'Establish a physical bank branch',
    features: [
      'Full banking license',
      'Physical location',
      'Staff support',
      'Local currency operations',
      'Regulatory compliance'
    ],
    interestRate: null,
    fees: {
      setup: 500000,
      annual: 100000,
      compliance: 25000
    },
    requirements: {
      capitalRequirement: 5000000,
      businessPlan: 'required',
      regulatoryApproval: 'required',
      managementTeam: 'required'
    },
    availableCountries: ['US', 'GB', 'SG', 'HK', 'AE']
  },
  {
    id: 'bank-incorporation-digital',
    category: 'incorporation',
    name: 'Digital Bank License',
    description: 'Operate as an online-only bank',
    features: [
      'Digital-only operations',
      'Lower costs',
      'Global reach',
      'API-first',
      'Mobile-first'
    ],
    interestRate: null,
    fees: {
      setup: 250000,
      annual: 50000,
      compliance: 15000
    },
    requirements: {
      capitalRequirement: 1000000,
      businessPlan: 'required',
      regulatoryApproval: 'required',
      technologyPlatform: 'required'
    },
    availableCountries: ['US', 'GB', 'SG', 'HK', 'AE', 'EU']
  },
  {
    id: 'bank-incorporation-subsidiary',
    category: 'incorporation',
    name: 'Foreign Bank Subsidiary',
    description: 'Operate as a subsidiary in another country',
    features: [
      'Local market access',
      'Currency diversification',
      'Regulatory benefits',
      'Tax efficiency',
      'Brand expansion'
    ],
    interestRate: null,
    fees: {
      setup: 1000000,
      annual: 200000,
      compliance: 50000
    },
    requirements: {
      capitalRequirement: 10000000,
      parentBank: 'required',
      regulatoryApproval: 'required',
      localManagement: 'required'
    },
    availableCountries: ['US', 'GB', 'SG', 'HK', 'AE']
  }
];

const accountCategories = [
  {
    id: 'personal',
    name: 'Personal Banking',
    icon: '👤',
    description: 'Accounts for individual needs'
  },
  {
    id: 'investment',
    name: 'Investment & Wealth',
    icon: '📈',
    description: 'Grow your wealth with investment options'
  },
  {
    id: 'business',
    name: 'Business & Corporate',
    icon: '🏢',
    description: 'Banking solutions for businesses'
  },
  {
    id: 'international',
    name: 'International Banking',
    icon: '🌍',
    description: 'Global banking solutions'
  },
  {
    id: 'special',
    name: 'Special Accounts',
    icon: '⚖️',
    description: 'Specialized account types'
  },
  {
    id: 'incorporation',
    name: 'Bank Incorporation',
    icon: '🏦',
    description: 'Establish your own bank'
  }
];

module.exports = { accountTypes, accountCategories };
