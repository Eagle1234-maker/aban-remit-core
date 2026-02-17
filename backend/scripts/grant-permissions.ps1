# =====================================================
# ABAN REMIT - Grant Database Permissions Script
# =====================================================

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "ABAN REMIT - GRANT DATABASE PERMISSIONS" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will grant all necessary permissions to user 'fkmqtves'" -ForegroundColor Yellow
Write-Host "on database 'fkmqtves_aban_remit'" -ForegroundColor Yellow
Write-Host ""

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlPath) {
    Write-Host "ERROR: psql not found in PATH" -ForegroundColor Red
    Write-Host "Please install PostgreSQL client tools" -ForegroundColor Red
    exit 1
}

Write-Host "Running permission grant script..." -ForegroundColor Cyan
Write-Host ""

# Run the SQL script as postgres superuser
psql -U postgres -d fkmqtves_aban_remit -f grant-permissions.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor Green
    Write-Host "✓ PERMISSIONS GRANTED SUCCESSFULLY" -ForegroundColor Green
    Write-Host "=====================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "User 'fkmqtves' now has full access to:" -ForegroundColor Yellow
    Write-Host "  - Database: fkmqtves_aban_remit" -ForegroundColor White
    Write-Host "  - Schemas: public, auth, core, ledger, audit, services" -ForegroundColor White
    Write-Host "  - All tables, sequences, and functions" -ForegroundColor White
    Write-Host ""
    Write-Host "You can now test the connection:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor White
    Write-Host "  npx tsx test-db-connection.ts" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor Red
    Write-Host "✗ PERMISSION GRANT FAILED" -ForegroundColor Red
    Write-Host "=====================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "1. You need to run this as postgres superuser" -ForegroundColor White
    Write-Host "2. The database might not exist yet" -ForegroundColor White
    Write-Host "3. The schemas might not exist yet" -ForegroundColor White
    Write-Host ""
    Write-Host "Try running the deployment script first:" -ForegroundColor Yellow
    Write-Host "  .\deploy-schema.ps1" -ForegroundColor White
    Write-Host ""
}

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
