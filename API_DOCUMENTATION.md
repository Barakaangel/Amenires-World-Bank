# AMENIRES WORLD BANK - API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Core Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin)
- `GET /api/users/:id/accounts` - Get user accounts

### Accounts
- `GET /api/accounts` - Get all accounts
- `GET /api/accounts/:accountNumber` - Get account details
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:accountNumber` - Update account
- `POST /api/accounts/:accountNumber/deposit` - Deposit funds
- `POST /api/accounts/:accountNumber/withdraw` - Withdraw funds
- `GET /api/accounts/:accountNumber/balance` - Get account balance
- `GET /api/accounts/:accountNumber/statement` - Get account statement
- `POST /api/accounts/:accountNumber/transfer` - Transfer funds

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `GET /api/users/:userId/transactions` - Get user transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/search` - Search transactions

---

## Account Opening

### Application Management
- `POST /api/account-opening/submit` - Submit account opening application
- `GET /api/account-opening/my-applications` - Get my applications
- `GET /api/account-opening/:id` - Get application by ID
- `PUT /api/account-opening/:id/documents` - Upload documents
- `GET /api/account-opening/eligibility` - Check eligibility

### Admin Operations
- `GET /api/account-opening` - Get all applications (admin)
- `PATCH /api/account-opening/:id/status` - Update application status
- `POST /api/account-opening/:id/reject` - Reject application
- `POST /api/account-opening/:id/approve` - Approve application
- `GET /api/account-opening/statistics/dashboard` - Get statistics

---

## Loans

### Loan Management
- `POST /api/loans` - Apply for loan
- `GET /api/loans/my-loans` - Get my loans
- `GET /api/loans/:id` - Get loan by ID
- `GET /api/loans/:id/schedule` - Get repayment schedule
- `POST /api/loans/:id/payment` - Make payment

### Loan Analysis
- `POST /api/loans/calculate-eligibility` - Calculate loan eligibility

### Admin Operations
- `GET /api/loans` - Get all loans (admin)
- `PATCH /api/loans/:id/status` - Update loan status
- `GET /api/loans/statistics/overview` - Get loan statistics

---

## Payment Infrastructure

### Payment Methods
- `POST /api/payment-infrastructure/:userId/payment-methods` - Add payment method
- `GET /api/payment-infrastructure/:userId/payment-methods` - Get payment methods

### Payment Processing
- `POST /api/payment-infrastructure/:userId/process-payment` - Process outgoing payment
- `POST /api/payment-infrastructure/:userId/receive-payment` - Receive payment

### Platform Integration
- `POST /api/payment-infrastructure/:userId/platform-integration` - Setup platform integration

### Analytics
- `GET /api/payment-infrastructure/:userId/analytics` - Get payment analytics

### Recurring Payments
- `POST /api/payment-infrastructure/:userId/recurring-payments` - Create recurring payment

---

## Cloud & Emerging Tech

### Profile Management
- `GET /api/cloud-tech/:userId/profile` - Get cloud tech profile

### Blockchain Integration
- `PUT /api/cloud-tech/:userId/blockchain` - Update blockchain settings
- `POST /api/cloud-tech/:userId/blockchain/transactions` - Record blockchain transaction

### AI Features
- `GET /api/cloud-tech/:userId/ai/analytics` - Get AI analytics
- `POST /api/cloud-tech/:userId/ai/fraud-detection` - Run fraud detection

### IoT Devices
- `POST /api/cloud-tech/:userId/iot/devices` - Register IoT device
- `PUT /api/cloud-tech/:userId/iot/devices/:deviceId` - Update IoT device

### Biometrics
- `POST /api/cloud-tech/:userId/biometrics` - Register biometric

### Cloud Services
- `POST /api/cloud-tech/:userId/cloud-services` - Add cloud service

### Digital Twins
- `POST /api/cloud-tech/:userId/digital-twins` - Create digital twin

### Privacy
- `PUT /api/cloud-tech/:userId/privacy` - Update privacy settings

---

## Trading Platform

### Investment Account
- `POST /api/trading/:userId/account` - Create investment account
- `GET /api/trading/:userId/portfolio` - Get portfolio

### Orders
- `POST /api/trading/:userId/orders` - Place order
- `GET /api/trading/:userId/orders` - Get order history

### Watchlist
- `POST /api/trading/:userId/watchlist` - Add to watchlist
- `GET /api/trading/:userId/watchlist` - Get watchlist

### Market Data
- `GET /api/trading/market/:symbol` - Get market data

### Funds
- `POST /api/trading/:userId/deposit` - Deposit funds
- `POST /api/trading/:userId/withdraw` - Withdraw funds

---

## Global Fraud Emergency Network

### Profile & Detection
- `GET /api/fraud-network/:userId/profile` - Get fraud network profile
- `POST /api/fraud-network/:userId/fraud-detection` - Run fraud detection

### Device Management
- `POST /api/fraud-network/:userId/devices` - Register device

### Emergency Actions
- `POST /api/fraud-network/:userId/emergency-actions` - Trigger emergency action (admin)

### Alerts
- `GET /api/fraud-network/:userId/alerts` - Get alerts
- `PUT /api/fraud-network/:userId/alerts/:alertId` - Resolve alert (admin)

### Recovery
- `POST /api/fraud-network/:userId/unfreeze` - Unfreeze account

### Verification
- `POST /api/fraud-network/:userId/verification` - Submit verification documents

---

## Direct Sales Agents

### Agent Management
- `POST /api/sales-agents/:userId/agent` - Create agent profile
- `GET /api/sales-agents/agent/:agentId` - Get agent profile
- `GET /api/sales-agents/agents` - Get all agents (admin)

### Client Management
- `POST /api/sales-agents/:agentId/clients` - Add client
- `GET /api/sales-agents/:agentId/clients` - Get clients

### Lead Management
- `POST /api/sales-agents/:agentId/leads` - Create lead
- `PUT /api/sales-agents/:agentId/leads/:leadId` - Update lead
- `GET /api/sales-agents/:agentId/leads` - Get leads

### Activities
- `POST /api/sales-agents/:agentId/activities` - Create activity
- `GET /api/sales-agents/:agentId/activities` - Get activities

### Performance
- `GET /api/sales-agents/:agentId/performance` - Get performance

### Commission
- `PUT /api/sales-agents/:agentId/commission` - Update commission rates (admin)

---

## Direct Investment Brokerage

### Investment Account
- `GET /api/investment-brokerage/:userId/account` - Get investment account
- `PUT /api/investment-brokerage/:userId/goals` - Update investment goals

### Holdings
- `GET /api/investment-brokerage/:userId/holdings` - Get holdings

### Performance
- `GET /api/investment-brokerage/:userId/performance` - Get performance report

### Dividends
- `GET /api/investment-brokerage/:userId/dividends` - Get dividends

### Alerts
- `POST /api/investment-brokerage/:userId/alerts` - Create price alert
- `GET /api/investment-brokerage/:userId/alerts` - Get alerts
- `DELETE /api/investment-brokerage/:userId/alerts/:alertId` - Delete alert

### Tax
- `GET /api/investment-brokerage/:userId/tax` - Get tax information

---

## Conversational AI

### Query Processing
- `POST /api/ai-assistant/:userId/query` - Process natural language query

### Quick Actions
- `GET /api/ai-assistant/:userId/balance` - Get account balance
- `GET /api/ai-assistant/:userId/transactions` - Get transaction history
- `GET /api/ai-assistant/:userId/loans` - Get loan information

### Transfers
- `POST /api/ai-assistant/:userId/transfer` - Initiate transfer

### Help
- `GET /api/ai-assistant/:userId/help` - Get help and FAQs

### Context
- `POST /api/ai-assistant/:userId/context` - Save conversation context

---

## Admin Endpoints

### System Management
- `GET /api/admin/users` - Get all users
- `GET /api/admin/statistics` - Get system statistics
- `POST /api/admin/notifications` - Send notification
- `GET /api/admin/audit-log` - Get audit log

### Security
- `GET /api/security/config` - Get security configuration
- `POST /api/security/config` - Update security configuration
- `GET /api/security/threats` - Get security threats
- `POST /api/security/block-ip` - Block IP address

---

## System Endpoints

### Health & Status
- `GET /api/health` - Health check
- `GET /api/system/status` - System status

### Bank Identity
- `GET /api/bank/identity` - Get bank identity
- `GET /api/bank/routing-number` - Generate routing number
- `GET /api/bank/swift-code` - Generate SWIFT code
- `GET /api/bank/lei` - Generate LEI

---

## Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Error Response Format

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

---

## Rate Limiting

- **Global API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Transactions**: 10 requests per minute
- **Sensitive Operations**: 5 requests per hour

---

## Pagination

Most list endpoints support pagination:
```
?page=1&limit=20
```

---

## Filtering

Many endpoints support filtering:
```
?status=active&type=checking&startDate=2024-01-01&endDate=2024-12-31
```

---

## Sorting

Sort results with:
```
?sort=createdAt&order=desc
```
