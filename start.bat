@echo off
REM Amenires World Bank - Windows Startup Script
REM Keeps the server running and auto-restarts on failure

echo ╔════════════════════════════════════════════════════════════╗
echo ║        AMENIRES WORLD BANK - SERVER STARTUP                  ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if .env exists
if not exist .env (
    echo ⚠️  Warning: .env file not found
    echo Creating .env from .env.example...
    copy .env.example .env
    echo ✓ .env file created
    echo Please edit .env with your configurations
    echo.
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
    echo ✓ Dependencies installed
    echo.
)

REM Create database indexes
echo 🔧 Creating database indexes...
node scripts/createIndexes.js
echo ✓ Indexes created
echo.

REM Seed data if requested
if "%1"=="--seed" (
    echo 🌱 Seeding database...
    node scripts/seedData.js
    echo ✓ Data seeded
    echo.
)

REM Start the server with auto-restart
echo 🚀 Starting Amenires World Bank Server...
echo 🌐 Server will be available at: http://localhost:3000
echo 📱 Open in browser: http://localhost:3000
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Press Ctrl+C to stop the server
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

:START
echo 🔄 Starting server...
node server.js

echo ❌ Server stopped
echo ⏳ Waiting 5 seconds before restart...
timeout /t 5 /nobreak > nul

echo 🔄 Restarting server...
goto START
