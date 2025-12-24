#!/usr/bin/env pwsh
# UniSphere Setup Script for Windows PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   UniSphere University Management     " -ForegroundColor Cyan
Write-Host "          Setup Script                 " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        docker info | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
if (-not (Test-DockerRunning)) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker is running" -ForegroundColor Green
Write-Host ""

# Install server dependencies
Write-Host "Installing server dependencies..." -ForegroundColor Yellow
Set-Location -Path ".\server"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install server dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Server dependencies installed" -ForegroundColor Green
Write-Host ""

# Install client dependencies
Write-Host "Installing client dependencies..." -ForegroundColor Yellow
Set-Location -Path "..\client"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install client dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Client dependencies installed" -ForegroundColor Green
Write-Host ""

# Go back to root
Set-Location -Path ".."

# Start MySQL with Docker Compose
Write-Host "Starting MySQL database..." -ForegroundColor Yellow
docker-compose up -d mysql
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start MySQL" -ForegroundColor Red
    exit 1
}

# Wait for MySQL to be ready
Write-Host "Waiting for MySQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "✓ MySQL is ready" -ForegroundColor Green
Write-Host ""

# Setup Prisma
Write-Host "Setting up Prisma (generating client and pushing schema)..." -ForegroundColor Yellow
Set-Location -Path ".\server"
npx prisma generate
npx prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Prisma setup had some warnings, but continuing..." -ForegroundColor Yellow
}
Write-Host "✓ Prisma setup complete" -ForegroundColor Green
Write-Host ""

# Create admin user
Write-Host "Creating admin user..." -ForegroundColor Yellow
npm run create-admin
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Admin user may already exist" -ForegroundColor Yellow
}
Write-Host ""

Set-Location -Path ".."

Write-Host "========================================" -ForegroundColor Green
Write-Host "   Setup Complete! 🎉                  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application, run:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Option 1 - Using Docker Compose (Recommended):" -ForegroundColor Yellow
Write-Host "    docker-compose up" -ForegroundColor White
Write-Host ""
Write-Host "  Option 2 - Manual start (3 separate terminals):" -ForegroundColor Yellow
Write-Host "    Terminal 1 (Database):  docker-compose up mysql" -ForegroundColor White
Write-Host "    Terminal 2 (Server):    cd server && npm run dev" -ForegroundColor White
Write-Host "    Terminal 3 (Client):    cd client && npm run dev" -ForegroundColor White
Write-Host "    Terminal 4 (Prisma UI): cd server && npx prisma studio" -ForegroundColor White
Write-Host ""
Write-Host "Application URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:     http://localhost:5173" -ForegroundColor White
Write-Host "  Backend API:  http://localhost:4000" -ForegroundColor White
Write-Host "  Prisma Studio: http://localhost:5555" -ForegroundColor White
Write-Host ""
Write-Host "Default Admin Credentials:" -ForegroundColor Cyan
Write-Host "  Email:    admin@admin.com" -ForegroundColor White
Write-Host "  Password: Admin123!" -ForegroundColor White
Write-Host ""
