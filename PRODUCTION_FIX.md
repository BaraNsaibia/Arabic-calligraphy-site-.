# PRODUCTION FIX - Database Not Saving Orders/Accounts

## Problem
Orders and accounts are not being saved to the database despite the site being live.

## Root Cause
The `.env` file was pointing to `http://localhost:8000` which doesn't exist. The frontend needs to connect to the PHP API that handles database operations.

## Solution

### For Production Deployment
Update your production environment variable to point to your PHP API server:

```
VITE_WAMP_API_URL=https://your-domain.com/wamp-api
```

Replace `https://your-domain.com/wamp-api` with the actual URL where your PHP API is hosted.

### Steps to Fix:

1. **Deploy PHP API Files**: Ensure the `wamp-api` folder is deployed to your PHP server (e.g., cPanel, shared hosting, VPS)

2. **Update Database Config**: Edit `wamp-api/config.php` on your production server with your production database credentials:
   ```php
   define('DB_HOST', 'your-production-db-host');
   define('DB_NAME', 'your-production-db-name');
   define('DB_USER', 'your-production-db-user');
   define('DB_PASS', 'your-production-db-password');
   ```

3. **Set Environment Variable**: In your production environment (Vercel, Netlify, Docker, etc.), set:
   ```
   VITE_WAMP_API_URL=https://your-domain.com/wamp-api
   ```

4. **Redeploy**: Redeploy your frontend application to pick up the new environment variable

### Verification
Test the API endpoint directly:
```bash
curl https://your-domain.com/wamp-api/auth/me.php
```

Should return: `{"ok":true,"user":null}`

## Local Development Fix
The local `.env` file has been updated to:
```
VITE_WAMP_API_URL=http://localhost/nsaibia-api/wamp-api
```

This connects to your local WAMP server for development.
