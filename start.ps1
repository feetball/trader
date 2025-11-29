# Start Trading Bot Dashboard
# This script starts both the API server and the Vue dashboard

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Crypto Trading Bot Dashboard" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill any existing node processes on our ports
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start API Server in background
Write-Host "Starting API Server on port 3001..." -ForegroundColor Green
$serverJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run server" -PassThru

Start-Sleep -Seconds 3

# Start Frontend Dashboard in background
Write-Host "Starting Dashboard on port 3000..." -ForegroundColor Green
$dashboardJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev" -PassThru

Start-Sleep -Seconds 3

# Open browser
Write-Host ""
Write-Host "Opening dashboard in browser..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All services started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Dashboard:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  API Server: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Click 'Start Bot' in the dashboard to begin trading!" -ForegroundColor Yellow
Write-Host ""
Write-Host "  To stop: Close the PowerShell windows" -ForegroundColor Gray
Write-Host ""
