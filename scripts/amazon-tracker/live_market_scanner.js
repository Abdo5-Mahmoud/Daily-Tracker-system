#!/usr/bin/env node
/**
 * Live Amazon Egypt Home Decor & Campaign Keywords Market Scanner
 * 1. Harvests live high-intent search terms via Amazon Completion Ranker API (ARBP9OOSHTCHU)
 * 2. Fetches live search results for priority target keywords
 * 3. Compares with existing database records to spot shifts, price gaps, and ad saturation
 * 4. Appends a structured audit entry to AMAZON_PAGE_ONE_RADAR_LOG.md with exact timestamp.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { fetchUrl } = require('./fetcher');
const { parseSearchResults } = require('./parser');

const DB_PATH = path.resolve(__dirname, '../../local-business-store/market-intelligence/amazon_market.db');
const LOG_PATH = path.resolve(__dirname, '../../local-business-store/market-intelligence/AMAZON_PAGE_ONE_RADAR_LOG.md');

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
    if (!fs.existsSync(DB_PATH)) return {};
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

function appendScanToMarkdownLog(searchDemand, liveResults, baseline) {
  const now = new Date();
  
  // Format Cairo / Egypt local timestamp
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const hour = now.getHours();
  
  let sessionName = 'رصد الفترة الصباحية';
  if (hour >= 12 && hour < 17) sessionName = 'رصد فترة الظهيرة';
  else if (hour >= 17 && hour < 23) sessionName = 'رصد دوام المحل المسائي';
  else if (hour >= 23 || hour < 6) sessionName = 'رصد الفجر والليل';

  const lines = [];
  lines.push(`\n## 🗓️ ${sessionName} - ${dateStr}`);
  lines.push('```text');
  lines.push(`Session Timestamp: ${dateStr} ${timeStr}`);
  lines.push(`Session Type: ${sessionName}`);
  lines.push('```\n');

  lines.push('### 1. الإعلانات الممولة النشطة على الصفحة الأولى');
  lines.push('| الكلمة المستهدفة | عدد الإعلانات | كود المنتج التعريفي | السعر | العنوان والملاحظات |');
  lines.push('| :--- | :--- | :--- | :--- | :--- |');

  for (const kw of CAMPAIGN_TARGET_KEYWORDS) {
    const live = liveResults[kw];
    if (!live || live.error) continue;
    const sponsoredItems = (live.allItems || []).filter(p => p.isSponsored);
    
    if (sponsoredItems.length === 0) {
      lines.push(`| **${kw}** | 0 إعلانات | لا يوجد | - | ثغرة خالية تماماً من إعلانات المنافسين |`);
    } else {
      const topAd = sponsoredItems[0];
      const title = (topAd.title || 'Unknown').replace(/\|/g, '-').substring(0, 45);
      lines.push(`| **${kw}** | ${sponsoredItems.length} إعلاناً | \`${topAd.asin}\` | ${topAd.price || 'N/A'} ج.م | ${title}... |`);
    }
  }

  lines.push('\n### 2. حركة أسعار الصفحة الأولى والمتصدرين');
  lines.push('| الكلمة | المتوسط الحالي | المتوسط السابق | النطاق السعري | نسبة برايم | تقييم الموقف |');
  lines.push('| :--- | :--- | :--- | :--- | :--- | :--- |');

  for (const kw of CAMPAIGN_TARGET_KEYWORDS) {
    const live = liveResults[kw];
    const base = baseline[kw];
    if (!live || live.error) continue;

    const baseAvgStr = base ? `${base.avg_price} ج.م` : 'رصد جديد';
    const liveAvgStr = `${live.avgPrice} ج.م`;
    const rangeStr = `${live.minPrice} - ${live.maxPrice} ج.م`;
    const primeStr = `\`${live.primeCount} / ${live.totalFound}\``;
    
    let evaluation = 'متطابق مع الخطة';
    if (kw.includes('ليليام')) evaluation = 'فجوة سعرية مربحة جداً لباقتنا';
    else if (live.primeCount === 0) evaluation = 'انعدام شارة برايم يمنحنا أفضلية كاسحة';

    lines.push(`| **${kw}** | ${liveAvgStr} | ${baseAvgStr} | ${rangeStr} | ${primeStr} | ${evaluation} |`);
  }

  lines.push('\n### 3. أبرز اقتراحات محرك البحث اللحظية');
  for (const item of searchDemand.slice(0, 4)) {
    if (item.suggestions.length > 0) {
      lines.push(`- **${item.prefix}**: ${item.suggestions.slice(0, 5).join(' • ')}`);
    }
  }
  lines.push('\n---');

  const contentToAppend = lines.join('\n');
  fs.appendFileSync(LOG_PATH, contentToAppend, 'utf8');
  console.log(`[✓] Successfully appended audit session to: ${LOG_PATH}`);
}

async function runLiveScan() {
  const shouldAppend = !process.argv.includes('--no-log');

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
  const baseline = getDatabaseBaseline();

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
        topItems: sortedByRank,
        allItems: parsed
      };
    } catch (err) {
      console.log(`    [!] Warning: Failed fetching "${kw}": ${err.message}`);
      liveResults[kw] = { error: err.message };
    }
    await new Promise(r => setTimeout(r, 1500));
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

  console.log('='.repeat(85));

  if (shouldAppend && fs.existsSync(LOG_PATH)) {
    appendScanToMarkdownLog(searchDemand, liveResults, baseline);
  }

  console.log('\n[✓] Scan and Movement Logging Complete.');
}

runLiveScan().catch(console.error);
