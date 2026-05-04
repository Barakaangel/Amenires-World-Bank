@echo off
chcp 65001 >nul
title Amenires World Bank - Country & Currency Selection Test

echo ================================================================
echo       🌍 Amenires World Bank - Test System
echo ================================================================
echo.
echo 正在启动测试...
echo.

REM Start server if not running
netstat -ano | findstr :3000 >nul
if %errorlevel% neq 0 (
    echo [1/2] 启动服务器...
    start "Bank Server" cmd /k "node server-full.js"
    timeout /t 3 /nobreak >nul
) else (
    echo [1/2] ✓ 服务器已在运行
)

REM Open test page
echo [2/2] 打开测试页面...
start http://localhost:3000/test-countries.html

timeout /t 2 /nobreak >nul

echo.
echo ================================================================
echo               ✅ 系统已启动!
echo ================================================================
echo.
echo 📊 测试页面: http://localhost:3000/test-countries.html
echo 📝 注册页面: http://localhost:3000/signup-final.html
echo 🌍 国家数量: 200+
echo 💱 货币数量: 50+
echo.
echo ================================================================
echo.
echo 按任意键关闭此窗口...
pause >nul
