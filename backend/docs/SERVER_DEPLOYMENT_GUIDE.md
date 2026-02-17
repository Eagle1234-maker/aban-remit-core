# Server Deployment Guide

## Overview

This guide covers deploying your Node.js application on the same server as your PostgreSQL database, using Unix socket authentication (no password required).

## Prerequisites

- SSH access to your server
- Node.js installed on the server
- PostgreSQL 10.23 running on the server
- Database schema already deployed (✅ Complete)

## Deployment Steps

### 1. Upload Your Application

Upload your application files to the server:

```bash
# Using SCP from your local machine
scp -r backend/ user@your-server.com:/home/fkmqtves/aban-remit-backend/

# Or using Git
ssh user@your-server.com
cd /home/fkmqtves/
git clone https://github.com/your-repo/aban-remit-core.git
cd aban-remit-core/backend
```

### 2. Install Dependencies

On the server:

```bash
cd /home/fkmqtves/aban-remit-backend
npm install
```

### 3. Configure Environment

The `.env` file is already configured for Unix socket authentication:

```env
DATABASE_URL="postgresql://fkmqtves@/fkmqtves_aban_remit?host=/var/run/postgresql"
```

This works because:
- Your application runs as the `fkmqtves` user (or can access the socket)
- PostgreSQL allows peer authentication via Unix socket
- No password is needed

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Test Database Connection

```bash
npx tsx test-pg-connection.ts
```

You should see:
```
✓ CONNECTION TEST SUCCESSFUL
Connected to database: fkmqtves_aban_remit
PostgreSQL version: 10.23
```

### 6. Build Your Application

```bash
npm run build
```

### 7. Start Your Application

For development:
```bash
npm run dev
```

For production (using PM2):
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start npm --name "aban-remit-backend" -- start

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

### 8. Configure Reverse Proxy (Optional)

If using Nginx:

```nginx
server {
    listen 80;
    server_name abanremit.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### Connection Error: "ENOENT /var/run/postgresql/.s.PGSQL.5432"

The Unix socket path might be different. Try:

```env
# Option 1: Default socket directory
DATABASE_URL="postgresql://fkmqtves@/fkmqtves_aban_remit?host=/var/run/postgresql"

# Option 2: Alternative socket directory
DATABASE_URL="postgresql://fkmqtves@/fkmqtves_aban_remit?host=/tmp"

# Option 3: cPanel specific
DATABASE_URL="postgresql://fkmqtves@/fkmqtves_aban_remit?host=/var/lib/pgsql"
```

### Permission Denied

Ensure your application runs as a user that can access the PostgreSQL socket:

```bash
# Check socket permissions
ls -la /var/run/postgresql/.s.PGSQL.5432

# Should show something like:
# srwxrwxrwx 1 postgres postgres 0 Feb 17 12:00 .s.PGSQL.5432
```

### Still Can't Connect?

Fall back to TCP with password (requires pg_hba.conf configuration):

```env
DATABASE_URL="postgresql://fkmqtves:.cQN%4093%25XqK5T%5BJT@localhost:5432/fkmqtves_aban_remit?sslmode=disable"
```

Then contact your hosting provider to configure pg_hba.conf.

## Production Checklist

- [ ] Application uploaded to server
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Database connection tested
- [ ] Application built (`npm run build`)
- [ ] PM2 configured for process management
- [ ] Reverse proxy configured (Nginx/Apache)
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Firewall configured
- [ ] Monitoring set up (PM2 logs, error tracking)

## Monitoring

### View Application Logs

```bash
# PM2 logs
pm2 logs aban-remit-backend

# Follow logs in real-time
pm2 logs aban-remit-backend --lines 100
```

### Check Application Status

```bash
pm2 status
pm2 info aban-remit-backend
```

### Restart Application

```bash
pm2 restart aban-remit-backend
```

## Database Status

✅ Schema deployed successfully  
✅ 5 schemas created (auth, core, ledger, services, audit)  
✅ All tables with indexes and foreign keys  
✅ System wallets initialized  
✅ Permissions granted to fkmqtves user  

Your database is production-ready!
