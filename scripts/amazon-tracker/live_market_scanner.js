#!/usr/bin/env node
/**
 * Live Amazon Egypt Home Decor & Campaign Keywords Market Scanner
 * 1. Harvests live high-intent search terms via Amazon Completion Ranker API (ARBP9OOSHTCHU)
 * 2. Fetches live search results for priority target keywords
 * 3. Compares with existing database records to spot shifts, price gaps, and ad saturation.
 */

const https = require('https');
const { fetchUrl } = require('./amazon-tracker/fetcher');
const { parseSearchResults } = require('./amazon-tracker/parser');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../local-business-store/market-intelligence/amazon_market.db');

// Prefixes for search demand extraction
const SEARCH_PREFIXES = [
  'فازات',
  'فازة',
  'ورد صناعي',
  'ورد ليليام',
  'نباتات صناعية',
  'ديكور مكتبي',
  'ديكور شقق',
  'ديكور منزلي',
  'تحف'
];

// Target campaign keywords for live page scraping
const CAMPAIGN_TARGET_KEYWORDS = [
  'فازات ديكور',
  'فازات ورد',
  'ورد صناعي',
  'ورد ليليام',
  'نباتات صناعية',
  'ديكور مكتبي'
];

function fetchSuggestions(prefix) {
  return new Promise((resolve) => {
    const url = `https://completion.amazon.eg/api/2017/suggestions?limit=11&prefix=${encodeURIComponent(prefix)}&suggestion-type=KEYWORD&alias=aps&site-variant=desktop&version=3&mid=ARBP9OOSHTCHU&lop=ar_AE`;
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const suggestions = (parsed.suggestions || []).map(s => s.value);
          resolve({ prefix, suggestions });
        } catch (e) {
          resolve({ prefix, suggestions: [] });
        }
      });
    }).on('error', () => resolve({ prefix, suggestions: [] }));
  });
}

function getDatabaseBaseline() {
  try {
    const db = new DatabaseSync(DB_PATH, { readOnly: true });
    const stmt = db.prepare(`
      SELECT 
        keyword,
        ROUND(AVG(price), 1) as avg_price,
        ROUND(MIN(price), 1) as min_price,
        ROUND(MAX(price), 1) as max_price,
        COUNT(*) as count,
        SUM(is_sponsored) as sponsored_count
      FROM snapshots
      GROUP BY keyword
    `);
    const rows = stmt.all();
    db.close();
    const baseline = {};
    for (const r of rows) {
      baseline[r.keyword] = r;
    }
    return baseline;
  } catch (err) {
    return {};
  }
}

async function runLiveScan() {
  console.log('================================================================');
  console.log('🔍 SCANNING AMAZON EGYPT: HOME DECOR & CAMPAIGN KEYWORDS');
  console.log('================================================================\n');

  console.log('[*] Phase 1: Harvesting Live Search Suggestions & Intent Ranking...');
  const searchDemand = [];
  for (const prefix of SEARCH_PREFIXES) {
    const res = await fetchSuggestions(prefix);
    searchDemand.push(res);
  }

  console.log('[✓] Live Search Suggestions Harvested Successfully.\n');

  console.log('[*] Phase 2: Loading Historical Database Baseline...');
  const baseline = await getDatabaseBaseline();

  console.log('[*] Phase 3: Scraping Live Product Listings on Amazon Egypt...');
  const liveResults = {};

  for (const kw of CAMPAIGN_TARGET_KEYWORDS) {
    console.log(`    -> Fetching live page 1 for: "${kw}"...`);
    const searchUrl = `https://www.amazon.eg/s?k=${encodeURIComponent(kw)}`;
    try {
      const html = await fetchUrl(searchUrl, 1, 2, false);
      const parsed = parseSearchResults(html, kw, 1);
      
      const prices = parsed.map(p => p.price).filter(p => typeof p === 'number' && p > 0);
      const sponsored = parsed.filter(p => p.isSponsored);
      const prime = parsed.filter(p => p.isPrime);
      
      const avgPrice = prices.length ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(1) : 'N/A';
      const minPrice = prices.length ? Math.min(...prices).toFixed(1) : 'N/A';
      const maxPrice = prices.length ? Math.max(...prices).toFixed(1) : 'N/A';
      
      // Top 3 featured or lowest competitors
      const sortedByRank = [...parsed].slice(0, 3).map(p => ({
        asin: p.asin,
        title: p.title.substring(0, 45),
        price: p.price,
        isPrime: p.isPrime,
        isSponsored: p.isSponsored
      }));

      liveResults[kw] = {
        totalFound: parsed.length,
        avgPrice,
        minPrice,
        maxPrice,
        sponsoredCount: sponsored.length,
        primeCount: prime.length,
        topItems: sortedByRank
      };
    } catch (err) {
      console.log(`    [!] Warning: Failed fetching "${kw}": ${err.message}`);
      liveResults[kw] = { error: err.message };
    }
    // Brief polite pause
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n================================================================');
  console.log('📊 LIVE SEARCH DEMAND (TOP SUGGESTED PHRASES BY VOLUME/RANK)');
  console.log('================================================================');
  for (const item of searchDemand) {
    console.log(`\n📌 Prefix: [${item.prefix}]`);
    if (item.suggestions.length === 0) {
      console.log('   (No autocomplete suggestions currently indexed)');
    } else {
      item.suggestions.forEach((s, idx) => {
        console.log(`   ${idx + 1}. ${s}`);
      });
    }
  }

  console.log('\n================================================================');
  console.log('📈 LIVE PRICING & COMPETITOR SHIFT ANALYSIS');
  console.log('================================================================');
  console.log('KEYWORD'.padEnd(20) + ' | ' + 'LIVE AVG'.padEnd(10) + ' | ' + 'BASE AVG'.padEnd(10) + ' | ' + 'LIVE MIN-MAX'.padEnd(18) + ' | ' + 'PRIME'.padEnd(7) + ' | SPONSORED');
  console.log('-'.repeat(85));

  for (const kw of CAMPAIGN_TARGET_KEYWORDS) {
    const live = liveResults[kw];
    const base = baseline[kw];
    if (!live || live.error) {
      console.log(kw.padEnd(20) + ' | Error / Blocked');
      continue;
    }

    const baseAvg = base ? `${base.avg_price} EGP` : 'New';
    const liveAvg = `${live.avgPrice} EGP`;
    const priceRange = `${live.minPrice} - ${live.maxPrice} EGP`;
    const primeStr = `${live.primeCount}/${live.totalFound}`;
    const sponsStr = `${live.sponsoredCount} ads`;

    console.log(kw.padEnd(20) + ' | ' + liveAvg.padEnd(10) + ' | ' + baseAvg.padEnd(10) + ' | ' + priceRange.padEnd(18) + ' | ' + primeStr.padEnd(7) + ' | ' + sponsStr);
  }

  console.log('='.repeat(80));

  // Output detailed top listings for campaign keywords
  console.log('\n================================================================');
  console.log('🏆 TOP RANKING ITEMS IN TARGET KEYWORDS');
  console.log('================================================================');
  for (const kw of CAMPAIGN_TARGET_KEYWORDS) {
    const live = liveResults[kw];
    if (!live || !live.topItems) continue;
    console.log(`\n[${kw}] Top Organic/Sponsored items:`);
    live.topItems.forEach((item, i) => {
      console.log(`  #${i + 1} ASIN: ${item.asin} | ${item.price} EGP | Prime: ${item.isPrime} | Spons: ${item.isSponsored}`);
      console.log(`     ${item.title}...`);
    });
  }

  console.log('\n[✓] Scan Complete.');
}

runLiveScan().catch(console.error);
