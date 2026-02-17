# cPanel PostgreSQL Database Setup Guide

## Overview

Your database `fkmqtves_aban_remit` is hosted on a cPanel server, not on your local Windows machine. This guide will help you connect and deploy the schema.

## Connection Methods

### Option 1: Deploy via phpPgAdmin (Recommended for cPanel)

1. **Log into cPanel**
   - Go to your cPanel URL
   - Navigate to **Databases** → **phpPgAdmin**

2. **Select Your Database**
   - Click on `fkmqtves_aban_remit` in the left sidebar

3. **Run the Migration SQL**
   - Click on the **SQL** tab
   - Copy the contents of `backend/scripts/deploy-all-migrations.sql`
   - Paste into the SQL query box
   - Click **Execute**

4. **Verify Deployment**
   - Check for any error messages
   - Navigate to the schemas to see the created tables

### Option 2: SSH Tunnel (If SSH Access Available)

If your cPanel hosting provides SSH access:

```bash
# Create SSH tunnel
ssh -L 5432:localhost:5432 your_username@your_cpanel_server.com

# In another terminal, run deployment
cd backend/scripts
$env:PGPASSWORD = ".cQN@93%XqK5T[JT"
psql -U fkmqtves -d fkmqtves_aban_remit -h localhost -p 5432 -f deploy-all-migrations.sql
```

### Option 3: Remote Connection (If Allowed)

If your cPanel allows remote PostgreSQL connections:

1. **Add Your IP to Remote Access**
   - Go to cPanel → **PostgreSQL Databases**
   - Scroll to **Remote Database Access Hosts**
   - Add your current IP address

2. **Get the Remote Host**
   - Usually: `your_domain.com` or `server_ip_address`
   - Check cPanel for the exact hostname

3. **Update Connection String**
   ```powershell
   $env:PGPASSWORD = ".cQN@93%XqK5T[JT"
   psql -U fkmqtves -d fkmqtves_aban_remit -h YOUR_CPANEL_HOST -p 5432 -f deploy-all-migrations.sql
   ```

## Troubleshooting

### Password Issues

1. **Verify Password in cPanel**
   - Go to cPanel → **PostgreSQL Databases**
   - Find user `fkmqtves`
   - Note: You cannot view the password, only reset it

2. **Reset Password**
   - Click **Change Password** next to the user
   - Set a new password
   - Update `backend/.env` with the new password (URL-encoded)

### Connection Refused

If you get "connection refused":
- The database is on a remote server
- Use phpPgAdmin or SSH tunnel instead
- Check if remote connections are enabled

### Database Doesn't Exist

If the database doesn't exist:
1. Go to cPanel → **PostgreSQL Databases**
2. Create database: `fkmqtves_aban_remit`
3. Assign user `fkmqtves` to the database with ALL PRIVILEGES

## Recommended Approach for cPanel

**Use phpPgAdmin** - It's the most reliable method for cPanel-hosted databases:

1. Open phpPgAdmin from cPanel
2. Select your database
3. Go to SQL tab
4. Copy and paste the entire contents of `backend/scripts/deploy-all-migrations.sql`
5. Execute

This bypasses all connection and authentication issues.

## After Successful Deployment

Update your `.env` file with the correct connection details:

```env
# For remote cPanel database
DATABASE_URL="postgresql://fkmqtves:PASSWORD@YOUR_CPANEL_HOST:5432/fkmqtves_aban_remit?schema=public"

# For SSH tunnel
DATABASE_URL="postgresql://fkmqtves:PASSWORD@localhost:5432/fkmqtves_aban_remit?schema=public"
```

## Verification

After deployment, verify the schema was created:

```sql
-- Check schemas
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name IN ('auth', 'core', 'ledger', 'audit', 'services');

-- Check tables
SELECT schemaname, COUNT(*) 
FROM pg_tables 
WHERE schemaname IN ('auth', 'core', 'ledger', 'audit', 'services')
GROUP BY schemaname;

-- Check system accounts
SELECT id, type, state FROM core.wallets WHERE type = 'SYSTEM';
```

Expected results:
- 5 schemas created
- 18 tables total
- 5 system wallets

## Need Help?

If you're still having issues:
1. Check cPanel error logs
2. Verify PostgreSQL version (should be 10.23+)
3. Ensure user has proper permissions
4. Contact your hosting provider for PostgreSQL access details
