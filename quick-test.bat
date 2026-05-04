@echo off
echo ============================================
echo Amenires World Bank - Quick Auth Test
echo ============================================
echo.

REM Check if server is running
echo [1/3] Checking if server is running...
netstat -ano | findstr :3000 >nul
if %errorlevel% neq 0 (
    echo     Server not running. Starting server...
    start "Amenires World Bank Server" cmd /k "node pro-server.js"
    echo     Waiting for server to start...
    timeout /t 3 /nobreak >nul
) else (
    echo     ✓ Server is already running
)
echo.

REM Open test auth page
echo [2/3] Opening test auth page...
start http://localhost:3000/test-auth.html
echo     ✓ Test page opened
echo.

echo [3/3] Testing Instructions
echo.
echo ============================================
echo HOW TO TEST
echo ============================================
echo.
echo SIGNUP TEST:
echo   1. Click "Sign Up" tab
echo   2. Fill in:
echo      - Full Name: Test User
echo      - Email: test@example.com
echo      - Phone: +1 234 567 8900
echo      - Account Type: Individual
echo      - Country: United States
echo      - Currency: USD
echo      - Password: Test12345!
echo      - Confirm Password: Test12345!
echo      - Check "I accept Terms"
echo   3. Click "Create Account"
echo   4. Should see success message and redirect
echo.
echo LOGIN TEST:
echo   1. Click "Login" tab
echo   2. Use the credentials from signup
echo   3. Click "Login"
echo   4. Should see success and redirect to dashboard
echo.
echo DASHBOARD CHECK:
echo   1. After login, you should see dashboard
echo   2. Check your name is displayed
echo   3. Check account balance ($10,000 welcome bonus)
echo   4. Verify all features are accessible
echo.
echo ============================================
echo Press any key to close this window...
pause >nul
