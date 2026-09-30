const fs = require('fs');
const path = require('path');
const db = require('./db');
const config = require('./config');

function formatCurrency(val) {
  if (val === null || val === undefined) return 'N/A';
  return `${val.toFixed(2)} EGP`;
}

function exportToCsv(capturedAt, filename) {
  const products = db.getAllProductsForExport(capturedAt);
  if (products.length === 0) return null;

  const headers = [
    'ASIN',
    'Keyword',
    'Title',
    'Price_EGP',
    'Original_Price_EGP',
    'Discount_Pct',
    'Rating',
    'Reviews_Count',
    'Rank_In_Search',
    'Is_Sponsored',
    'Is_Prime',
    'Is_Best_Seller',
    'URL',
    'Image_URL',
    'Captured_At'
  ];

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = [
    headers.join(','),
    ...products.map(p => [
      escapeCsv(p.asin),
      escapeCsv(p.keyword),
      escapeCsv(p.title),
      p.price !== null ? p.price : '',
      p.orig_price !== null ? p.orig_price : '',
      p.discount_pct !== null ? p.discount_pct : '',
      p.rating !== null ? p.rating : '',
      p.reviews_count !== null ? p.reviews_count : '',
      p.rank_in_search,
      p.is_sponsored ? 1 : 0,
      p.is_prime ? 1 : 0,
      p.is_best_seller ? 1 : 0,
      escapeCsv(p.url),
      escapeCsv(p.image_url),
      escapeCsv(p.captured_at)
    ].join(','))
  ];

  const csvContent = '\uFEFF' + rows.join('\r\n'); // UTF-8 BOM for Excel Arabic support
  fs.writeFileSync(filename, csvContent, 'utf-8');
  return filename;
}

function generateMarkdownReport(analysis) {
  const dateStr = new Date(analysis.latestTime).toISOString().split('T')[0];
  const timeStr = new Date(analysis.latestTime).toLocaleTimeString('en-US', { hour12: false });

  let md = `# تقرير استخبارات سوق أمازون مصر اليومي 📊🔍\n\n`;
  md += `> **تاريخ التقرير**: ${dateStr} الساعة ${timeStr}\n`;
  md += `> **الهدف**: مراقبة تغيرات الأسعار، الداخلين الجدد، والمنافسين في قطاع الديكور والزهور\n\n`;
  md += `---\n\n`;

  // 1. Keyword Summary Table
  md += `## 1. ملخص السوق حسب الكلمات المفتاحية (Market Overview)\n\n`;
  md += `| الكلمة المفتاحية | إجمالي المنتجات | متوسط السعر | أقل سعر | أعلى سعر | متوسط التقييم | نسبة برايم | إعلانات ممولة |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  for (const row of analysis.keywordStats) {
    const primePct = Math.round((row.prime_count / row.total_products) * 100);
    const sponsoredPct = Math.round((row.sponsored_count / row.total_products) * 100);
    md += `| **${row.keyword}** | ${row.total_products} | ${row.avg_price} ج.م | ${row.min_price} ج.م | ${row.max_price} ج.م | ⭐ ${row.avg_rating} | ${primePct}% | ${sponsoredPct}% |\n`;
  }
  md += `\n---\n\n`;

  // 2. Price Changes
  md += `## 2. تحركات الأسعار وحرب التخفيضات (Price Dynamics)\n\n`;
  if (analysis.isFirstRun) {
    md += `*هذه هي أول دورة مسح لقاعدة البيانات. ستظهر مقارنة الأسعار والفروقات بدءاً من الجولة القادمة.*\n\n`;
  } else {
    if (analysis.priceDrops.length > 0) {
      md += `### 🔴 انخفاضات الأسعار (Price Drops / Discounts)\n\n`;
      md += `| ASIN | المنتج | الكلمة المفتاحية | السعر القديم | السعر الجديد | نسبة الخفض | التقييم | رابط المنتج |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
      for (const p of analysis.priceDrops.slice(0, 10)) {
        md += `| \`${p.asin}\` | ${p.title.slice(0, 35)}... | ${p.keyword} | ${p.old_price} ج.م | **${p.new_price} ج.م** | ${p.pct_change}% | ⭐ ${p.rating || 'N/A'} | [عرض على أمازون](${p.url}) |\n`;
      }
      md += `\n`;
    } else {
      md += `> ✅ **استقرار الأسعار**: لم يتم رصد أي تخفيضات في الأسعار مقارنة بالمسح السابق.\n\n`;
    }

    if (analysis.priceHikes.length > 0) {
      md += `### 🟢 زيادات الأسعار (Price Increases)\n\n`;
      md += `| ASIN | المنتج | الكلمة المفتاحية | السعر القديم | السعر الجديد | نسبة الزيادة |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
      for (const p of analysis.priceHikes.slice(0, 5)) {
        md += `| \`${p.asin}\` | ${p.title.slice(0, 35)}... | ${p.keyword} | ${p.old_price} ج.م | **${p.new_price} ج.م** | +${p.pct_change}% |\n`;
      }
      md += `\n`;
    }
  }
  md += `---\n\n`;

  // 3. Review Velocity
  md += `## 3. سرعة المبيعات ونمو التقييمات (Sales Velocity Radar)\n\n`;
  if (analysis.isFirstRun) {
    md += `*سيتم تتبع سرعة زيادة التقييمات يومياً لاكتشاف المنتجات الأكثر مبيعاً في الوقت الفعلي.*\n\n`;
  } else if (analysis.reviewSurges.length > 0) {
    md += `| ASIN | المنتج | نمو التقييمات | إجمالي التقييمات | السعر الحالي | التقييم |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    for (const p of analysis.reviewSurges) {
      md += `| \`${p.asin}\` | ${p.title.slice(0, 35)}... | **+${p.review_growth}** تقييم | ${p.new_reviews} | ${p.price} ج.م | ⭐ ${p.rating || 'N/A'} |\n`;
    }
    md += `\n`;
  } else {
    md += `> لا توجد قفزات ملحوظة في التقييمات اليوم.\n\n`;
  }
  md += `---\n\n`;

  // 4. Undercut Threat Alert
  md += `## 4. المنافسون في النطاق السعري الحرج (أقل من ${analysis.undercutThreshold} ج.م)\n\n`;
  md += `> **تنبيه تسعير**: هذه المنتجات تبيع تحت حد الـ 199 ج.م (نطاق السلع الرخيصة). تذكر قاعدة: **لا تدخل حرب حرق أسعار كسلعة خام، ركز على تنسيق الديكور الجاهز والقيمة المضافة**.\n\n`;
  md += `| ASIN | المنتج | الكلمة المفتاحية | السعر | التقييم | عدد التقييمات | ممول؟ | الأكثر مبيعاً؟ |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  for (const p of analysis.undercuts.slice(0, 15)) {
    const isSponsoredStr = p.is_sponsored ? 'نعم (ممول)' : 'عضوي';
    const isBestSellerStr = p.is_best_seller ? '🏆 نعم' : '-';
    md += `| \`${p.asin}\` | ${p.title.slice(0, 35)}... | ${p.keyword} | **${p.price} ج.م** | ⭐ ${p.rating || 'N/A'} | ${p.reviews_count} | ${isSponsoredStr} | ${isBestSellerStr} |\n`;
  }
  md += `\n---\n\n`;

  // 5. Strategic Takeaways
  md += `## 5. التوصيات التنفيذية للتشغيل (Actionable Decisions)\n\n`;
  md += `1. **حماية الهامش الربحي**: لا تقم بخفض السعر لمجاراة المنتجات الأقل من 150 ج.م، بل عزز الصور والوصف كـ *تنسيق ديكوري فاخر جاهز*.\n`;
  md += `2. **استهداف الكلمات الأعلى سعراً**: راقب الفرق بين متوسط سعر الفازات ومتوسط سعر الورد الصناعي، واستهدف الكلمات التي تتيح هوامش أعلى من 30%.\n`;
  md += `3. **استغلال غياب برايم**: إذا كانت نسبة برايم منخفضة في فئة معينة، فإن إدراج منتجك مع شحن سريع يمنحك ميزة تنافسية فورية في تصدر نتائج البحث.\n`;

  return md;
}

function printCliSummary(analysis) {
  console.log('\n======================================================');
  console.log('       AMAZON EGYPT MARKET INTELLIGENCE REPORT         ');
  console.log('======================================================');
  console.log(`Scan Timestamp: ${analysis.latestTime}`);
  console.log(`Status: ${analysis.isFirstRun ? 'Initial Baseline Capture' : 'Comparative Differential Analysis'}`);
  console.log('------------------------------------------------------');

  console.log('\n[1] CATEGORY OVERVIEW:');
  console.table(analysis.keywordStats.map(k => ({
    Keyword: k.keyword,
    Products: k.total_products,
    'Avg Price (EGP)': k.avg_price,
    'Min Price': k.min_price,
    'Max Price': k.max_price,
    'Avg Rating': k.avg_rating
  })));

  if (!analysis.isFirstRun) {
    console.log(`\n[2] PRICE MOVEMENTS:`);
    console.log(`  Price Drops: ${analysis.priceDrops.length} items`);
    console.log(`  Price Hikes: ${analysis.priceHikes.length} items`);
    if (analysis.priceDrops.length > 0) {
      console.log('  Top Price Cuts:');
      analysis.priceDrops.slice(0, 5).forEach(d => {
        console.log(`    - [${d.asin}] ${d.title.slice(0, 30)}: ${d.old_price} -> ${d.new_price} EGP (${d.pct_change}%)`);
      });
    }

    if (analysis.reviewSurges.length > 0) {
      console.log(`\n[3] SURGING REVIEWS (Sales Indicators):`);
      analysis.reviewSurges.slice(0, 5).forEach(s => {
        console.log(`    - [${s.asin}] +${s.review_growth} new reviews | Total: ${s.new_reviews} | Price: ${s.price} EGP`);
      });
    }
  }

  console.log(`\n[4] UNDERCUT COMPETITORS (< ${analysis.undercutThreshold} EGP):`);
  console.log(`  Found ${analysis.undercuts.length} products selling below ${analysis.undercutThreshold} EGP.`);
  console.log('======================================================\n');
}

module.exports = {
  exportToCsv,
  generateMarkdownReport,
  printCliSummary
};
