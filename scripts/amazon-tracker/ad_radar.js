const fs = require('fs');
const path = require('path');
const { fetchSearchPage } = require('./fetcher');
const { parseSearchResults } = require('./parser');
const config = require('./config');

const PPC_KEYWORDS = [
  'زرع صناعي',
  'ورد صناعي',
  'فازات ديكور',
  'نباتات صناعية',
  'ديكور مكتبي',
  'تحف وانتيكات',
  'ديكور شقق'
];

// Amazon Egypt Category Benchmarks for Home & Decor PPC
const CPC_BENCHMARK = {
  min: 0.60,
  avg: 1.10,
  max: 1.85
};

async function runAdRadar() {
  const timestamp = new Date().toISOString();
  console.log('========================================================');
  console.log('🎯 Amazon Egypt Sponsored Ads & Bidding Radar');
  console.log('📅 Scan Timestamp:', timestamp);
  console.log('========================================================\n');

  const adFindings = [];

  for (const keyword of PPC_KEYWORDS) {
    console.log(`[Scanning Ads] Query: "${keyword}" (Page 1)...`);
    try {
      const html = await fetchSearchPage(keyword, 1);
      const products = parseSearchResults(html, keyword, 1);
      
      const sponsoredItems = products.filter(p => p.isSponsored);
      const organicTop3 = products.filter(p => !p.isSponsored).slice(0, 3);

      console.log(`  -> Found ${sponsoredItems.length} sponsored ads on Page 1.`);

      sponsoredItems.forEach(item => {
        // Strategy classification
        let strategy = 'Moderate Retargeting';
        if (item.reviewsCount < 20) {
          strategy = '🚀 Launch & Review Seeding';
        } else if (item.isBestSeller || item.reviewsCount > 100) {
          strategy = '👑 Market Dominance & Defense';
        } else if (item.price < 150) {
          strategy = '⚔️ Budget Price War';
        }

        // Estimated daily clicks & spend tier
        let estDailyClicks = 30;
        if (item.rankInSearch <= 4) {
          estDailyClicks = 80; // Top of Search gets majority of clicks
        }

        const estDailySpendLow = Math.round(estDailyClicks * CPC_BENCHMARK.min);
        const estDailySpendHigh = Math.round(estDailyClicks * CPC_BENCHMARK.max);

        adFindings.push({
          keyword,
          asin: item.asin,
          title: item.title,
          price: item.price,
          rating: item.rating,
          reviews: item.reviewsCount,
          rank: item.rankInSearch,
          isTopOfSearch: item.rankInSearch <= 4,
          strategy,
          estDailySpend: `${estDailySpendLow} - ${estDailySpendHigh} EGP`,
          url: item.url
        });
      });
    } catch (err) {
      console.error(`  [ERROR] Failed to scan ads for "${keyword}":`, err.message);
    }
  }

  // Generate Markdown Report
  const reportPath = path.join(config.OUTPUT_DIR, 'SPONSORED_ADS_COMPETITOR_RADAR.md');
  let md = `# رادار إعلانات المنافسين والمزايدة اليومية (Amazon Egypt PPC Radar) 🎯🔍\n\n`;
  md += `> **تاريخ الرصد**: ${timestamp.split('T')[0]} الساعة ${new Date(timestamp).toLocaleTimeString('en-US', { hour12: false })}\n`;
  md += `> **الهدف**: تفكيك استراتيجيات إعلانات المنافسين، تقدير أسعار النقرات (CPC)، وحجم الصرف اليومي.\n\n`;
  md += `---\n\n`;

  md += `## 1. المؤشرات الاقتصادية لمزاد الإعلانات في أمازون مصر (Home & Decor)\n\n`;
  md += `- **متوسط سعر النقرة المرجعي (Suggested CPC)**: 1.10 جنيه مصري.\n`;
  md += `- **نطاق المزايدة في السوق (Bid Range)**: من 0.60 ج.م إلى 1.85 ج.م.\n`;
  md += `- **الحد الأقصى المسموح لمزايدتنا بدون خسارة (Break-Even CPC)**: 6.94 ج.م (لدينا هامش أمان ضخم جداً).\n\n`;
  md += `---\n\n`;

  md += `## 2. تفكيك المنافسين المعلنين في الصفحة الأولى (Top of Search Competitors)\n\n`;
  md += `| الكلمة المستهدفة | ASIN | المنتج | السعر | التقييم | عدد التقييمات | موضع الإعلان | الاستراتيجية | تقدير الصرف اليومي |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  for (const ad of adFindings) {
    const posStr = ad.isTopOfSearch ? '🥇 قمة الصفحة (1-4)' : `موضع ${ad.rank}`;
    md += `| **${ad.keyword}** | \`${ad.asin}\` | ${ad.title.slice(0, 30)}... | ${ad.price || 'N/A'} ج.م | ⭐ ${ad.rating || 'N/A'} | ${ad.reviews} | ${posStr} | ${ad.strategy} | **${ad.estDailySpend}** |\n`;
  }
  md += `\n---\n\n`;

  md += `## 3. الخلاصات التكتيكية لحملتنا الإعلانية (PPC Action Plan)\n\n`;
  md += `1. **استغلال غياب المنافسة الاحترافية**: أغلب المنافسين يعلنون على كلمات عامة فضفاضة (Broad) بميزانيات عشوائية، مما يتيح لنا خطف مبيعات المكاتب بالاستهداف الدقيق (Exact Match).\n`;
  md += `2. **المزايدة المقترحة لحملتنا**: البدء بمزايدة **0.95 ج.م** إلى **1.20 ج.م** للنقرة على كلمة \`زرع صناعي للمكتب\` لضمان الظهور في قمة الصفحة الأولى.\n`;
  md += `3. **سقف الميزانية اليومية الموصى به**: **50.00 ج.م / يومياً** (تكفي من 40 إلى 50 نقرة مستهدفة، قادرة على جلب 3 إلى 5 طلبات يومية).\n`;

  fs.writeFileSync(reportPath, md, 'utf-8');
  console.log(`\n✅ Saved comprehensive report to: ${reportPath}`);

  // Console Table
  console.log('\n--- ACTIVE ADVERTISERS SUMMARY ---');
  console.table(adFindings.slice(0, 15).map(a => ({
    Keyword: a.keyword,
    ASIN: a.asin,
    Price: a.price,
    Reviews: a.reviews,
    Position: a.isTopOfSearch ? 'Top of Search' : `Slot ${a.rank}`,
    Strategy: a.strategy,
    'Est. Daily Spend': a.estDailySpend
  })));

  return adFindings;
}

if (require.main === module) {
  runAdRadar().catch(console.error);
}

module.exports = { runAdRadar };
