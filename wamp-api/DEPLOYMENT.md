# PHP API Deployment Guide

This folder already contains the PHP API for orders, auth, newsletter, and galleries.

## What is already ready

- `config.php` — connects to MySQL and supports local/production env variables
- `cors.php` — handles CORS and JSON response helpers
- `auth/` — login, register, me
- `orders/` — create order, mine, index, update status, webhook
- `newsletter/` — subscribe endpoint
- `index.php` — API root health/status check

## What you need to do

1. Upload the entire `wamp-api/` folder to a PHP-enabled host.

2. Configure production database credentials.

   - Copy `db_config.local.example.php` to `db_config.local.php`
   - Edit the values:
     - `DB_HOST`
     - `DB_NAME`
     - `DB_USER`
     - `DB_PASS`

3. Verify the PHP API is reachable.

   Open in browser:
   ```
   https://your-php-host/wamp-api/auth/me.php
   ```

   Expected response:
   ```json
   {"ok":true,"user":null}
   ```

4. Set the frontend environment variable to the public PHP API URL.

   In Render or your frontend deployment:
   ```env
   VITE_WAMP_API_URL=https://your-php-host/wamp-api
   ```

5. Rebuild and deploy the frontend.

## Local development

Your local API URL is:

```env
VITE_WAMP_API_URL=http://localhost/nsaibia-api/wamp-api
```

That works only when your local WAMP server is running and `wamp-api/` is hosted at that local path.

## Important notes

- Render itself can host the React frontend, but the PHP API must be on a PHP-enabled server.
- If you only deploy the React app on Render without a PHP API host, orders/accounts will not save to MySQL.
- `VITE_WAMP_API_URL` must point at the PHP API host, not `VITE_API_URL`.
