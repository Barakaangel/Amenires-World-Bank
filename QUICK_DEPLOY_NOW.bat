@echo off
echo ========================================
echo   AMENIRES WORLD BANK - QUICK DEPLOY
echo ========================================
echo.

echo [1/3] Preparing files for deployment...
echo.
cd /d "%~dp0"

echo [2/3] Latest git status:
git status
echo.

echo [3/3] Pushing latest changes to GitHub...
git add .
git commit -m "Fix deployment configuration for all platforms"
git push

echo.
echo ========================================
echo   CODE PUSHED TO GITHUB SUCCESSFULLY!
echo ========================================
echo.
echo NEXT STEPS:
echo.
echo 1. GITHUB PAGES:
echo    - Visit: https://github.com/Barakaangel/Amenires-World-Bank/settings/pages
echo    - Enable Pages for main branch
echo    - Wait 2-5 minutes
echo    - Access: https://barakaangel.github.io/Amenires-World-Bank/
echo.
echo 2. NETLIFY (Fastest - 30 seconds):
echo    - Visit: https://app.netlify.com/drop
echo    - Drag and drop the 'public' folder
echo    - Your site is INSTANTLY live!
echo.
echo 3. VERCEL:
echo    - Visit: https://vercel.com/new
echo    - Import: Barakaangel/Amenires-World-Bank
echo    - Click Deploy
echo.
echo DEMO CREDENTIALS:
echo   Email: demo@amenires.worldbank.com
echo   Password: demo123
echo.
echo ========================================
echo.
pause
