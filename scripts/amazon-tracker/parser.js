const config = require('./config');

const ARABIC_DIGITS_MAP = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
  '٫': '.',
  '،': ',',
};

const OUR_ASIN_SET = new Set(
  (config.MY_PRODUCTS || []).map(p => (typeof p === 'string' ? p : p.asin))
);

/** Converts Arabic-Indic digits and decimal marks into ASCII numerals. */
function normalizeDigits(str) {
  if (!str) return '';
  return String(str).replace(/[٠-٩٫،]/g, ch => ARABIC_DIGITS_MAP[ch] || ch);
}

/** Strips HTML tags and normalizes common HTML entities. */
function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Rejects blocked/CAPTCHA HTML loudly so bad inputs never masquerade as empty searches. */
function assertNotBlockedHtml(html) {
  const markers = [
    'validateCaptcha',
    'Robot Check',
    'Type the characters you see in this image',
    'To discuss automated access to Amazon data please contact',
    'bm-verify',
  ];
  for (const marker of markers) {
    if (html.includes(marker)) {
      throw new Error(
        `Blocked HTML / CAPTCHA page detected (${marker}). Solve manually in Chrome and re-save HTML.`
      );
    }
  }
}

function extractPrice(block) {
  const wholeMatch = block.match(/<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)</i);
  const fractionMatch = block.match(/<span[^>]*class="[^"]*a-price-fraction[^"]*"[^>]*>([^<]+)</i);

  if (wholeMatch) {
    const whole = normalizeDigits(wholeMatch[1]).replace(/[^0-9]/g, '');
    const fraction = fractionMatch
      ? normalizeDigits(fractionMatch[1]).replace(/[^0-9]/g, '')
      : '00';
    if (whole) return parseFloat(`${whole}.${fraction || '00'}`);
  }

  const offscreen = block.match(
    /<span[^>]*class="[^"]*a-offscreen[^"]*"[^>]*>([^<]*(?:EGP|جنيه|ج\.م)[^<]*)<\/span>/i
  );
  if (offscreen) {
    const numeric = normalizeDigits(offscreen[1]).replace(/[^0-9.]/g, '');
    if (numeric) return parseFloat(numeric);
  }
  return null;
}

function extractCoupon(block) {
  const couponMatch =
    block.match(/<span[^>]*class="[^"]*s-coupon-highlight-color[^"]*"[^>]*>([\s\S]*?)<\/span>/i) ||
    block.match(/((?:وفر|خصم|Save)\s*[0-9٠-٩.,]+\s*(?:ج\.م|جنيه|EGP|%))/i);

  if (!couponMatch) {
    return { couponText: null, couponEgp: 0, couponPct: 0 };
  }

  const couponText = decodeHtmlEntities(couponMatch[1]);
  const normalized = normalizeDigits(couponText);
  const pctMatch = normalized.match(/([0-9]+(?:\.[0-9]+)?)\s*%/);
  const egpMatch = normalized.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:ج\.م|جنيه|EGP)/i);

  return {
    couponText,
    couponEgp: egpMatch ? parseFloat(egpMatch[1]) : 0,
    couponPct: pctMatch ? parseFloat(pctMatch[1]) : 0,
  };
}

function extractReviewsCount(block) {
  const match =
    block.match(/aria-label="([0-9٠-٩,،]+)\s*(?:ratings|تقييم(?:ات)?)"/i) ||
    block.match(/<span[^>]*class="[^"]*s-underline-text[^"]*"[^>]*>\s*\(?([0-9٠-٩,،]+)\)?\s*<\/span>/i);

  if (!match) return 0;
  const cleaned = normalizeDigits(match[1]).replace(/,/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Parses saved Amazon Egypt search results HTML into normalized product snapshots.
 */
function parseSearchResults(html, keyword, page = 1) {
  if (!html || typeof html !== 'string') {
    throw new Error('Empty HTML payload provided to parser.');
  }
  assertNotBlockedHtml(html);

  const products = [];
  const cardRegex = /<div\s+[^>]*?data-asin="([A-Z0-9]{10})"[^>]*?>([\s\S]*?)(?=<div\s+[^>]*?data-asin="[A-Z0-9]{10}"|$)/g;

  let rank = (page - 1) * 48;
  let match;

  while ((match = cardRegex.exec(html)) !== null) {
    const asin = match[1];
    const openTag = match[0];
    const block = match[2];

    const isSearchResult =
      openTag.includes('data-component-type="s-search-result"') ||
      block.includes('data-component-type="s-search-result"') ||
      block.includes('s-product-image-container');

    if (!isSearchResult) continue;

    rank++;

    const titleMatch =
      block.match(/<h2[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i) ||
      block.match(/alt="([^"]+)"/i) ||
      block.match(/<span[^>]*class="[^"]*a-size-base-plus[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : 'Unknown Title';
    if (!title || title.length < 3) continue;

    const price = extractPrice(block);
    const origMatch = block.match(
      /<span[^>]*class="[^"]*a-price a-text-price[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*a-offscreen[^"]*"[^>]*>([^<]+)/i
    );
    const origPrice = origMatch
      ? parseFloat(normalizeDigits(origMatch[1]).replace(/[^0-9.]/g, '')) || null
      : null;

    const discountPct =
      origPrice && price && origPrice > price
        ? Math.round(((origPrice - price) / origPrice) * 100)
        : 0;

    const ratingMatch = block.match(/([0-9٠-٩.,]+)\s*(?:out of 5 stars|من 5 نجوم)/i);
    const rating = ratingMatch ? parseFloat(normalizeDigits(ratingMatch[1])) : null;

    const reviewsCount = extractReviewsCount(block);
    const { couponText, couponEgp, couponPct } = extractCoupon(block);

    const isSponsored =
      block.includes('s-sponsored-label') ||
      block.includes('Sponsored') ||
      block.includes('ممول');
    const isPrime = block.includes('a-icon-prime');
    const isBestSeller =
      block.includes('Best Seller') ||
      block.includes('الأكثر مبيعاً') ||
      block.includes('a-badge-text');

    const imgMatch =
      block.match(/<img[^>]+class="[^"]*s-image[^"]*"[^>]+src="([^">]+)"/i) ||
      block.match(/<img[^>]+src="([^">]+)"[^>]+class="[^"]*s-image[^"]*"/i);

    products.push({
      asin,
      title,
      keyword,
      price,
      origPrice,
      discountPct,
      couponText,
      couponEgp,
      couponPct,
      rating,
      reviewsCount,
      isSponsored,
      isPrime,
      isBestSeller,
      isOurProduct: OUR_ASIN_SET.has(asin),
      imageUrl: imgMatch ? imgMatch[1] : null,
      url: `${config.BASE_URL}/dp/${asin}`,
      rankInSearch: rank,
    });
  }

  return products;
}

module.exports = {
  normalizeDigits,
  decodeHtmlEntities,
  assertNotBlockedHtml,
  parseSearchResults,
};
