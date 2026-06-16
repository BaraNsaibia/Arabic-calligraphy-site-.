<?php
// Mohsen Nsaibia Calligraphy Gallery - Local / Production Database Configuration
// Copy this file to `db_config.local.php` and fill in your online MySQL details.
// Make sure NOT to track `db_config.local.php` in Git to keep credentials secure.

define('DB_HOST', 'localhost');          // Often 'localhost', or a specific server IP provided by Hostinger/cPanel
define('DB_NAME', 'nsaibia_gallery');     // Your online MySQL database name
define('DB_USER', 'root');                // Your online MySQL database username
define('DB_PASS', '');                    // Your online MySQL database password
define('DB_CHARSET', 'utf8mb4');          // Keeping the character set for Arabic support
define('ADMIN_EMAIL', 'admin@nsaibia.com'); // Admin email
