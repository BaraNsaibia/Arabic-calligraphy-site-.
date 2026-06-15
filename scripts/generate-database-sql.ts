import { writeFileSync } from "fs";
import { join } from "path";
import { ARTWORKS } from "../src/data";

function escapeSql(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "''");
}

function sqlValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";
  return `'${escapeSql(value)}'`;
}

const schema = `-- ============================================================
-- Mohsen Nsaibia Calligraphy Gallery — MySQL Database
-- Import this file in phpMyAdmin (WampServer)
-- ============================================================

CREATE DATABASE IF NOT EXISTS nsaibia_gallery
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nsaibia_gallery;

-- ------------------------------------------------------------
-- Users (sign in / sign up)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Artworks (gallery catalog)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artworks (
  id VARCHAR(64) PRIMARY KEY,
  title_ar VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  subtitle_ar VARCHAR(255) NOT NULL,
  subtitle_en VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image VARCHAR(500) NOT NULL,
  category ENUM('luxury', 'geometric', 'lettering') NOT NULL,
  size VARCHAR(50) NOT NULL,
  limited_edition TINYINT(1) NOT NULL DEFAULT 1,
  description_ar TEXT NOT NULL,
  description_en TEXT NOT NULL,
  essay_title_ar VARCHAR(500) DEFAULT NULL,
  essay_title_en VARCHAR(500) DEFAULT NULL,
  spiritual_ar TEXT DEFAULT NULL,
  spiritual_en TEXT DEFAULT NULL,
  geometric_ar TEXT DEFAULT NULL,
  geometric_en TEXT DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Newsletter subscribers (footer form)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  language ENUM('ar', 'en') NOT NULL DEFAULT 'ar',
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_newsletter_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Orders (cart checkout)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  customer_name VARCHAR(120) NOT NULL,
  customer_email VARCHAR(190) DEFAULT NULL,
  customer_phone VARCHAR(40) NOT NULL,
  shipping_address TEXT NOT NULL,
  order_number VARCHAR(64) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT NULL,
  payment_reference VARCHAR(100) DEFAULT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  status ENUM('pending', 'confirmed', 'shipped', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_order_number (order_number),
  KEY idx_orders_user (user_id),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Order line items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  artwork_id VARCHAR(64) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  frame_type ENUM('classic_wood', 'museum_gold', 'obsidian_minimal') NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_artwork (artwork_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_artwork FOREIGN KEY (artwork_id) REFERENCES artworks(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Custom commission requests
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commission_requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(40) DEFAULT NULL,
  phrase VARCHAR(500) NOT NULL,
  notes TEXT DEFAULT NULL,
  frame_type ENUM('classic_wood', 'museum_gold', 'obsidian_minimal') NOT NULL,
  size VARCHAR(50) NOT NULL,
  status ENUM('new', 'reviewing', 'accepted', 'rejected') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_commission_user (user_id),
  CONSTRAINT fk_commission_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Auth sessions (token-based login)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sessions_token (token),
  KEY idx_sessions_user (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Seed artworks (${ARTWORKS.length} items from src/data.ts)
-- ------------------------------------------------------------
`;

const artworkInserts = ARTWORKS.map((artwork) => {
  const columns = [
    "id",
    "title_ar",
    "title_en",
    "subtitle_ar",
    "subtitle_en",
    "price",
    "image",
    "category",
    "size",
    "limited_edition",
    "description_ar",
    "description_en",
    "essay_title_ar",
    "essay_title_en",
    "spiritual_ar",
    "spiritual_en",
    "geometric_ar",
    "geometric_en",
  ];

  const values = [
    artwork.id,
    artwork.titleAr,
    artwork.titleEn,
    artwork.subtitleAr,
    artwork.subtitleEn,
    artwork.price,
    artwork.image,
    artwork.category,
    artwork.size,
    artwork.limitedEdition,
    artwork.descriptionAr,
    artwork.descriptionEn,
    artwork.essayTitleAr ?? null,
    artwork.essayTitleEn ?? null,
    artwork.spiritualAr ?? null,
    artwork.spiritualEn ?? null,
    artwork.geometricAr ?? null,
    artwork.geometricEn ?? null,
  ];

  return `INSERT INTO artworks (${columns.join(", ")}) VALUES (${values.map(sqlValue).join(", ")});`;
});

const footer = `
-- Users are created through the Sign Up form in the gallery app.
`;

const outputPath = join(process.cwd(), "database", "nsaibia_gallery.sql");
const fullSql = [schema, ...artworkInserts, footer].join("\n");
writeFileSync(outputPath, fullSql, "utf8");
console.log(`Generated ${outputPath} with ${ARTWORKS.length} artworks.`);
