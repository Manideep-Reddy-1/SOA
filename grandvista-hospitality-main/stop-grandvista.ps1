$ports = @(8761, 8080, 8081, 8082, 8083, 8084, 5173)

Write-Host "Stopping any running GrandVista services on ports: $($ports -join ', ')..."

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $pidToKill = $conn.OwningProcess
            if ($pidToKill -and $pidToKill -ne 0) {
                try {
                    $proc = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue
                    if ($proc) {
                        Write-Host "Terminating process $($proc.ProcessName) (PID: $pidToKill) on port $port..."
                        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                    }
                } catch {
                    Write-Warning "Could not stop PID $pidToKill: $_"
                }
            }
        }
    }
}

Write-Host "All GrandVista services have been stopped."
