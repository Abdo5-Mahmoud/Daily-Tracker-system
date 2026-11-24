const fs = require('fs');
const path = require('path');
const config = require('./config');
const parser = require('./parser');
const db = require('./db');
const analyzer = require('./analyzer');
const reporter = require('./reporter');

function appendRadarSection(summary) {
  if (!fs.existsSync(config.RADAR_LOG_PATH)) return;
  const dateStr = summary.capturedAt.split('T')[0];
  const timeStr = new Date(summary.capturedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const block = [
    '',
    `## Live Chrome Snapshot - ${dateStr}`,
    '```text',
    `Session Timestamp: ${dateStr} ${timeStr}`,
    `Keyword: ${summary.keyword}`,
    `Parsed Items: ${summary.parsedCount} | Sponsored: ${summary.sponsoredCount} | Coupons: ${summary.couponCount} | Flora_Home Matches: ${summary.ourMatches.length}`,
    '```',
    '',
    '| Keyword | Avg Price | Range | Sponsored | Coupons | Flora_Home Ranks |',
    '| :--- | :--- | :--- | :--- | :--- | :--- |',
    `| ${summary.keyword} | ${summary.avgPrice} EGP | ${summary.minPrice} - ${summary.maxPrice} EGP | ${summary.sponsoredCount} | ${summary.couponCount} | ${summary.ourMatches.map(m => `#${m.rankInSearch} (${m.asin})`).join(', ') || 'Not ranked P1'} |`,
    '',
    '---',
  ].join('\n');

  fs.appendFileSync(config.RADAR_LOG_PATH, block, 'utf8');
}

/**
 * Ingests a user-saved Amazon Egypt search HTML snapshot into SQLite and updates reports.
 * Strictly zero bot-bypass; rejects CAPTCHA pages loudly.
 */
function ingestHtmlFile({
  filePath,
  keyword,
  page = 1,
  capturedAt = new Date().toISOString(),
  dbPath = config.DB_PATH,
  outputDir = config.OUTPUT_DIR,
  moveProcessed = false,
  updateRadarLog = true,
}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`HTML file not found: ${filePath}`);
  }

  const inferredKeyword = keyword || path.basename(filePath, path.extname(filePath)).replace(/_/g, ' ');
  const html = fs.readFileSync(filePath, 'utf8');
  const parsed = parser.parseSearchResults(html, inferredKeyword, page);

  if (parsed.length === 0) {
    throw new Error(`No Amazon search result cards extracted from ${path.basename(filePath)}.`);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const handle = db.openDb(dbPath);
  try {
    db.saveProductsBatch(parsed, capturedAt, handle);
    const analysis = analyzer.analyzeLatestRun(capturedAt, handle, inferredKeyword);

    const dateStr = capturedAt.split('T')[0];
    reporter.exportToCsv(capturedAt, path.join(outputDir, 'market_snapshot_latest.csv'), handle);
    reporter.exportToCsv(capturedAt, path.join(outputDir, `market_snapshot_${dateStr}.csv`), handle);

    const mdContent = reporter.generateMarkdownReport(analysis);
    fs.writeFileSync(path.join(outputDir, `DAILY_MARKET_BRIEFING_${dateStr}.md`), mdContent, 'utf8');

    const prices = parsed.map(p => p.price).filter(p => typeof p === 'number' && p > 0);
    const summary = {
      keyword: inferredKeyword,
      capturedAt,
      parsedCount: parsed.length,
      avgPrice: prices.length ? Number((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(1)) : null,
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      sponsoredCount: parsed.filter(p => p.isSponsored).length,
      couponCount: parsed.filter(p => (p.couponEgp || 0) > 0 || (p.couponPct || 0) > 0).length,
      primeCount: parsed.filter(p => p.isPrime).length,
      ourMatches: parsed.filter(p => p.isOurProduct),
    };

    if (updateRadarLog) {
      appendRadarSection(summary);
    }

    if (moveProcessed) {
      const procDir = path.join(path.dirname(filePath), 'processed');
      fs.mkdirSync(procDir, { recursive: true });
      fs.renameSync(filePath, path.join(procDir, path.basename(filePath)));
    }

    return summary;
  } finally {
    handle.close();
  }
}

/** Scans the inbox directory for Chrome-saved .html/.htm search pages and ingests all. */
function ingestInboxDirectory(inboxDir = config.INBOX_DIR) {
  if (!fs.existsSync(inboxDir)) {
    fs.mkdirSync(inboxDir, { recursive: true });
    return [];
  }

  const entries = fs
    .readdirSync(inboxDir)
    .filter(name => /\.(html?|htm)$/i.test(name));

  return entries.map(name =>
    ingestHtmlFile({
      filePath: path.join(inboxDir, name),
      moveProcessed: true,
    })
  );
}

module.exports = { ingestHtmlFile, ingestInboxDirectory };
