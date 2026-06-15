# MySQL Database Setup (WampServer + phpMyAdmin)

This project includes a full MySQL database for:

- **Users** — sign up / sign in / sessions
- **Artworks** — all 36 gallery items (prices, descriptions, essays)
- **Newsletter subscribers** — footer email form
- **Orders + order items** — cart checkout
- **Commission requests** — custom artwork inquiries

---

## Step 1 — Start WampServer

1. Open **WampServer** and wait until the icon is **green**.
2. Click the Wamp icon → **phpMyAdmin** (or open `http://localhost/phpmyadmin`).

---

## Step 2 — Import the database in phpMyAdmin

1. In phpMyAdmin, click **Import**.
2. Choose this file:

   `database/nsaibia_gallery.sql`

3. Click **Go**.

You should see database **`nsaibia_gallery`** with these tables:

| Table | Purpose |
|-------|---------|
| `users` | Registered accounts |
| `user_sessions` | Login tokens |
| `artworks` | Gallery catalog (36 items) |
| `newsletter_subscribers` | Footer newsletter emails |
| `orders` | Checkout bookings |
| `order_items` | Items inside each order |
| `commission_requests` | Custom commission form data |

---

## Step 3 — Copy the PHP API to Wamp `www`

Copy the entire `wamp-api` folder into your Wamp web root:

```
C:\wamp64\www\nsaibia-api\
```

Your API URL becomes:

```
http://localhost/nsaibia-api
```

Test it in the browser — you should see:

```json
{"ok":true,"message":"Mohsen Nsaibia Gallery API","database":"nsaibia_gallery"}
```

### MySQL credentials

Default Wamp settings are in `wamp-api/config.php`:

```php
DB_HOST = localhost
DB_NAME = nsaibia_gallery
DB_USER = root
DB_PASS = ''   // empty by default on Wamp
```

Edit `config.php` if your MySQL password is different.

---

## Step 4 — Connect the React app to MySQL

Create a `.env` file in the project root:

```env
# If your WAMP alias root is http://localhost/nsaibia-api
# and the API folder is inside it as wamp-api, use this URL:
VITE_WAMP_API_URL=http://localhost/nsaibia-api/wamp-api
GEMINI_API_KEY=your_key_if_needed
```

Restart the dev server:

```bash
npm run dev
```

When `VITE_WAMP_API_URL` is set:

- Sign up / sign in → saved in MySQL `users`
- Newsletter → saved in `newsletter_subscribers`
- Cart checkout → saved in `orders` + `order_items`

Without `.env`, the app falls back to browser `localStorage` (no database).

---

## API endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register.php` | POST | Create account |
| `/auth/login.php` | POST | Sign in |
| `/auth/logout.php` | POST | Sign out |
| `/auth/me.php` | GET | Current user |
| `/artworks/index.php` | GET | List artworks |
| `/newsletter/subscribe.php` | POST | Newsletter signup |
| `/orders/create.php` | POST | Save cart order |

---

## Regenerate SQL after editing artworks

If you change prices or descriptions in `src/data.ts`, regenerate the SQL file:

```bash
npx tsx scripts/generate-database-sql.ts
```

Then re-import `database/nsaibia_gallery.sql` in phpMyAdmin (or run only the `INSERT` statements).

---

## View your data in phpMyAdmin

1. Open phpMyAdmin → database **`nsaibia_gallery`**
2. Click any table → **Browse**
3. Examples:
   - `users` — accounts created via Sign Up
   - `orders` — checkout requests from the cart
   - `newsletter_subscribers` — emails from the footer
