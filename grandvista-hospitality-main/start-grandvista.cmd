@echo off
setlocal

set ROOT=%~dp0

where node > nul 2>&1
if errorlevel 1 (
    echo Node.js is not installed or is not available on PATH.
    exit /b 1
)

where npm > nul 2>&1
if errorlevel 1 (
    echo npm is not installed or is not available on PATH.
    exit /b 1
)

start "Eureka Server" /D "%ROOT%." cmd /k ".\mvnw.cmd -pl eureka-server spring-boot:run"
ping -n 5 127.0.0.1 > nul

start "API Gateway" /D "%ROOT%." cmd /k ".\mvnw.cmd -pl api-gateway spring-boot:run"
ping -n 5 127.0.0.1 > nul

start "Auth Service" /D "%ROOT%." cmd /k ".\mvnw.cmd -pl auth-service spring-boot:run"
ping -n 5 127.0.0.1 > nul

start "Room Service" /D "%ROOT%." cmd /k ".\mvnw.cmd -pl room-service spring-boot:run"
ping -n 5 127.0.0.1 > nul

start "Booking Service" /D "%ROOT%." cmd /k ".\mvnw.cmd -pl booking-service spring-boot:run"
ping -n 5 127.0.0.1 > nul

start "Payment Service" /D "%ROOT%." cmd /k ".\mvnw.cmd -pl payment-service spring-boot:run"
ping -n 5 127.0.0.1 > nul

start "Frontend" /D "%ROOT%\frontend" cmd /k "npm run dev -- --host 0.0.0.0"

echo GrandVista Hospitality startup launched.
echo Frontend: http://localhost:5173/
echo API Gateway: http://localhost:8080/
echo Eureka: http://localhost:8761/
