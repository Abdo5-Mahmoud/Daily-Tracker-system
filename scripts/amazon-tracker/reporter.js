const fs = require('fs');
const db = require('./db');

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  return `"${String(val).replace(/"/g, '""')}"`;
}

/** Exports captured snapshot products to Excel-compatible UTF-8 BOM CSV. */
function exportToCsv(capturedAt, filename, dbHandle = db.getDb()) {
  const products = db.getAllProductsForExport(capturedAt, dbHandle);
  if (products.length === 0) return null;

  const headers = [
    'ASIN', 'Keyword', 'Title', 'Price_EGP', 'Original_Price_EGP',
    'Discount_Pct', 'Coupon_Text', 'Coupon_EGP', 'Coupon_Pct',
    'Rating', 'Reviews_Count', 'Rank_In_Search', 'Is_Sponsored',
    'Is_Prime', 'Is_Best_Seller', 'Is_Our_Product', 'URL', 'Image_URL', 'Captured_At',
  ];

  const rows = [
    headers.join(','),
    ...products.map(p =>
      [
        escapeCsv(p.asin),
        escapeCsv(p.keyword),
        escapeCsv(p.title),
        p.price ?? '',
        p.orig_price ?? '',
        p.discount_pct ?? '',
        escapeCsv(p.coupon_text),
        p.coupon_egp ?? '',
        p.coupon_pct ?? '',
        p.rating ?? '',
        p.reviews_count ?? '',
        p.rank_in_search,
        p.is_sponsored ? 1 : 0,
        p.is_prime ? 1 : 0,
        p.is_best_seller ? 1 : 0,
        p.is_our_product ? 1 : 0,
        escapeCsv(p.url),
        escapeCsv(p.image_url),
        escapeCsv(p.captured_at),
      ].join(',')
    ),
  ];

  fs.writeFileSync(filename, '\uFEFF' + rows.join('\r\n'), 'utf-8');
  return filename;
}

/** Formats a Markdown intelligence briefing adhering strictly to line purity. */
function generateMarkdownReport(analysis) {
  const dt = analysis.latestTime ? new Date(analysis.latestTime) : new Date();
  const dateStr = dt.toISOString().split('T')[0];
  const timeStr = dt.toLocaleTimeString('en-US', { hour12: false });

  const lines = [
    '# Amazon Egypt Market Intelligence Report',
    '',
    '```text',
    `Captured Timestamp: ${dateStr} ${timeStr}`,
    `Freshness Status: ${analysis.isStale ? `STALE WARNING (${analysis.ageHours}h old)` : 'FRESH (< 24h)'}`,
    '```',
    '',
    '## 1. Keyword Market Summary',
    '',
    '| Keyword | Items | Avg Price | Min - Max | Avg Rating | Prime | Sponsored | Coupons | Our SKUs |',
    '| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |',
  ];

  for (const row of analysis.keywordStats) {
    const primePct = Math.round(((row.prime_count || 0) / row.total_products) * 100);
    const sponsoredPct = Math.round(((row.sponsored_count || 0) / row.total_products) * 100);
    const couponPct = Math.round(((row.coupon_count || 0) / row.total_products) * 100);
    lines.push(
      `| ${row.keyword} | ${row.total_products} | ${row.avg_price} EGP | ${row.min_price} - ${row.max_price} | ${row.avg_rating || 'N/A'} | ${primePct}% | ${sponsoredPct}% | ${couponPct}% | ${row.our_products_count || 0} |`
    );
  }

  lines.push('', '## 2. Low-Price Competitors (< ' + analysis.undercutThreshold + ' EGP)', '');
  lines.push('| ASIN | Price | Rating | Reviews | Type | Best Seller |');
  lines.push('| :--- | :--- | :--- | :--- | :--- | :--- |');
  for (const p of analysis.undercuts.slice(0, 15)) {
    const adType = p.is_sponsored ? 'Sponsored' : 'Organic';
    lines.push(
      `| \`${p.asin}\` | ${p.price} EGP | ${p.rating || 'N/A'} | ${p.reviews_count} | ${adType} | ${p.is_best_seller ? 'Yes' : '-'} |`
    );
  }

  return lines.join('\n') + '\n';
}

function printCliSummary(analysis) {
  console.log('\n======================================================');
  console.log('   AMAZON EGYPT MARKET INTELLIGENCE (FLORA_HOME)');
  console.log('======================================================');
  console.log(`Captured At: ${analysis.latestTime}`);
  if (analysis.isStale) {
    console.log(`[!] STALE WARNING: Data is ${analysis.ageHours}h old (>24h).`);
  }
  console.table(
    analysis.keywordStats.map(k => ({
      Keyword: k.keyword,
      Items: k.total_products,
      'Avg EGP': k.avg_price,
      'Min-Max': `${k.min_price}-${k.max_price}`,
      Coupons: k.coupon_count || 0,
      'Our SKUs': k.our_products_count || 0,
    }))
  );
}

module.exports = { exportToCsv, generateMarkdownReport, printCliSummary };
