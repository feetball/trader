@echo off
title Crypto Trading Bot Dashboard
echo.
echo ========================================
echo   Crypto Trading Bot Dashboard
echo ========================================
echo.

echo Cleaning up existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Starting API Server on port 3001...
start "API Server" cmd /k "cd /d %~dp0 && npm run server"
timeout /t 3 /nobreak >nul

echo Starting Dashboard on port 3000...
start "Dashboard" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo Opening dashboard in browser...
start http://localhost:3000

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo   Dashboard:  http://localhost:3000
echo   API Server: http://localhost:3001
echo.
echo   Click 'Start Bot' in the dashboard to begin trading!
echo.
echo   To stop: Close the command windows
echo.
pause
