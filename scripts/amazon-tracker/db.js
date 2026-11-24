const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const config = require('./config');

let defaultDb = null;

function ensureColumn(db, tableName, columnDef) {
  const colName = columnDef.split(/\s+/)[0];
  const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (!cols.some(c => c.name === colName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef};`);
  }
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

    CREATE TABLE IF NOT EXISTS ppc_search_terms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_name TEXT,
      targeting_group TEXT,
      search_term TEXT NOT NULL,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      spend_egp REAL DEFAULT 0.0,
      sales_egp REAL DEFAULT 0.0,
      orders_count INTEGER DEFAULT 0,
      captured_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_snapshots_asin_captured ON snapshots(asin, captured_at);
    CREATE INDEX IF NOT EXISTS idx_snapshots_captured ON snapshots(captured_at);
    CREATE INDEX IF NOT EXISTS idx_snapshots_keyword ON snapshots(keyword);
  `);

  // Non-destructive migration for historical Oct 2026 databases
  ensureColumn(db, 'snapshots', 'coupon_text TEXT');
  ensureColumn(db, 'snapshots', 'coupon_egp REAL DEFAULT 0');
  ensureColumn(db, 'snapshots', 'coupon_pct REAL DEFAULT 0');
  ensureColumn(db, 'snapshots', 'is_our_product INTEGER DEFAULT 0');
}

/** Opens an explicit SQLite handle and guarantees schema readiness. */
function openDb(dbPath = config.DB_PATH) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const instance = new DatabaseSync(dbPath);
  initSchema(instance);
  return instance;
}

function getDb() {
  if (!defaultDb) {
    defaultDb = openDb(config.DB_PATH);
  }
  return defaultDb;
}

function saveProductsBatch(products, capturedAt = new Date().toISOString(), dbHandle = getDb()) {
  dbHandle.exec('BEGIN TRANSACTION');
  try {
    const checkProduct = dbHandle.prepare('SELECT asin FROM products WHERE asin = ?');
    const insertProduct = dbHandle.prepare(`
      INSERT INTO products (asin, title, category, image_url, url, first_seen_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const updateProduct = dbHandle.prepare(`
      UPDATE products SET title = ?, image_url = ?, url = ?, last_seen_at = ?
      WHERE asin = ?
    `);
    const insertSnapshot = dbHandle.prepare(`
      INSERT INTO snapshots (
        asin, keyword, price, orig_price, discount_pct, coupon_text, coupon_egp,
        coupon_pct, rating, reviews_count, rank_in_search, is_sponsored,
        is_prime, is_best_seller, is_our_product, captured_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of products) {
      if (checkProduct.all(p.asin).length === 0) {
        insertProduct.run(p.asin, p.title, p.keyword, p.imageUrl, p.url, capturedAt, capturedAt);
      } else {
        updateProduct.run(p.title, p.imageUrl, p.url, capturedAt, p.asin);
      }

      insertSnapshot.run(
        p.asin,
        p.keyword,
        p.price ?? null,
        p.origPrice ?? null,
        p.discountPct || 0,
        p.couponText || null,
        p.couponEgp || 0,
        p.couponPct || 0,
        p.rating ?? null,
        p.reviewsCount || 0,
        p.rankInSearch || 0,
        p.isSponsored ? 1 : 0,
        p.isPrime ? 1 : 0,
        p.isBestSeller ? 1 : 0,
        p.isOurProduct ? 1 : 0,
        capturedAt
      );
    }

    dbHandle.exec('COMMIT');
    return { savedCount: products.length, capturedAt };
  } catch (err) {
    dbHandle.exec('ROLLBACK');
    throw err;
  }
}

function getFreshnessReport(staleHours = config.STALE_THRESHOLD_HOURS, dbHandle = getDb()) {
  const rows = dbHandle.prepare(`
    SELECT
      keyword,
      COUNT(*) AS snapshots_count,
      MAX(captured_at) AS latest_captured_at,
      ROUND((julianday('now') - julianday(MAX(captured_at))) * 24.0, 1) AS age_hours
    FROM snapshots
    GROUP BY keyword
    ORDER BY latest_captured_at DESC
  `).all();

  return rows.map(r => ({
    keyword: r.keyword,
    snapshots_count: r.snapshots_count,
    latest_captured_at: r.latest_captured_at,
    age_hours: r.age_hours,
    is_stale: r.age_hours === null ? true : r.age_hours > staleHours,
  }));
}

function getLatestTimestamps(dbHandle = getDb(), keyword = null) {
  const sql = keyword
    ? 'SELECT DISTINCT captured_at FROM snapshots WHERE keyword = ? ORDER BY captured_at DESC LIMIT 2'
    : 'SELECT DISTINCT captured_at FROM snapshots ORDER BY captured_at DESC LIMIT 2';
  const rows = keyword ? dbHandle.prepare(sql).all(keyword) : dbHandle.prepare(sql).all();
  return {
    latest: rows[0] ? rows[0].captured_at : null,
    previous: rows[1] ? rows[1].captured_at : null,
  };
}

function getPriceChanges(latestTime, previousTime, dbHandle = getDb()) {
  if (!latestTime || !previousTime) return [];
  return dbHandle.prepare(`
    SELECT
      curr.asin, p.title, curr.keyword,
      prev.price AS old_price, curr.price AS new_price,
      ROUND(curr.price - prev.price, 2) AS price_diff,
      ROUND(((curr.price - prev.price) / prev.price) * 100, 1) AS pct_change,
      curr.rating, curr.reviews_count, p.url
    FROM snapshots curr
    JOIN snapshots prev ON curr.asin = prev.asin AND curr.keyword = prev.keyword AND prev.captured_at = ?
    JOIN products p ON curr.asin = p.asin
    WHERE curr.captured_at = ? AND curr.price IS NOT NULL AND prev.price IS NOT NULL AND curr.price != prev.price
    ORDER BY price_diff ASC
  `).all(previousTime, latestTime);
}

function getReviewSurges(latestTime, previousTime, dbHandle = getDb()) {
  if (!latestTime || !previousTime) return [];
  return dbHandle.prepare(`
    SELECT
      curr.asin, p.title, curr.keyword,
      prev.reviews_count AS old_reviews, curr.reviews_count AS new_reviews,
      (curr.reviews_count - prev.reviews_count) AS review_growth,
      curr.price, curr.rating, p.url
    FROM snapshots curr
    JOIN snapshots prev ON curr.asin = prev.asin AND curr.keyword = prev.keyword AND prev.captured_at = ?
    JOIN products p ON curr.asin = p.asin
    WHERE curr.captured_at = ? AND curr.reviews_count > prev.reviews_count
    ORDER BY review_growth DESC
    LIMIT 15
  `).all(previousTime, latestTime);
}

function getNewCompetitors(latestTime, previousTime, dbHandle = getDb()) {
  if (!previousTime) {
    return dbHandle.prepare(`
      SELECT s.asin, p.title, s.keyword, s.price, s.rating, s.reviews_count, s.is_best_seller, p.url
      FROM snapshots s JOIN products p ON s.asin = p.asin
      WHERE s.captured_at = ?
      ORDER BY s.reviews_count DESC LIMIT 10
    `).all(latestTime);
  }
  return dbHandle.prepare(`
    SELECT curr.asin, p.title, curr.keyword, curr.price, curr.rating, curr.reviews_count, curr.is_best_seller, p.url
    FROM snapshots curr JOIN products p ON curr.asin = p.asin
    WHERE curr.captured_at = ?
      AND curr.asin NOT IN (SELECT DISTINCT asin FROM snapshots WHERE captured_at = ?)
    ORDER BY curr.rank_in_search ASC
  `).all(latestTime, previousTime);
}

function getUndercutCompetitors(thresholdPrice, capturedAt, dbHandle = getDb()) {
  return dbHandle.prepare(`
    SELECT s.asin, p.title, s.keyword, s.price, s.rating, s.reviews_count, s.is_sponsored, s.is_best_seller, p.url
    FROM snapshots s JOIN products p ON s.asin = p.asin
    WHERE s.captured_at = ? AND s.price IS NOT NULL AND s.price < ?
    ORDER BY s.price ASC
  `).all(capturedAt, thresholdPrice);
}

function getKeywordStats(capturedAt, dbHandle = getDb()) {
  return dbHandle.prepare(`
    SELECT
      keyword,
      COUNT(DISTINCT asin) AS total_products,
      ROUND(AVG(price), 1) AS avg_price,
      MIN(price) AS min_price,
      MAX(price) AS max_price,
      ROUND(AVG(rating), 2) AS avg_rating,
      SUM(CASE WHEN is_prime = 1 THEN 1 ELSE 0 END) AS prime_count,
      SUM(CASE WHEN is_sponsored = 1 THEN 1 ELSE 0 END) AS sponsored_count,
      SUM(CASE WHEN COALESCE(coupon_egp, 0) > 0 OR COALESCE(coupon_pct, 0) > 0 THEN 1 ELSE 0 END) AS coupon_count,
      SUM(CASE WHEN COALESCE(is_our_product, 0) = 1 THEN 1 ELSE 0 END) AS our_products_count
    FROM snapshots
    WHERE captured_at = ? AND price IS NOT NULL
    GROUP BY keyword
  `).all(capturedAt);
}

function getAllProductsForExport(capturedAt, dbHandle = getDb()) {
  return dbHandle.prepare(`
    SELECT
      s.asin, p.title, s.keyword, s.price, s.orig_price, s.discount_pct,
      s.coupon_text, s.coupon_egp, s.coupon_pct,
      s.rating, s.reviews_count, s.rank_in_search,
      s.is_sponsored, s.is_prime, s.is_best_seller, s.is_our_product,
      p.url, p.image_url, s.captured_at
    FROM snapshots s JOIN products p ON s.asin = p.asin
    WHERE s.captured_at = ?
    ORDER BY s.keyword ASC, s.rank_in_search ASC
  `).all(capturedAt);
}

module.exports = {
  openDb,
  getDb,
  initSchema,
  saveProductsBatch,
  getFreshnessReport,
  getLatestTimestamps,
  getPriceChanges,
  getReviewSurges,
  getNewCompetitors,
  getUndercutCompetitors,
  getKeywordStats,
  getAllProductsForExport,
};
