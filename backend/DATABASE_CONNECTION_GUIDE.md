# Database Connection Resolution Guide

**Status**: ⚠️ Connection Failed - Azure hostname unreachable  
**Date**: February 17, 2026

## Current Problem

Your `.env` file contains an Azure PostgreSQL connection string:
```
DATABASE_URL="postgresql://fkmqtves:Laban2024@fkmqtves.postgres.database.azure.com:5432/fkmqtves_aban_remit?sslmode=require"
```

But the error shows:
```
Can't reach database server at fkmqtves.postgres.database.azure.com:5432
DNS resolution failed - hostname does not exist
```

## Solution Options

### Option 1: cPanel Database (Production - Recommended)

If your database is hosted on cPanel, you need the correct hostname.

#### Step 1: Get cPanel Database Connection Details

1. Log into your cPanel account
2. Go to **PostgreSQL Databases**
3. Look for connection information (usually shows):
   - **Host**: Your domain or server IP (e.g., `yourdomain.com` or `123.45.67.89`)
   - **Database**: `fkmqtves_aban_remit`
   - **User**: `fkmqtves`
   - **Port**: `5432` (default)

#### Step 2: Update `.env` File

Replace the DATABASE_URL with your cPanel details:

```env
# For cPanel with domain hostname
DATABASE_URL="postgresql://fkmqtves:Laban2024@yourdomain.com:5432/fkmqtves_aban_remit"

# OR for cPanel with IP address
DATABASE_URL="postgresql://fkmqtves:Laban2024@123.45.67.89:5432/fkmqtves_aban_remit"

# OR for cPanel with localhost (if running on same server)
DATABASE_URL="postgresql://fkmqtves:Laban2024@localhost:5432/fkmqtves_aban_remit"
```

**Note**: Remove `?sslmode=require` unless your cPanel specifically requires SSL.

#### Step 3: Enable Remote Access (if connecting from your local machine)

1. In cPanel → **PostgreSQL Databases**
2. Scroll to **Remote Database Access Hosts**
3. Add your current IP address (or `%` for any IP - not recommended for production)
4. Click **Add Host**

#### Step 4: Test Connection

```powershell
cd backend

# Test with Node.js
npm run validate

# OR test with psql (if installed)
$env:PGPASSWORD="Laban2024"
psql -U fkmqtves -h YOUR_CPANEL_HOST -d fkmqtves_aban_remit -c "SELECT version();"
```

---

### Option 2: Local PostgreSQL (Development Only)

If you want to develop locally with a PostgreSQL database on your Windows machine:

#### Step 1: Install PostgreSQL

```powershell
# Using Chocolatey (if installed)
choco install postgresql

# OR download installer from:
# https://www.postgresql.org/download/windows/
```

#### Step 2: Create Local Database

```powershell
# Connect as postgres superuser
psql -U postgres

# In psql prompt:
CREATE DATABASE fkmqtves_aban_remit;
CREATE USER fkmqtves WITH PASSWORD 'Laban2024';
GRANT ALL PRIVILEGES ON DATABASE fkmqtves_aban_remit TO fkmqtves;
\q
```

#### Step 3: Update `.env` for Local Development

```env
DATABASE_URL="postgresql://fkmqtves:Laban2024@localhost:5432/fkmqtves_aban_remit"
```

#### Step 4: Deploy Schema

```powershell
cd backend

# Option A: Using Prisma
npx prisma db push

# Option B: Using SQL script
psql -U fkmqtves -d fkmqtves_aban_remit -f scripts/deploy-all-migrations.sql
```

---

### Option 3: Unix Socket Connection (cPanel on Same Server)

If your application runs on the same server as the database (common with cPanel):

```env
# Unix socket path (check with your hosting provider)
DATABASE_URL="postgresql://fkmqtves:Laban2024@/fkmqtves_aban_remit?host=/var/run/postgresql"
```

---

## Verification Steps

After updating the connection string, verify it works:

### 1. Test Database Connection

```powershell
cd backend
npm run validate
```

### 2. Check Prisma Connection

```powershell
npx prisma db pull
```

This should show your database schema if connection is successful.

### 3. Run PostgreSQL Validation

```powershell
# Generate Prisma client first
npx prisma generate

# Run validation
npm run validate
```

---

## Common Issues & Solutions

### Issue: "password authentication failed"

**Solution**: 
- Verify password in cPanel → PostgreSQL Databases
- Reset password if needed
- Update `.env` with correct password

### Issue: "no pg_hba.conf entry for host"

**Solution**:
- Add your IP to Remote Database Access Hosts in cPanel
- OR connect from the same server (localhost)

### Issue: "database does not exist"

**Solution**:
- Create database in cPanel → PostgreSQL Databases
- Verify database name matches exactly

### Issue: "role does not exist"

**Solution**:
- Create user in cPanel → PostgreSQL Databases
- Verify username matches exactly

---

## Next Steps After Connection Success

1. **Deploy Database Schema**:
   ```powershell
   cd backend
   npx prisma db push
   ```

2. **Generate Prisma Client**:
   ```powershell
   npx prisma generate
   ```

3. **Run Full Validation**:
   ```powershell
   npm run validate
   ```

4. **Test API Endpoints**:
   ```powershell
   # Start server
   npm run dev
   
   # Test health endpoint
   curl http://localhost:3000/system/health
   ```

---

## Contact Information

If you continue to have connection issues:

1. **Check cPanel Documentation**: Look for "PostgreSQL Remote Access" guide
2. **Contact Hosting Provider**: Ask for PostgreSQL connection details
3. **Verify Database Exists**: Use phpPgAdmin in cPanel to confirm

---

**Action Required**: Please provide the correct database hostname from your cPanel or confirm if you want to set up a local PostgreSQL database for development.
