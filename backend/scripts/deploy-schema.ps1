# =====================================================
# ABAN REMIT - PowerShell Deployment Script
# =====================================================
# This script deploys the database schema to production
# =====================================================

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "ABAN REMIT PRODUCTION SCHEMA DEPLOYMENT" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Database: fkmqtves_aban_remit" -ForegroundColor Yellow
Write-Host "User: fkmqtves" -ForegroundColor Yellow
Write-Host "Host: localhost:5432" -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Set PostgreSQL password environment variable
$env:PGPASSWORD = ".cQN@93%XqK5T[JT"

Write-Host "Testing database connection..." -ForegroundColor Yellow

# Test connection first
$testResult = psql -U fkmqtves -d fkmqtves_aban_remit -h localhost -p 5432 -c "SELECT version();" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Connection successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deploying schema migrations..." -ForegroundColor Yellow
    
    # Run the deployment script
    psql -U fkmqtves -d fkmqtves_aban_remit -h localhost -p 5432 -f deploy-all-migrations.sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=====================================================" -ForegroundColor Green
        Write-Host "✓ DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "=====================================================" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "=====================================================" -ForegroundColor Red
        Write-Host "✗ DEPLOYMENT FAILED" -ForegroundColor Red
        Write-Host "=====================================================" -ForegroundColor Red
        Write-Host "Check the error messages above for details" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor Red
    Write-Host "✗ CONNECTION FAILED" -ForegroundColor Red
    Write-Host "=====================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "1. PostgreSQL is not running" -ForegroundColor White
    Write-Host "2. Database 'fkmqtves_aban_remit' does not exist" -ForegroundColor White
    Write-Host "3. User 'fkmqtves' does not exist or password is incorrect" -ForegroundColor White
    Write-Host "4. User 'fkmqtves' does not have access to the database" -ForegroundColor White
    Write-Host ""
    Write-Host "To check if PostgreSQL is running:" -ForegroundColor Yellow
    Write-Host "  Get-Service -Name postgresql*" -ForegroundColor White
    Write-Host ""
    Write-Host "To list databases:" -ForegroundColor Yellow
    Write-Host "  psql -U postgres -l" -ForegroundColor White
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $testResult -ForegroundColor Red
}

# Clear password from environment
$env:PGPASSWORD = $null

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
