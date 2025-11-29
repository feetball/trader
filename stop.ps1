# Stop all trading bot processes
Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow

$processes = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($processes) {
    $processes | Stop-Process -Force
    Write-Host "Stopped $($processes.Count) Node.js process(es)" -ForegroundColor Green
} else {
    Write-Host "No Node.js processes running" -ForegroundColor Cyan
}

Write-Host "All services stopped." -ForegroundColor Green
