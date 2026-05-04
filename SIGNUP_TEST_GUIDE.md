# Signup and Login Testing Guide

## ✅ Quick Start (3 Steps)

### Step 1: Start the Server
Double-click: `test-and-run.bat`

This will:
- Start the professional server automatically
- Run automated signup tests
- Open the signup page in your browser

### Step 2: Test Signup Manually
1. Visit: http://localhost:3000/signup.html
2. Fill in all 3 steps:
   - **Step 1**: Personal Information (Name, Email, Phone)
   - **Step 2**: Account Details (Account Type, Country, Currency)
   - **Step 3**: Security (Password, Confirm Password, Terms)
3. Click "Create Account"
4. You should see success message
5. You'll be redirected to login page

### Step 3: Test Login
1. You'll be redirected to: http://localhost:3000/login.html
2. Your email will be pre-filled
3. Enter your password
4. Click "Sign In"
5. You should be redirected to dashboard

---

## 🧪 Automated Testing

### Run Signup Test Only
```bash
npm run test:signup
```

Or:
```bash
node test-signup.js
```

### What the test does:
1. Creates a test user account
2. Verifies server response
3. Checks account creation
4. Tests token generation
5. Displays results

---

## 📋 Manual Testing Checklist

### ✅ Signup Form Validation

#### Step 1 - Personal Information
- [ ] Name field accepts full name (e.g., "John Doe")
- [ ] Email validates format (e.g., "john@example.com")
- [ ] Phone accepts format (e.g., "+1 555-123-4567")
- [ ] "Continue" button validates all fields
- [ ] Can proceed to Step 2

#### Step 2 - Account Details
- [ ] Account Type dropdown works (Personal, Business, Student, Senior)
- [ ] Country dropdown works (US, UK, CA, AU, DE, FR)
- [ ] Currency dropdown works (USD, EUR, GBP, CAD, AUD)
- [ ] "Back" button returns to Step 1
- [ ] "Continue" button validates all fields
- [ ] Can proceed to Step 3

#### Step 3 - Security
- [ ] Password field accepts input
- [ ] Password strength meter updates in real-time
- [ ] Requirements checklist updates as you type:
  - [ ] At least 8 characters
  - [ ] One uppercase letter
  - [ ] One lowercase letter
  - [ ] One number
  - [ ] One special character
- [ ] Password visibility toggle works
- [ ] Confirm password field validates match
- [ ] Terms checkbox required
- [ ] "Create Account" button shows loading state
- [ ] Success message appears
- [ ] Redirected to login page

### ✅ Server Response

#### Successful Signup
- [ ] Server responds with status 201
- [ ] Response includes:
  - [ ] success: true
  - [ ] message: "Account created successfully"
  - [ ] data.user with all fields
  - [ ] data.account with account number and balance
  - [ ] data.token (JWT token)
- [ ] Console shows account creation log

#### Error Cases
- [ ] Duplicate email returns 409 status
- [ ] Missing fields returns 400 status
- [ ] Invalid email returns error
- [ ] Short password returns error
- [ ] Passwords don't match returns error

### ✅ Login Functionality

#### After Signup Redirect
- [ ] Email is pre-filled from signup
- [ ] Can enter password
- [ ] Can click "Sign In"
- [ ] Successfully logs in with new account
- [ ] Redirected to dashboard

#### Direct Login
- [ ] Can login with email and password
- [ ] Invalid password shows error
- [ ] Valid login redirects to dashboard
- [ ] Token is stored in localStorage

---

## 🔍 Debugging Tips

### Signup Fails

**If you see "Please provide all required fields":**
- Make sure all 3 steps are completed
- Check that name, email, phone, and country are filled
- Verify password is at least 8 characters

**If you see "Email already registered":**
- Use a different email address
- Or login with existing account

**If you see "Server error":**
- Check that server is running on port 3000
- Check browser console for errors
- Check server console for error logs

**If redirect doesn't work:**
- Wait 2 seconds after success message
- Manually visit: http://localhost:3000/login.html

### Login Fails

**If you see "Invalid email or password":**
- Verify email is correct (case insensitive)
- Verify password is exactly what you set
- Try creating a new account

**If you're not redirected:**
- Check that token is stored: localStorage.getItem('authToken')
- Manually visit: http://localhost:3000/dashboard.html

---

## 📊 Expected Results

### After Successful Signup:

**Server Console:**
```
✓ New account created: your@email.com (AWBXXXXXXXXXX)
```

**Browser Response:**
```json
{
  "success": true,
  "message": "Account created successfully! Welcome to Amenires World Bank!",
  "data": {
    "user": {
      "id": "...",
      "firstName": "Your",
      "lastName": "Name",
      "fullName": "Your Name",
      "email": "your@email.com",
      ...
    },
    "account": {
      "accountNumber": "AWBXXXXXXXXXX",
      "balance": 10000.00,
      "currency": "USD"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### After Successful Login:

**You should be redirected to:**
```
http://localhost:3000/dashboard.html
```

**Dashboard shows:**
- Welcome message with your name
- Account balance ($10,000 welcome bonus)
- Account number (AWBXXXXXXXXXX)
- Quick action buttons

---

## 🎯 Success Criteria

✅ **Signup Flow:**
1. User can fill all 3 steps
2. Form validation works correctly
3. Password strength indicator works
4. Account is created successfully
5. User receives welcome bonus ($10,000)
6. User is redirected to login
7. Email is pre-filled

✅ **Login Flow:**
1. User can login with new credentials
2. JWT token is generated and stored
3. User is redirected to dashboard
4. Dashboard shows correct user data

✅ **Error Handling:**
1. Duplicate emails are rejected
2. Invalid data shows clear errors
3. Server logs all operations
4. User-friendly error messages

---

## 🛠️ Common Issues & Solutions

### Issue: Port 3000 already in use
**Solution:**
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /F /PID [PID]
```

### Issue: Signup button not working
**Solution:**
- Check browser console (F12) for JavaScript errors
- Verify `auth.js` is loaded
- Check network tab for failed requests

### Issue: Server not responding
**Solution:**
```bash
# Check if server is running
curl http://localhost:3000/api/health

# Should return:
# {"success":true,"message":"Server is running"}
```

### Issue: Account not created after signup
**Solution:**
- Check server console for error logs
- Verify email format is correct
- Make sure all required fields are filled

---

## 📞 Support

If you encounter any issues:

1. Check the browser console (F12) for JavaScript errors
2. Check the server console for backend errors
3. Review the logs in the `test-signup.js` output
4. Verify all fields are filled correctly
5. Try creating a new account with different email

---

## ✨ Tips for Testing

1. **Test with different account types** - Try Personal, Business, Student
2. **Test with different currencies** - Try USD, EUR, GBP
3. **Test password strength** - Try weak, fair, good, strong passwords
4. **Test error cases** - Try duplicate email, short password, mismatched passwords
5. **Test form validation** - Try submitting empty fields
6. **Test navigation** - Try back buttons, step navigation

---

**🏦 Happy Testing! Your professional banking system is ready! 🏦**
