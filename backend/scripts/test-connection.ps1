# =====================================================
# ABAN REMIT - Database Connection Test Script
# =====================================================

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "ABAN REMIT DATABASE CONNECTION DIAGNOSTICS" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Check if psql is available
Write-Host "1. Checking if psql is installed..." -ForegroundColor Yellow
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if ($psqlPath) {
    Write-Host "   OK psql found at: $($psqlPath.Source)" -ForegroundColor Green
} else {
    Write-Host "   ERROR psql not found in PATH" -ForegroundColor Red
    Write-Host "   Please install PostgreSQL client tools" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check PostgreSQL service
Write-Host "2. Checking PostgreSQL service status..." -ForegroundColor Yellow
$pgServices = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if ($pgServices) {
    foreach ($service in $pgServices) {
        if ($service.Status -eq 'Running') {
            Write-Host "   OK $($service.Name): $($service.Status)" -ForegroundColor Green
        } else {
            Write-Host "   WARNING $($service.Name): $($service.Status)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   WARNING No PostgreSQL services found" -ForegroundColor Yellow
    Write-Host "   PostgreSQL might be running on a remote server or via cPanel" -ForegroundColor Yellow
}

Write-Host ""

# Test connection with different password attempts
Write-Host "3. Testing database connection..." -ForegroundColor Yellow
Write-Host ""

$passwords = @(
    @{Name="Decoded password"; Value=".cQN@93%XqK5T[JT"}
    @{Name="URL-encoded password"; Value=".cQN%4093%25XqK5T%5BJT"}
)

$connected = $false

foreach ($pwd in $passwords) {
    Write-Host "   Testing with $($pwd.Name)..." -ForegroundColor Cyan
    $env:PGPASSWORD = $pwd.Value
    
    $result = psql -U fkmqtves -d fkmqtves_aban_remit -h localhost -p 5432 -c "SELECT current_database(), current_user, version();" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK CONNECTION SUCCESSFUL!" -ForegroundColor Green
        Write-Host "   Database: fkmqtves_aban_remit" -ForegroundColor Green
        Write-Host "   User: fkmqtves" -ForegroundColor Green
        Write-Host ""
        Write-Host "   Use this password for deployment:" -ForegroundColor Yellow
        Write-Host "   $($pwd.Value)" -ForegroundColor White
        $connected = $true
        break
    } else {
        Write-Host "   ERROR Failed" -ForegroundColor Red
    }
    Write-Host ""
}

$env:PGPASSWORD = $null

if (-not $connected) {
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor Red
    Write-Host "CONNECTION FAILED WITH ALL PASSWORD ATTEMPTS" -ForegroundColor Red
    Write-Host "=====================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Verify the database exists:" -ForegroundColor Cyan
    Write-Host "   psql -U postgres -l" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Check if user exists:" -ForegroundColor Cyan
    Write-Host "   psql -U postgres -c \`"\du\`"" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Try connecting as postgres superuser:" -ForegroundColor Cyan
    Write-Host "   psql -U postgres -d fkmqtves_aban_remit" -ForegroundColor White
    Write-Host ""
    Write-Host "4. If this is a cPanel database:" -ForegroundColor Cyan
    Write-Host "   - Use phpPgAdmin to verify credentials" -ForegroundColor White
    Write-Host "   - Check if remote connections are allowed" -ForegroundColor White
    Write-Host "   - Verify the host is 'localhost' not a remote server" -ForegroundColor White
    Write-Host ""
    Write-Host "5. Reset the password via cPanel:" -ForegroundColor Cyan
    Write-Host "   - Go to cPanel > PostgreSQL Databases" -ForegroundColor White
    Write-Host "   - Find user 'fkmqtves'" -ForegroundColor White
    Write-Host "   - Click 'Change Password'" -ForegroundColor White
    Write-Host "   - Update .env file with new password" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor Green
    Write-Host "CONNECTION TEST PASSED" -ForegroundColor Green
    Write-Host "=====================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run the deployment script:" -ForegroundColor Yellow
    Write-Host "  .\deploy-schema.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
