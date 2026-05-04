# Quick Start Guide - Amenires World Bank

## 🚀 Get Started in 5 Minutes

### 1. Install Backend Dependencies
```bash
cd bank
npm install
```

### 2. Install Frontend Dependencies
```bash
cd client
npm install
cd ..
```

### 3. Configure Environment
Create `.env` file in the root directory:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/amenires_bank
JWT_SECRET=dev_secret_key_change_in_production
JWT_REFRESH_SECRET=refresh_secret_key
ENCRYPTION_KEY=32_character_encryption_key_here
```

### 4. Start MongoDB
```bash
# If using local MongoDB
# Windows: Start MongoDB service
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### 5. Start the Application
```bash
npm run dev
```

Application will be available at: **http://localhost:3000**

## 🌐 Access the Application

### Home Page
Open browser and navigate to: `http://localhost:3000`

### Create Account
1. Click "Open Account Now"
2. Fill in personal information
3. Select account type (Individual, Business, Royalty, Government, Country Owner)
4. Set up security (password generator available)
5. Verify email (in development, skip verification)

### Login
1. Click "Sign In"
2. Enter email and password
3. If 2FA is enabled, enter the code

### Dashboard Features
- View account balances
- Check recent transactions
- Transfer funds
- Manage beneficiaries
- Security settings
- Profile management

### Admin Dashboard
Login with admin credentials to access:
- User management
- Account monitoring
- Transaction oversight
- System health metrics
- Audit logs

## 🔐 Default Admin Account

For development, create first user with email: `admin@ameniresbank.com`
After registration, manually update role to 'admin' in MongoDB:

```javascript
use amenires_bank
db.users.updateOne(
  { email: "admin@ameniresbank.com" },
  { $set: { role: "admin" } }
)
```

## 📱 Testing the Application

### Test Registration
1. Go to `/register`
2. Fill form with test data
3. Use password generator for strong password
4. Complete all steps
5. Verify account created (check MongoDB)

### Test Login
1. Go to `/login`
2. Enter registered credentials
3. Verify successful login
4. Check dashboard loads

### Test Account Creation
1. Login to dashboard
2. Navigate to "Accounts"
3. Click "Create Account"
4. Select account type
5. Set initial deposit (optional)
6. Verify account appears

### Test Transfer
1. Create two accounts
2. Navigate to "Transfer"
3. Enter from/to accounts
4. Set amount
5. Submit transfer
6. Verify balances updated

## 🐛 Common Issues

### Port 3000 already in use
```bash
# Change port in .env
PORT=3001
```

### MongoDB connection failed
```bash
# Check MongoDB is running
mongod

# Or use MongoDB Atlas
# Update MONGODB_URI in .env
```

### Build errors
```bash
# Clear and reinstall
rm -rf node_modules
npm install
```

## 📚 Next Steps

1. **Configure Production Database**
   - Set up MongoDB Atlas
   - Update MONGODB_URI in .env

2. **Enable HTTPS**
   - Get SSL certificate
   - Update server.js for HTTPS
   - Set port to 443

3. **Deploy to Cloud**
   - Follow Deployment Guide
   - Configure environment variables
   - Set up monitoring

4. **Customize Application**
   - Update branding
   - Add custom features
   - Integrate additional services

## 🔗 Useful Links

- Full Documentation: `README.md`
- Deployment Guide: `DEPLOYMENT_GUIDE.md`
- API Documentation: See `/api` routes in code
- Support: support@ameniresbank.com

## ⚡ Tips for Development

- Use `npm run dev` for hot reload
- Check console for errors
- Use browser DevTools for debugging
- MongoDB Compass for database visualization
- Postman for API testing

## 🎯 Key Features to Test

1. ✅ Multi-step registration with validation
2. ✅ Secure password generator
3. ✅ Two-factor authentication (2FA)
4. ✅ Multiple account types
5. ✅ Real-time transfers
6. ✅ Transaction history
7. ✅ Admin dashboard
8. ✅ Security monitoring
9. ✅ User profile management
10. ✅ Session management

---

**Ready to start building the future of banking?** 🚀

Launch the application and begin exploring Amenires World Bank!
