# PostgreSQL Authentication Configuration (pg_hba.conf)

## Current Issue

Node.js applications cannot connect to PostgreSQL using password authentication. Error:
```
password authentication failed for user "fkmqtves"
code: '28P01'
```

## Root Cause

The PostgreSQL server's `pg_hba.conf` file is configured to allow connections only through:
- Unix socket peer authentication (how your database tool connects)
- Trust authentication for local connections

It does NOT allow password authentication (`md5` or `scram-sha-256`) for TCP connections from localhost.

## Solution

You need to modify the `pg_hba.conf` file on your PostgreSQL server to allow password authentication.

### Step 1: Locate pg_hba.conf

On your PostgreSQL server, find the configuration file:

```bash
# Find the config file location
psql -U postgres -c "SHOW hba_file;"

# Common locations:
# - /etc/postgresql/10/main/pg_hba.conf (Debian/Ubuntu)
# - /var/lib/pgsql/10/data/pg_hba.conf (RedHat/CentOS)
# - cPanel: Usually in /var/lib/pgsql/data/pg_hba.conf
```

### Step 2: Backup Current Configuration

```bash
sudo cp /path/to/pg_hba.conf /path/to/pg_hba.conf.backup
```

### Step 3: Edit pg_hba.conf

Add or modify the following lines in `pg_hba.conf`:

```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Allow password authentication for fkmqtves user from localhost
host    fkmqtves_aban_remit    fkmqtves    127.0.0.1/32           md5
host    fkmqtves_aban_remit    fkmqtves    ::1/128                md5

# Or allow for all databases (less secure)
host    all             fkmqtves        127.0.0.1/32            md5
host    all             fkmqtves        ::1/128                 md5
```

**Important:** Place these lines BEFORE any more general rules (like `host all all ... reject`).

### Step 4: Reload PostgreSQL Configuration

```bash
# Reload configuration (doesn't disconnect existing connections)
sudo systemctl reload postgresql

# Or if using pg_ctl
sudo -u postgres pg_ctl reload -D /var/lib/pgsql/data

# Or from within PostgreSQL
psql -U postgres -c "SELECT pg_reload_conf();"
```

### Step 5: Test Connection

From your Windows machine, test the connection:

```powershell
cd backend
npx tsx test-pg-connection.ts
```

You should see:
```
✓ CONNECTION TEST SUCCESSFUL
```

## Understanding pg_hba.conf Format

```
TYPE  DATABASE  USER      ADDRESS       METHOD
```

- **TYPE**: `local` (Unix socket) or `host` (TCP/IP)
- **DATABASE**: Database name or `all`
- **USER**: PostgreSQL user or `all`
- **ADDRESS**: IP address/CIDR (for `host` type only)
  - `127.0.0.1/32` = localhost IPv4
  - `::1/128` = localhost IPv6
- **METHOD**: Authentication method
  - `trust` = No password required (insecure)
  - `peer` = OS user must match PostgreSQL user (Unix socket only)
  - `md5` = MD5-hashed password
  - `scram-sha-256` = More secure password hashing (PostgreSQL 10+)

## Recommended Configuration for Production

```conf
# Local Unix socket connections (peer authentication)
local   all             postgres                                peer
local   all             all                                     peer

# TCP/IP connections from localhost (password required)
host    fkmqtves_aban_remit    fkmqtves    127.0.0.1/32       scram-sha-256
host    fkmqtves_aban_remit    fkmqtves    ::1/128            scram-sha-256

# Reject all other connections
host    all             all             0.0.0.0/0               reject
host    all             all             ::/0                    reject
```

## cPanel-Specific Instructions

If you're using cPanel PostgreSQL:

1. **Access via WHM** (if you have root access):
   - WHM → Service Configuration → PostgreSQL Configuration
   - Look for "Host Access Control" or similar

2. **Access via SSH**:
   ```bash
   sudo nano /var/lib/pgsql/data/pg_hba.conf
   ```

3. **Reload PostgreSQL**:
   ```bash
   sudo systemctl reload postgresql-10
   # or
   sudo /usr/local/cpanel/scripts/restartsrv_postgres
   ```

## Alternative: SSH Tunnel (If You Can't Modify pg_hba.conf)

If you don't have access to modify `pg_hba.conf`, you can use an SSH tunnel:

1. **Set up SSH tunnel** (from Windows):
   ```powershell
   ssh -L 5432:localhost:5432 your-user@your-server.com
   ```

2. **Update .env** to use the tunnel:
   ```env
   DATABASE_URL="postgresql://fkmqtves:password@localhost:5432/fkmqtves_aban_remit?sslmode=disable"
   ```

3. **Keep the SSH connection open** while your application runs.

## Troubleshooting

### Still Getting Authentication Errors?

1. **Check if changes were applied**:
   ```sql
   SELECT * FROM pg_hba_file_rules;
   ```

2. **Verify user password**:
   ```sql
   ALTER USER fkmqtves WITH PASSWORD '.cQN@93%XqK5T[JT';
   ```

3. **Check PostgreSQL logs**:
   ```bash
   sudo tail -f /var/log/postgresql/postgresql-10-main.log
   ```

4. **Verify PostgreSQL is listening on TCP**:
   ```bash
   netstat -an | grep 5432
   ```
   Should show: `127.0.0.1:5432` or `0.0.0.0:5432`

### PostgreSQL Not Listening on TCP?

Edit `postgresql.conf`:
```conf
listen_addresses = 'localhost'  # or '*' for all interfaces
port = 5432
```

Then restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

## Security Notes

- **Never use `trust` method** for TCP connections in production
- **Use `scram-sha-256`** instead of `md5` when possible (PostgreSQL 10+)
- **Limit connections** to specific databases and users
- **Use strong passwords** for database users
- **Consider firewall rules** to restrict access to PostgreSQL port

## Current Database Status

✅ Database schema deployed successfully
✅ All tables, indexes, and constraints created
✅ System wallets initialized
✅ Accessible via database tool (peer authentication)
❌ Node.js password authentication not configured

Once pg_hba.conf is updated, your Node.js application will be able to connect.
