const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const config = require('../config');
const parser = require('../parser');
const db = require('../db');

test('config tracks Flora_Home live Lilium ASINs and live keywords', () => {
  const asins = (config.MY_PRODUCTS || []).map(p => (typeof p === 'string' ? p : p.asin));
  assert.ok(!asins.includes('B0HL3QHF3B'), 'Old plant ASIN B0HL3QHF3B must be removed');
  assert.ok(asins.includes('B0HNFBPLGG'), 'Must include Bubble ASIN');
  assert.ok(asins.includes('B0HNFC2MDD'), 'Must include Diamond ASIN');
  assert.ok(asins.includes('B0HNF8SBZ7'), 'Must include Fluted ASIN');
  assert.ok(config.TARGET_KEYWORDS.includes('فازة'), 'Must include live winning keyword فازة');
  assert.ok(config.TARGET_KEYWORDS.includes('ورد ليليام'), 'Must include ورد ليليام');
  assert.equal(config.STALE_THRESHOLD_HOURS, 24);
  assert.ok(config.INBOX_DIR, 'INBOX_DIR must be defined');
});

test('parser extracts prices, Arabic numerals, coupons, sponsored/best-seller flags, and ratings', () => {
  const sampleHtml = `
    <div data-asin="B0HNFC2MDD" data-component-type="s-search-result">
      <div class="s-product-image-container"><img class="s-image" src="https://example.com/lily.jpg" /></div>
      <span class="s-sponsored-label">ممول</span>
      <h2><a><span>Flora Home فازة ورد صناعي ليليام</span></a></h2>
      <span class="a-icon-alt">4.8 من 5 نجوم</span>
      <span class="a-size-base s-underline-text">15</span>
      <span class="a-price"><span class="a-price-whole">259</span><span class="a-price-fraction">00</span></span>
      <span class="s-coupon-highlight-color">وفر 21 ج.م</span>
      <i class="a-icon-prime"></i>
    </div>
    <div data-asin="B0B66PQQY3" data-component-type="s-search-result">
      <div class="s-product-image-container"><img class="s-image" src="https://example.com/donut.jpg" /></div>
      <span class="a-badge-text">الأكثر مبيعاً</span>
      <h2><a><span>فازات سيراميك دونات 3 قطع</span></a></h2>
      <span class="a-icon-alt">3.1 out of 5 stars</span>
      <span class="a-size-base s-underline-text">١,٢١٤</span>
      <span class="a-price"><span class="a-price-whole">١٨٤</span><span class="a-price-fraction">٠٠</span></span>
      <span class="s-coupon-highlight-color">خصم 10%</span>
    </div>
  `;

  const results = parser.parseSearchResults(sampleHtml, 'فازة', 1);
  assert.equal(results.length, 2);

  const ours = results[0];
  assert.equal(ours.asin, 'B0HNFC2MDD');
  assert.equal(ours.price, 259);
  assert.equal(ours.isSponsored, true);
  assert.equal(ours.isPrime, true);
  assert.equal(ours.couponText, 'وفر 21 ج.م');
  assert.equal(ours.couponEgp, 21);
  assert.equal(ours.rating, 4.8);
  assert.equal(ours.reviewsCount, 15);
  assert.equal(ours.isOurProduct, true);

  const comp = results[1];
  assert.equal(comp.asin, 'B0B66PQQY3');
  assert.equal(comp.price, 184);
  assert.equal(comp.isBestSeller, true);
  assert.equal(comp.reviewsCount, 1214);
  assert.equal(comp.couponPct, 10);
  assert.equal(comp.isOurProduct, false);
});

test('parser throws loudly on Amazon CAPTCHA or Robot Check HTML', () => {
  const captchaHtml = '<html><title>Robot Check</title><form action="/errors/validateCaptcha"></form></html>';
  assert.throws(
    () => parser.parseSearchResults(captchaHtml, 'فازة', 1),
    /CAPTCHA|Robot Check|Blocked/i
  );
});

test('db migrates legacy snapshots schema safely and computes accurate freshness', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flora-db-'));
  const tmpDbPath = path.join(tmpDir, 'test_market.db');

  // Seed legacy table without new coupon/our_product columns
  const legacyDb = new DatabaseSync(tmpDbPath);
  legacyDb.exec(`
    CREATE TABLE products (
      asin TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      image_url TEXT,
      url TEXT,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL
    );
    CREATE TABLE snapshots (
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
    INSERT INTO products VALUES ('B0OLD12345', 'Old Item', 'فازات', '', '', '2026-10-02T10:00:00.000Z', '2026-10-02T10:00:00.000Z');
    INSERT INTO snapshots (asin, keyword, price, captured_at) VALUES ('B0OLD12345', 'فازات', 190, '2026-10-02T10:00:00.000Z');
  `);
  legacyDb.close();

  const handle = db.openDb(tmpDbPath);
  const nowIso = new Date().toISOString();
  db.saveProductsBatch(
    [
      {
        asin: 'B0HNFC2MDD',
        title: 'Flora Home Diamond Lilium',
        keyword: 'فازة',
        price: 259,
        origPrice: null,
        discountPct: 0,
        couponText: 'وفر 21 ج.م',
        couponEgp: 21,
        couponPct: 0,
        rating: 5.0,
        reviewsCount: 1,
        rankInSearch: 1,
        isSponsored: true,
        isPrime: true,
        isBestSeller: false,
        isOurProduct: true,
        imageUrl: 'https://example.com/1.jpg',
        url: 'https://www.amazon.eg/dp/B0HNFC2MDD',
      },
    ],
    nowIso,
    handle
  );

  const freshness = db.getFreshnessReport(24, handle);
  const oldEntry = freshness.find(r => r.keyword === 'فازات');
  const freshEntry = freshness.find(r => r.keyword === 'فازة');
  assert.ok(oldEntry && oldEntry.is_stale === true, 'Oct 2026 data must be flagged stale');
  assert.ok(freshEntry && freshEntry.is_stale === false, 'Just-ingested data must be fresh');
  handle.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('ingest_search processes HTML file into isolated DB and moves file to processed', () => {
  const { ingestHtmlFile } = require('../ingest_search');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flora-ingest-'));
  const htmlPath = path.join(tmpDir, 'فازة.html');
  const outDir = path.join(tmpDir, 'out');
  const dbPath = path.join(outDir, 'market.db');

  fs.writeFileSync(
    htmlPath,
    `<html><body>
      <div data-asin="B0HNFC2MDD" data-component-type="s-search-result">
        <span class="s-sponsored-label">ممول</span>
        <h2><a><span>Flora Home Vase</span></a></h2>
        <span class="a-price"><span class="a-price-whole">259</span></span>
        <span class="s-coupon-highlight-color">وفر 21 ج.م</span>
      </div>
    </body></html>`,
    'utf8'
  );

  const summary = ingestHtmlFile({
    filePath: htmlPath,
    keyword: 'فازة',
    dbPath,
    outputDir: outDir,
    moveProcessed: true,
    updateRadarLog: false,
  });

  assert.equal(summary.keyword, 'فازة');
  assert.equal(summary.parsedCount, 1);
  assert.equal(summary.ourMatches.length, 1);
  assert.equal(summary.couponCount, 1);
  assert.equal(fs.existsSync(htmlPath), false, 'Source file should be moved to processed/');
  assert.equal(fs.existsSync(path.join(tmpDir, 'processed', 'فازة.html')), true);
  assert.equal(fs.existsSync(path.join(outDir, 'market_snapshot_latest.csv')), true);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
