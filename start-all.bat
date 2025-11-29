@echo off
echo ====================================
echo Crypto Trading Bot - Full Stack
echo ====================================
echo.
echo Starting all services...
echo.

echo [1/3] Starting Trading Bot...
start "Trading Bot" cmd /k "npm start"
timeout /t 2 /nobreak >nul

echo [2/3] Starting API Server...
start "API Server" cmd /k "npm run server"
timeout /t 2 /nobreak >nul

echo [3/3] Starting Dashboard...
start "Dashboard" cmd /k "npm run dashboard"
timeout /t 3 /nobreak >nul

echo.
echo ====================================
echo All services started!
echo ====================================
echo.
echo Trading Bot:  Running in background
echo API Server:   http://localhost:3001
echo Dashboard:    http://localhost:3000
echo.
echo Opening dashboard in browser...
timeout /t 2 /nobreak >nul
start http://localhost:3000
echo.
echo Press any key to stop all services...
pause >nul

echo.
echo Stopping all services...
taskkill /FI "WindowTitle eq Trading Bot*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq API Server*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Dashboard*" /T /F >nul 2>&1

echo Done!
