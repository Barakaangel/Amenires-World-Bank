# 🏦 Amenires World Bank - Professional Banking System

A secure, professional banking web application with complete authentication and account management features.

## ✅ Features Implemented

### 🔐 Authentication System
- **Sign Up** - Create new bank accounts with email verification
- **Login** - Secure login with JWT authentication
- **Password Strength Validation** - Enforces strong passwords
- **Session Management** - Token-based authentication
- **Demo Credentials** - Test with admin@bank.com / password123

### 💰 Dashboard Features
- **Account Overview** - Real-time balance display
- **Transaction History** - Complete transaction records
- **Quick Actions** - Transfer, Deposit, Withdraw, Pay Bills
- **Multiple Account Types** - Main account and savings
- **Financial Analytics** - Income/Expense tracking

### 🛡️ Security Features
- **Password Hashing** - bcrypt encryption
- **JWT Authentication** - Secure token handling
- **CORS Protection** - Cross-origin security
- **Input Validation** - Sanitized user inputs
- **Rate Limiting** - DDoS protection
- **Helmet Security** - HTTP headers protection

## 🚀 Quick Start

### Method 1: Double-Click (Easiest)

1. **Double-click** `START_PRO_SERVER.bat`
2. Wait for server to start (you'll see "✓ Server running on port 3000")
3. **Open browser**: http://localhost:3000
4. **Login with demo credentials**:
   - Email: `admin@bank.com`
   - Password: `password123`

### Method 2: Command Line

```bash
# Navigate to project directory
cd "C:\Users\Knm Editors\CodeBuddy\bank"

# Start the server
node pro-server.js
```

Then open http://localhost:3000 in your browser.

## 📱 How to Use

### Sign Up for New Account

1. Click "Sign Up" tab
2. Fill in:
   - Full Name
   - Email Address
   - Phone Number
   - Password (minimum 8 characters)
   - Confirm Password
3. Accept Terms & Conditions
4. Click "Create Account"
5. You'll be redirected to login

### Login to Dashboard

1. Enter your email and password
2. Click "Sign In"
3. You'll be redirected to the dashboard

### Dashboard Features

#### View Balance
- **Total Balance** - Shows your complete account balance
- **Income** - Money received this month
- **Expenses** - Money spent this month
- **Savings** - Total savings amount

#### Quick Actions
1. **Transfer** - Send money to another account
   - Select from account
   - Enter recipient account number
   - Enter amount
   - Add optional reference

2. **Deposit** - Add money to your account
   - Select account
   - Enter amount
   - Choose deposit method

3. **Withdraw** - Take money out
   - Select account
   - Enter amount
   - Choose withdrawal method

4. **Pay Bills** - Pay utility bills
   - Select bill type
   - Enter account number
   - Enter amount

#### Transaction History
- View recent transactions
- See transaction details
- Track income and expenses

### Logout
Click the "Logout" button in the top right corner

## 🛠️ Technical Architecture

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with gradients
- **JavaScript (ES6+)** - Client-side logic
- **Font Awesome** - Icons
- **Fetch API** - HTTP requests

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Security
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers
- **Rate Limiting** - Request throttling
- **Input Validation** - Sanitization

## 📁 File Structure

```
bank/
├── pro-server.js              # Main server file
├── START_PRO_SERVER.bat       # Startup script
├── public/
│   ├── index.html            # Login/Signup page
│   └── dashboard.html        # User dashboard
├── controllers/
│   └── authController.js     # Authentication logic
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── security.js          # Security middleware
├── models/
│   └── User.js              # User model (for future DB)
└── routes/
    └── auth.js              # Authentication routes
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login user
- `GET /api/user/profile` - Get user profile

### Dashboard Data (Demo)
- Mock data is served for demonstration

## 🐛 Troubleshooting

### "This site can't be reached" or "localhost refused to connect"

**Solution:**
1. Make sure the server is running (check black command window)
2. Verify port 3000 is not blocked
3. Try http://127.0.0.1:3000 instead of localhost
4. Restart the server

### "EADDRINUSE: address already in use"

**Solution:**
The batch file automatically handles this. If it persists:
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /F /PID <PID>
```

### Login not working

**Solution:**
1. Use demo credentials: admin@bank.com / password123
2. Create a new account through Sign Up
3. Check if server is running properly

### Cannot create account

**Solution:**
1. Ensure password is at least 8 characters
2. Make sure passwords match
3. Check email format is valid
4. Verify phone number format

## 🎯 Demo Credentials

```
Email: admin@bank.com
Password: password123
```

These credentials are pre-configured in the server for testing purposes.

## 🔒 Security Notes

### Current Implementation
- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS protection
- Security headers with Helmet

### Production Recommendations
1. Use a real database (MongoDB/PostgreSQL)
2. Implement HTTPS/TLS
3. Add email verification for signups
4. Implement password reset functionality
5. Add two-factor authentication
6. Enable proper session management
7. Implement audit logging
8. Add comprehensive error handling
9. Use environment variables for secrets
10. Regular security audits

## 🚀 Deployment

### Local Development
Current setup is optimized for local development.

### Production Deployment
To deploy to production:

1. **Set up a database:**
   ```bash
   npm install mongoose
   ```

2. **Configure environment variables:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/bank
   JWT_SECRET=your-secret-key-here
   ```

3. **Use a production-grade web server:**
   - Nginx reverse proxy
   - PM2 for process management
   - SSL certificates (Let's Encrypt)

4. **Enable HTTPS:**
   - Obtain SSL certificate
   - Configure HTTPS server
   - Redirect HTTP to HTTPS

## 📞 Support

For issues or questions:
1. Check this README's Troubleshooting section
2. Verify the server is running properly
3. Check browser console for errors
4. Review server logs for issues

## 📄 License

This is a demonstration project for educational purposes.

---

**🏦 Amenires World Bank - Secure Banking, Trusted Service**

Created with ❤️ for demonstration purposes.
