@echo off
title Amenires World Bank - Complete System Startup
color 0B
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    AMENIRES WORLD BANK                              ║
echo ║                  Complete Banking System                            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo [1/5] Checking system requirements...
echo.

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo     ✗ Node.js not found. Please install Node.js first.
    pause
    exit /b
)
echo     ✓ Node.js installed

REM Check npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo     ✗ npm not found.
    pause
    exit /b
)
echo     ✓ npm installed

echo.
echo [2/5] Installing dependencies...
if not exist "node_modules" (
    call npm install
    echo     ✓ Dependencies installed
) else (
    echo     ✓ Dependencies already installed
)

echo.
echo [3/5] Checking if server is running...
netstat -ano | findstr :3000 >nul
if %errorlevel% neq 0 (
    echo     Server not running. Starting server...
    start "Amenires World Bank Server" cmd /k "node server-full.js"
    
    REM Wait for server to start
    echo     Waiting for server to start...
    timeout /t 5 /nobreak >nul
    echo     ✓ Server started
) else (
    echo     ✓ Server is already running
)

echo.
echo [4/5] Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:3000/login-enhanced.html
echo     ✓ Browser opened

echo.
echo [5/5] System ready!
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                     SYSTEM FEATURES                                 ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║                                                              ║
echo ║  ✓ User Registration & Authentication                           ║
echo ║  ✓ Social Login (Google, Facebook, WeChat)                   ║
echo ║  ✓ All World Countries (195+)                                   ║
echo ║  ✓ All Account Types                                              ║
echo ║  ✓ Investment Options                                              ║
echo ║  ✓ Corporate & Business Accounts                                   ║
echo ║  ✓ Bank Incorporation                                            ║
echo ║  ✓ Multi-Currency Support                                         ║
echo ║  ✓ Multi-Language Support (10 languages)                         ║
echo ║  ✓ Complete Dashboard                                             ║
echo ║  ✓ Transfers & Payments                                           ║
echo ║  ✓ Cards & Loans                                                ║
echo ║  ✓ Savings Goals                                                ║
echo ║  ✓ Notifications                                                 ║
echo ║  ✓ Professional Logo & Branding                                   ║
echo ║                                                              ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║                     SUPPORTED LANGUAGES                           ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  English  🇺🇸    Chinese   🇨🇳    Spanish   🇪🇸            ║
echo ║  French   🇫🇷    German    🇩🇪    Japanese  🇯🇵            ║
echo ║  Korean   🇰🇷    Arabic    🇸🇦    Portuguese 🇵🇹            ║
echo ║  Russian  🇷🇺                                                         ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║                     ACCOUNT TYPES                                 ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  Personal Banking 👤                                            ║
echo ║  Investment & Wealth 📈                                          ║
echo ║  Business & Corporate 🏢                                          ║
echo ║  International Banking 🌍                                        ║
echo ║  Special Accounts ⚖️                                             ║
echo ║  Bank Incorporation 🏦                                            ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║                     SOCIAL LOGIN                                  ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  Google        🇪  Facebook      🇪  WeChat        💬            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 📖 QUICK START GUIDE:
echo.
echo 1. Open the login page in your browser
echo 2. Choose your preferred language from the dropdown
echo 3. Login with email/password OR use social login (Google/FB/WeChat)
echo 4. Access your complete banking dashboard
echo 5. Explore all features: transfers, cards, loans, investments
echo.
echo 🌐 URL: http://localhost:3000
echo 🏦 Login: http://localhost:3000/login-enhanced.html
echo 📊 Dashboard: http://localhost:3000/dashboard.html
echo.
echo ══════════════════════════════════════════════════════════════
echo.
echo Press any key to close this window...
pause >nul
