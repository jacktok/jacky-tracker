@echo off
echo Starting Jacky Money Tracker on Local Network (Docker Backend)...
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
echo Backend API will be available at: http://%LOCAL_IP%:3001
echo.

REM Start Docker backend
echo Starting Docker backend (API + Database)...
start "Docker Backend" cmd /k "docker-compose up"

REM Wait a moment for Docker to start
echo Waiting for Docker services to start...
timeout /t 10 /nobreak >nul

REM Start frontend server
echo Starting frontend server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Services are starting...
echo - Docker backend (API + Database) is starting...
echo - Frontend server is starting...
echo.
echo You can now access the app from other devices on your network at:
echo http://%LOCAL_IP%:5173
echo.
echo Note: Make sure Docker Desktop is running!
echo.
pause
