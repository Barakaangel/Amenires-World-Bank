@echo off
title Amenires World Bank Server
color 0A
cls

echo.
echo ========================================
echo   AMENIRES WORLD BANK - SERVER START
echo ========================================
echo.

REM Kill any existing process on port 3000
echo [1/3] Checking for existing server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo    - Stopping existing process (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/3] Starting server...
node pro-server.js

echo.
echo ========================================
echo   SERVER STOPPED
echo ========================================
echo.
pause
