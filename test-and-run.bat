@echo off
echo ============================================
echo   AMENIRES WORLD BANK
echo   Testing Signup & Login Functionality
echo ============================================
echo.

REM Check if server is already running
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Server is already running on port 3000
    echo.
    goto :run_test
)

echo [1/2] Starting Professional Server...
start "Amenires World Bank Server" cmd /k "node pro-server.js"

REM Wait for server to start
echo [WAIT] Waiting for server to start...
timeout /t 3 /nobreak >nul

echo [DONE] Server started!
echo.

:run_test
echo [2/2] Running Signup Test...
echo.
node test-signup.js

echo.
echo ============================================
echo   TEST COMPLETED
echo ============================================
echo.
echo To test manually:
echo 1. Open browser: http://localhost:3000/signup.html
echo 2. Fill out the registration form
echo 3. Click "Create Account"
echo 4. You should be redirected to login page
echo 5. Login with your email and password
echo.
echo Press any key to open browser...
pause >nul

start http://localhost:3000/signup.html

echo.
echo Done! Keep the server window open.
pause
