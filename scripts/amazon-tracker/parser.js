const config = require('./config');

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function parseSearchResults(html, keyword, page = 1) {
  const products = [];
  
  // Amazon product cards are divs having data-asin and data-component-type="s-search-result"
  // We use regex to match each card block accurately
  const cardRegex = /<div\s+[^>]*?data-asin="([A-Z0-9]{10})"[^>]*?>([\s\S]*?)(?=<div\s+[^>]*?data-asin="[A-Z0-9]{10}"|$)/g;

  let rank = (page - 1) * 48;
  let match;

  while ((match = cardRegex.exec(html)) !== null) {
    const asin = match[1];
    const block = match[2];

    // Verify it is an actual search result item, not an empty or ad carousel container
    const isSearchResult = block.includes('data-component-type="s-search-result"') ||
                          match[0].includes('data-component-type="s-search-result"') ||
                          block.includes('s-product-image-container');

    if (!isSearchResult) continue;

    rank++;

    // 1. Title
    const titleMatch = block.match(/<h2[^>]*>[\s\S]*?<span[^>]*>(.*?)<\/span>/i) ||
                       block.match(/alt="([^"]+)"/i) ||
                       block.match(/<span class="a-size-base-plus[^"]*"[^>]*>(.*?)<\/span>/i);
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : 'Unknown Title';

    // Skip empty or generic placeholder titles
    if (!title || title.length < 3) continue;

    // 2. Price
    let price = null;
    const priceWholeMatch = block.match(/<span class="a-price-whole">([0-9,]+)/i);
    const priceFractionMatch = block.match(/<span class="a-price-fraction">([0-9]+)/i);

    if (priceWholeMatch) {
      const whole = priceWholeMatch[1].replace(/,/g, '');
      const fraction = priceFractionMatch ? priceFractionMatch[1] : '00';
      price = parseFloat(`${whole}.${fraction}`);
    } else {
      // Fallback for flat offscreen prices
      const flatPriceMatch = block.match(/<span class="a-offscreen">([0-9,.]+)\s*(?:EGP|جنيه)?<\/span>/i);
      if (flatPriceMatch) {
        price = parseFloat(flatPriceMatch[1].replace(/,/g, ''));
      }
    }

    // 3. Original / List Price (strike-through price)
    let origPrice = null;
    const origPriceMatch = block.match(/<span class="a-price a-text-price"[^>]*>[\s\S]*?<span class="a-offscreen">([0-9,.]+)/i);
    if (origPriceMatch) {
      origPrice = parseFloat(origPriceMatch[1].replace(/,/g, ''));
    }

    // 4. Discount Percentage
    let discountPct = 0;
    if (origPrice && price && origPrice > price) {
      discountPct = Math.round(((origPrice - price) / origPrice) * 100);
    }

    // 5. Rating (out of 5 stars)
    let rating = null;
    const ratingMatch = block.match(/<span class="a-icon-alt">([0-9.]+)\s*(?:out of 5 stars|من 5 نجوم)/i) ||
                        block.match(/([0-9.]+)\s*out of 5 stars/i);
    if (ratingMatch) {
      rating = parseFloat(ratingMatch[1]);
    }

    // 6. Review Count
    let reviewsCount = 0;
    const reviewsMatch = block.match(/aria-label="([0-9,]+)\s*(?:ratings|تقييم)/i) ||
                         block.match(/<span class="a-size-base s-underline-text">([0-9,]+)<\/span>/i) ||
                         block.match(/<span class="a-size-base">([0-9,]+)<\/span>/i);
    if (reviewsMatch) {
      reviewsCount = parseInt(reviewsMatch[1].replace(/,/g, ''), 10) || 0;
    }

    // 7. Badges & Attributes
    const isSponsored = block.includes('s-sponsored-label') ||
                        block.includes('Sponsored') ||
                        block.includes('ممول');

    const isPrime = block.includes('a-icon-prime');

    const isBestSeller = block.includes('Best Seller') ||
                         block.includes('الأكثر مبيعاً') ||
                         block.includes('a-badge-text');

    // 8. Image URL
    let imageUrl = null;
    const imgMatch = block.match(/<img[^>]+class="[^"]*s-image[^"]*"[^>]+src="([^">]+)"/i) ||
                     block.match(/<img[^>]+src="([^">]+)"[^>]+class="[^"]*s-image[^"]*"/i);
    if (imgMatch) {
      imageUrl = imgMatch[1];
    }

    // 9. Canonical Product URL
    const url = `${config.BASE_URL}/dp/${asin}`;

    products.push({
      asin,
      title,
      keyword,
      price,
      origPrice,
      discountPct,
      rating,
      reviewsCount,
      isSponsored,
      isPrime,
      isBestSeller,
      imageUrl,
      url,
      rankInSearch: rank
    });
  }

  return products;
}

module.exports = {
  parseSearchResults,
  decodeHtmlEntities
};
