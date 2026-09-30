const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const config = require('./config');

let dbInstance = null;

function getDb() {
  if (!dbInstance) {
    const dir = path.dirname(config.DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    dbInstance = new DatabaseSync(config.DB_PATH);
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      asin TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      image_url TEXT,
      url TEXT,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asin TEXT NOT NULL,
      keyword TEXT NOT NULL,
      price REAL,
      orig_price REAL,
      discount_pct REAL,
      rating REAL,
      reviews_count INTEGER,
      rank_in_search INTEGER,
      is_sponsored INTEGER,
      is_prime INTEGER,
      is_best_seller INTEGER,
      captured_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_snapshots_asin_captured 
      ON snapshots(asin, captured_at);

    CREATE INDEX IF NOT EXISTS idx_snapshots_captured 
      ON snapshots(captured_at);

    CREATE INDEX IF NOT EXISTS idx_snapshots_keyword 
      ON snapshots(keyword);
  `);
}

function saveProductsBatch(products, capturedAt = new Date().toISOString()) {
  const db = getDb();
  db.exec('BEGIN TRANSACTION');

  try {
    const checkProduct = db.prepare('SELECT asin FROM products WHERE asin = ?');
    const insertProduct = db.prepare(`
      INSERT INTO products (asin, title, category, image_url, url, first_seen_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const updateProduct = db.prepare(`
      UPDATE products 
      SET title = ?, image_url = ?, url = ?, last_seen_at = ?
      WHERE asin = ?
    `);

    const insertSnapshot = db.prepare(`
      INSERT INTO snapshots (
        asin, keyword, price, orig_price, discount_pct, rating,
        reviews_count, rank_in_search, is_sponsored, is_prime,
        is_best_seller, captured_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of products) {
      const existing = checkProduct.all(p.asin);
      if (existing.length === 0) {
        insertProduct.run(
          p.asin,
          p.title,
          p.keyword,
          p.imageUrl,
          p.url,
          capturedAt,
          capturedAt
        );
      } else {
        updateProduct.run(
          p.title,
          p.imageUrl,
          p.url,
          capturedAt,
          p.asin
        );
      }

      insertSnapshot.run(
        p.asin,
        p.keyword,
        p.price,
        p.origPrice,
        p.discountPct || 0,
        p.rating,
        p.reviewsCount || 0,
        p.rankInSearch || 0,
        p.isSponsored ? 1 : 0,
        p.isPrime ? 1 : 0,
        p.isBestSeller ? 1 : 0,
        capturedAt
      );
    }

    db.exec('COMMIT');
    return { savedCount: products.length, capturedAt };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function getLatestTimestamps() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT DISTINCT captured_at 
    FROM snapshots 
    ORDER BY captured_at DESC 
    LIMIT 2
  `).all();

  return {
    latest: rows[0] ? rows[0].captured_at : null,
    previous: rows[1] ? rows[1].captured_at : null
  };
}

function getPriceChanges(latestTime, previousTime) {
  if (!latestTime || !previousTime) return [];
  const db = getDb();

  return db.prepare(`
    SELECT 
      curr.asin,
      p.title,
      curr.keyword,
      prev.price AS old_price,
      curr.price AS new_price,
      ROUND(curr.price - prev.price, 2) AS price_diff,
      ROUND(((curr.price - prev.price) / prev.price) * 100, 1) AS pct_change,
      curr.rating,
      curr.reviews_count,
      p.url
    FROM snapshots curr
    JOIN snapshots prev ON curr.asin = prev.asin AND prev.captured_at = ?
    JOIN products p ON curr.asin = p.asin
    WHERE curr.captured_at = ? 
      AND curr.price IS NOT NULL 
      AND prev.price IS NOT NULL
      AND curr.price != prev.price
    ORDER BY price_diff ASC
  `).all(previousTime, latestTime);
}

function getReviewSurges(latestTime, previousTime) {
  if (!latestTime || !previousTime) return [];
  const db = getDb();

  return db.prepare(`
    SELECT 
      curr.asin,
      p.title,
      curr.keyword,
      prev.reviews_count AS old_reviews,
      curr.reviews_count AS new_reviews,
      (curr.reviews_count - prev.reviews_count) AS review_growth,
      curr.price,
      curr.rating,
      p.url
    FROM snapshots curr
    JOIN snapshots prev ON curr.asin = prev.asin AND prev.captured_at = ?
    JOIN products p ON curr.asin = p.asin
    WHERE curr.captured_at = ? 
      AND curr.reviews_count > prev.reviews_count
    ORDER BY review_growth DESC
    LIMIT 15
  `).all(previousTime, latestTime);
}

function getNewCompetitors(latestTime, previousTime) {
  const db = getDb();
  if (!previousTime) {
    // If first run, all are technically new, but we flag the top 10
    return db.prepare(`
      SELECT 
        s.asin,
        p.title,
        s.keyword,
        s.price,
        s.rating,
        s.reviews_count,
        s.is_best_seller,
        p.url
      FROM snapshots s
      JOIN products p ON s.asin = p.asin
      WHERE s.captured_at = ?
      ORDER BY s.reviews_count DESC
      LIMIT 10
    `).all(latestTime);
  }

  return db.prepare(`
    SELECT 
      curr.asin,
      p.title,
      curr.keyword,
      curr.price,
      curr.rating,
      curr.reviews_count,
      curr.is_best_seller,
      p.url
    FROM snapshots curr
    JOIN products p ON curr.asin = p.asin
    WHERE curr.captured_at = ?
      AND curr.asin NOT IN (
        SELECT DISTINCT asin FROM snapshots WHERE captured_at = ?
      )
    ORDER BY curr.rank_in_search ASC
  `).all(latestTime, previousTime);
}

function getUndercutCompetitors(thresholdPrice, capturedAt) {
  const db = getDb();
  return db.prepare(`
    SELECT 
      s.asin,
      p.title,
      s.keyword,
      s.price,
      s.rating,
      s.reviews_count,
      s.is_sponsored,
      s.is_best_seller,
      p.url
    FROM snapshots s
    JOIN products p ON s.asin = p.asin
    WHERE s.captured_at = ?
      AND s.price IS NOT NULL
      AND s.price < ?
    ORDER BY s.price ASC
  `).all(capturedAt, thresholdPrice);
}

function getKeywordStats(capturedAt) {
  const db = getDb();
  return db.prepare(`
    SELECT 
      keyword,
      COUNT(DISTINCT asin) AS total_products,
      ROUND(AVG(price), 1) AS avg_price,
      MIN(price) AS min_price,
      MAX(price) AS max_price,
      ROUND(AVG(rating), 2) AS avg_rating,
      SUM(CASE WHEN is_prime = 1 THEN 1 ELSE 0 END) AS prime_count,
      SUM(CASE WHEN is_sponsored = 1 THEN 1 ELSE 0 END) AS sponsored_count
    FROM snapshots
    WHERE captured_at = ? AND price IS NOT NULL
    GROUP BY keyword
  `).all(capturedAt);
}

function getAllProductsForExport(capturedAt) {
  const db = getDb();
  return db.prepare(`
    SELECT 
      s.asin,
      p.title,
      s.keyword,
      s.price,
      s.orig_price,
      s.discount_pct,
      s.rating,
      s.reviews_count,
      s.rank_in_search,
      s.is_sponsored,
      s.is_prime,
      s.is_best_seller,
      p.url,
      p.image_url,
      s.captured_at
    FROM snapshots s
    JOIN products p ON s.asin = p.asin
    WHERE s.captured_at = ?
    ORDER BY s.keyword ASC, s.rank_in_search ASC
  `).all(capturedAt);
}

module.exports = {
  getDb,
  saveProductsBatch,
  getLatestTimestamps,
  getPriceChanges,
  getReviewSurges,
  getNewCompetitors,
  getUndercutCompetitors,
  getKeywordStats,
  getAllProductsForExport
};
