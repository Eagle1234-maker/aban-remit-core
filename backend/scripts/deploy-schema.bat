@echo off
REM =====================================================
REM ABAN REMIT - Windows Deployment Script
REM =====================================================
REM This script deploys the database schema to production
REM without requiring password input
REM =====================================================

echo.
echo =====================================================
echo ABAN REMIT PRODUCTION SCHEMA DEPLOYMENT
echo =====================================================
echo Database: fkmqtves_aban_remit
echo User: fkmqtves
echo Host: localhost:5432
echo =====================================================
echo.

REM Set PostgreSQL password environment variable
set PGPASSWORD=.cQN@93%%XqK5T[JT

REM Run the deployment script
psql -U fkmqtves -d fkmqtves_aban_remit -h localhost -p 5432 -f deploy-production-schema.sql

REM Clear password from environment
set PGPASSWORD=

echo.
echo =====================================================
echo Deployment script completed
echo =====================================================
echo.
echo If you see errors above, check:
echo 1. PostgreSQL is running
echo 2. Database fkmqtves_aban_remit exists
echo 3. User fkmqtves has proper permissions
echo 4. Password is correct
echo.

pause
