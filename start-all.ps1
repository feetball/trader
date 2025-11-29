# Crypto Trading Bot - Full Stack Startup Script
# PowerShell version

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Crypto Trading Bot - Full Stack" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting all services..." -ForegroundColor Yellow
Write-Host ""

# Start Trading Bot
Write-Host "[1/3] Starting Trading Bot..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal
Start-Sleep -Seconds 2

# Start API Server
Write-Host "[2/3] Starting API Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run server" -WindowStyle Normal
Start-Sleep -Seconds 2

# Start Dashboard
Write-Host "[3/3] Starting Dashboard..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dashboard" -WindowStyle Normal
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "All services started!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Trading Bot:  " -NoNewline -ForegroundColor White
Write-Host "Running in background" -ForegroundColor Yellow
Write-Host "API Server:   " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3001" -ForegroundColor Cyan
Write-Host "Dashboard:    " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening dashboard in browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Press Ctrl+C to exit (services will continue running)" -ForegroundColor Yellow
Write-Host "To stop all services, close all PowerShell windows" -ForegroundColor Yellow
Write-Host ""

# Keep script running
while ($true) {
    Start-Sleep -Seconds 1
}
