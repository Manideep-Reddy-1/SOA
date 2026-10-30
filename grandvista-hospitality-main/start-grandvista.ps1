$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Wait-ForHealth {
    param(
        [string]$Name,
        [int]$Port,
        [string]$HealthPath = '/actuator/health',
        [int]$MaxRetries = 25
    )

    Write-Host "Waiting for $Name on port $Port to be ready..." -NoNewline
    for ($i = 0; $i -lt $MaxRetries; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:$Port$HealthPath" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($resp -and ($resp.StatusCode -eq 200 -or $resp.StatusCode -eq 204)) {
                Write-Host " Ready!" -ForegroundColor Green
                return $true
            }
        } catch {
            # Not ready yet
        }
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
    Write-Host " Warning: $Name did not respond within timeout, continuing..." -ForegroundColor Yellow
    return $false
}

function Start-ServiceWindow {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [string]$Module,
        [int]$Port,
        [string]$HealthPath = '/actuator/health'
    )

    $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
    if ($listener) {
        try {
            Invoke-WebRequest -Uri "http://localhost:$Port$HealthPath" -TimeoutSec 2 | Out-Null
            Write-Host "$Name is already running on port $Port; skipping." -ForegroundColor Cyan
            return
        } catch {
            Write-Warning "Port $Port is in use, but health check failed. Please run stop-grandvista.ps1 if needed."
        }
    }

    $cmdLine = "cmd.exe /c `"$WorkingDirectory\mvnw.cmd`" -pl $Module spring-boot:run"
    $argsString = @(
        '-NoExit',
        '-Command',
        "Set-Location '$WorkingDirectory'; Write-Host 'Starting $Name on port $Port...'; $cmdLine"
    )

    Start-Process powershell -ArgumentList $argsString -WindowStyle Normal
    Write-Host "Launched $Name in a new terminal window." -ForegroundColor Green
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       Starting GrandVista Hospitality Microservices       " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start Eureka Server
Start-ServiceWindow -Name 'Eureka Server' -WorkingDirectory $projectRoot -Module 'eureka-server' -Port 8761
Wait-ForHealth -Name 'Eureka Server' -Port 8761 -HealthPath '/actuator/health' -MaxRetries 20

# 2. Start Gateway and Core Microservices
Start-ServiceWindow -Name 'API Gateway' -WorkingDirectory $projectRoot -Module 'api-gateway' -Port 8080
Start-Sleep -Seconds 3

Start-ServiceWindow -Name 'Auth Service' -WorkingDirectory $projectRoot -Module 'auth-service' -Port 8081
Start-Sleep -Seconds 3

Start-ServiceWindow -Name 'Room Service' -WorkingDirectory $projectRoot -Module 'room-service' -Port 8082
Start-Sleep -Seconds 3

Start-ServiceWindow -Name 'Payment Service' -WorkingDirectory $projectRoot -Module 'payment-service' -Port 8084
Start-Sleep -Seconds 3

Start-ServiceWindow -Name 'Booking Service' -WorkingDirectory $projectRoot -Module 'booking-service' -Port 8083
Start-Sleep -Seconds 3

# 3. Start React Frontend
if (-not (Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue)) {
    $frontendDir = Join-Path $projectRoot 'frontend'
    $frontendCmd = "cmd.exe /c npm run dev -- --host 0.0.0.0"
    $frontendArgs = @(
        '-NoExit',
        '-Command',
        "Set-Location '$frontendDir'; Write-Host 'Starting GrandVista React Frontend on port 5173...'; $frontendCmd"
    )
    Start-Process powershell -ArgumentList $frontendArgs -WindowStyle Normal
    Write-Host "Launched Frontend in a new terminal window." -ForegroundColor Green
} else {
    Write-Host "Frontend is already running on port 5173." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " GrandVista Hospitality stack is starting up!             " -ForegroundColor Green
Write-Host " Frontend Portal:   http://localhost:5173/                " -ForegroundColor White
Write-Host " API Gateway:       http://localhost:8080/                " -ForegroundColor White
Write-Host " Eureka Dashboard:  http://localhost:8761/                " -ForegroundColor White
Write-Host " Swagger Room API:  http://localhost:8080/rooms/swagger-ui.html" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Green
