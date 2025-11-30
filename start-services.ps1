#!/usr/bin/env powershell
# Startup script for both services

Write-Host "=== Starting Facial Attendance System ===" -ForegroundColor Cyan
Write-Host ""

# Stop any existing processes
Write-Host "Stopping existing processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "python" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start Backend
Write-Host "Starting Flask Backend (port 5000)..." -ForegroundColor Green
$backendPath = "c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1"
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:backendPath
    python facial_recognition_backend.py
}
Write-Host "Backend job started with ID: $($backendJob.Id)" -ForegroundColor Green

# Wait for backend to initialize
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Next.js Frontend (port 3000)..." -ForegroundColor Green
$frontendPath = "c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\web-dataset-collector"
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:frontendPath
    npm run dev
}
Write-Host "Frontend job started with ID: $($frontendJob.Id)" -ForegroundColor Green

Start-Sleep -Seconds 8

# Test services
Write-Host "`n=== Testing Services ===" -ForegroundColor Cyan
Write-Host ""

# Test Backend
Write-Host "Testing Backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/health" -TimeoutSec 5
    Write-Host "✓ Backend responding: " -ForegroundColor Green -NoNewline
    Write-Host "$($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend not responding" -ForegroundColor Red
}

# Test Frontend
Write-Host "Testing Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -TimeoutSec 5
    Write-Host "✓ Frontend responding: " -ForegroundColor Green -NoNewline
    Write-Host "$($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend not responding" -ForegroundColor Red
}

Write-Host "`n=== Services Running ===" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop all services"
Write-Host ""

# Keep script running and show output
while ($true) {
    $backendJob = Get-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
    $frontendJob = Get-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue
    
    if ($null -eq $backendJob -or $null -eq $frontendJob) {
        Write-Host "A service has stopped" -ForegroundColor Red
        break
    }
    
    Start-Sleep -Seconds 2
}
