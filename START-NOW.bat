@echo off
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║              🏦 AMENIRES WORLD BANK 🏦                   ║
echo ║                                                              ║
echo ║              COMPLETE BANKING SYSTEM - START                  ║
echo ║                                                              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check server
echo [1/4] Checking server status...
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo     ✓ Server is already running on port 3000
) else (
    echo     Starting server...
    start "Amenires World Bank Server" /min cmd /k "node server-full.js"
    echo     Waiting for server to start...
    timeout /t 5 /nobreak >nul
    echo     ✓ Server started
)

echo.
echo [2/4] Opening signup page with all countries...
timeout /t 2 /nobreak >nul
start http://localhost:3000/signup-final.html
echo     ✓ Browser opened

echo.
echo [3/4] Your complete banking system includes:
echo.
echo     ✓ 200+ Countries (All world countries)
echo     ✓ 50+ Currencies (All major currencies)
echo     ✓ 30+ Account Types (All banking options)
echo     ✓ Social Login (Google, Facebook, WeChat)
echo     ✓ Multi-Language (10 languages)
echo     ✓ Investments & Savings
echo     ✓ Bank Incorporation
echo     ✓ Session Persistence
echo     ✓ Professional Logo
echo     ✓ Complete Dashboard
echo.

echo [4/4] READY TO USE!
echo.

echo ╔════════════════════════════════════════════════════════════╗
echo ║  SYSTEM READY - OPEN YOUR BROWSER NOW                  ║
echo ╠══════════════════════════════════════════════════════════╣
echo ║                                                              ║
echo ║  URLs:                                                       ║
echo ║                                                              ║
echo ║  Signup:  http://localhost:3000/signup-final.html      ║
echo ║  Login:   http://localhost:3000/login-enhanced.html     ║
echo ║  Dashboard: http://localhost:3000/dashboard.html          ║
echo ║                                                              ║
echo ║  Features:                                                   ║
echo ║                                                              ║
echo ║  • 200+ Countries with full list                           ║
echo ║  • 50+ Currencies with auto-selection                     ║
echo ║  • 30+ Account Types including:                          ║
echo ║    - Personal (Checking, Savings, Student, Senior)          ║
echo ║    - Investment (Brokerage, Mutual Funds, 401k, IRA,      ║
echo ║      CD, Money Market, Forex, Crypto)                      ║
echo ║    - Business (Checking, Savings, Merchant, Payroll,         ║
echo ║      Treasury)                                            ║
echo ║    - International (Multi-Currency, Expat)                  ║
echo ║    - Special (Trust, Escrow)                              ║
echo ║    - Bank Incorporation (Branch, Digital, Subsidiary)       ║
echo ║                                                              ║
echo ║  • Social Login (Google, Facebook, WeChat)                   ║
echo ║  • Session Persistence (No login issues!)                      ║
echo ║  • Multi-Language (10 languages including Arabic RTL)           ║
echo ║  • Professional Logo & Branding                             ║
echo ║                                                              ║
echo ║  Your complete banking system is ready!                    ║
echo ║                                                              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Press any key to close this window...
pause >nul
