@echo off
echo Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel%==0 (
    echo All Node.js processes stopped.
) else (
    echo No Node.js processes were running.
)
pause
