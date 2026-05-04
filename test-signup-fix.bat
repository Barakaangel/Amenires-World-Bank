@echo off
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                  ║
echo ║     🧪 SIGNUP FIX VERIFICATION - AMENIRES WORLD BANK             ║
echo ║                                                                  ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo 🔍 Checking server status...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Server is NOT running on port 3000
    echo.
    echo Starting server...
    start "Server" cmd /k "node pro-server.js"
    timeout /t 3 /nobreak >nul
    echo ✅ Server started
) else (
    echo ✅ Server is running
)
echo.

echo 📝 Opening test pages...
echo.

echo 1️⃣  Simplified Signup Page (Single form, no steps)
echo    http://localhost:3000/signup-simple.html
echo.

echo 2️⃣  Browser Test Tool (Interactive testing with sample data)
echo    http://localhost:3000/test-signup-browser.html
echo.

echo 3️⃣  Multi-Step Signup Page (Full 3-step form)
echo    http://localhost:3000/signup.html
echo.

echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo 📋 WHAT WAS FIXED:
echo.
echo ✅ Added validation for: accountType, country, currency
echo ✅ Shows specific missing fields in error message
echo ✅ Auto-navigates to step with errors
echo ✅ All required fields now properly checked
echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo 📝 TEST DATA (copy and paste):
echo.
echo Full Name:     Test User
echo Email:         test@example.com
echo Phone:         +1 555-123-4567
echo Account Type:  Personal Account
echo Country:       United States
echo Currency:      USD
echo Password:      Test123456!
echo Confirm:       Test123456!
echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo 🚀 Opening test pages in 3 seconds...
timeout /t 3 /nobreak >nul

start http://localhost:3000/signup-simple.html
timeout /t 1 /nobreak >nul
start http://localhost:3000/test-signup-browser.html

echo.
echo ✅ Test pages opened!
echo.
echo 💡 TIP: Start with signup-simple.html for easiest testing
echo.
echo Press any key to open multi-step signup page...
pause >nul

start http://localhost:3000/signup.html

echo.
echo ✅ Done! Good luck with testing!
echo.
pause
