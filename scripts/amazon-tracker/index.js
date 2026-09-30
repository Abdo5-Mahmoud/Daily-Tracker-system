const fs = require('fs');
const path = require('path');
const config = require('./config');
const fetcher = require('./fetcher');
const parser = require('./parser');
const db = require('./db');
const analyzer = require('./analyzer');
const reporter = require('./reporter');

async function runTracker() {
  const startTime = Date.now();
  const runTimestamp = new Date().toISOString();
  const dateStr = runTimestamp.split('T')[0];

  console.log(`\n========================================================`);
  console.log(`🚀 Starting Amazon Egypt Daily Market Intelligence Scan`);
  console.log(`📅 Timestamp: ${runTimestamp}`);
  console.log(`🎯 Target Keywords: ${config.TARGET_KEYWORDS.join(', ')}`);
  console.log(`📂 Database: ${config.DB_PATH}`);
  console.log(`========================================================\n`);

  // Ensure output directory exists
  if (!fs.existsSync(config.OUTPUT_DIR)) {
    fs.mkdirSync(config.OUTPUT_DIR, { recursive: true });
  }

  const allProducts = [];

  for (let kIndex = 0; kIndex < config.TARGET_KEYWORDS.length; kIndex++) {
    const keyword = config.TARGET_KEYWORDS[kIndex];
    console.log(`\n[Keyword ${kIndex + 1}/${config.TARGET_KEYWORDS.length}] Scanning: "${keyword}"...`);

    for (let page = 1; page <= config.MAX_PAGES_PER_KEYWORD; page++) {
      try {
        process.stdout.write(`  -> Fetching page ${page}... `);
        const html = await fetcher.fetchSearchPage(keyword, page);
        const products = parser.parseSearchResults(html, keyword, page);
        
        console.log(`Found ${products.length} products.`);
        allProducts.push(...products);

        // Don't hit too quickly between pages
        if (page < config.MAX_PAGES_PER_KEYWORD) {
          const delay = fetcher.getRandomDelay();
          await fetcher.sleep(delay);
        }
      } catch (err) {
        console.error(`\n  [ERROR] Failed to fetch/parse page ${page} for "${keyword}":`, err.message);
        // Break out to next keyword if blocked
        break;
      }
    }
  }

  console.log(`\n--------------------------------------------------------`);
  console.log(`Total Products Scraped Across Keywords: ${allProducts.length}`);
  console.log(`Saving batch into SQLite database...`);

  // 1. Save to Database
  db.saveProductsBatch(allProducts, runTimestamp);
  console.log(`✅ Database updated successfully.`);

  // 2. Run Intelligence Analytics
  console.log(`Analyzing market trends & competitor shifts...`);
  const analysis = analyzer.analyzeLatestRun(runTimestamp);

  // 3. Export to CSV
  const csvLatest = path.join(config.OUTPUT_DIR, 'market_snapshot_latest.csv');
  const csvDated = path.join(config.OUTPUT_DIR, `market_snapshot_${dateStr}.csv`);
  reporter.exportToCsv(runTimestamp, csvLatest);
  reporter.exportToCsv(runTimestamp, csvDated);
  console.log(`✅ CSV exports saved:`);
  console.log(`   - ${csvLatest}`);
  console.log(`   - ${csvDated}`);

  // 4. Generate Markdown Briefing Report
  const mdReportPath = path.join(config.OUTPUT_DIR, `DAILY_MARKET_BRIEFING_${dateStr}.md`);
  const mdContent = reporter.generateMarkdownReport(analysis);
  fs.writeFileSync(mdReportPath, mdContent, 'utf-8');
  console.log(`✅ Markdown intelligence briefing saved:`);
  console.log(`   - ${mdReportPath}`);

  // 5. Print CLI Summary Table
  reporter.printCliSummary(analysis);

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  console.log(`✨ Daily market scan completed in ${durationSec}s.\n`);
  return { analysis, totalProducts: allProducts.length, durationSec };
}

// Auto-run if executed directly via node scripts/amazon-tracker/index.js
if (require.main === module) {
  runTracker().catch(err => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
}

module.exports = { runTracker };
