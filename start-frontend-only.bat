@echo off
echo Starting Frontend Only (Backend should be running in Docker)...
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found
    )
)
:found

echo Your local IP address is: %LOCAL_IP%
echo.
echo Frontend will be available at: http://%LOCAL_IP%:5173
echo Make sure Docker backend is running: docker-compose up
echo.

REM Start frontend server
echo Starting frontend server...
npm run dev

pause
