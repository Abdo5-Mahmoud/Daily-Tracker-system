const https = require('https');
const zlib = require('zlib');
const config = require('./config');

function getRandomUserAgent() {
  const agents = config.USER_AGENTS;
  return agents[Math.floor(Math.random() * agents.length)];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomDelay(min = config.MIN_DELAY_MS, max = config.MAX_DELAY_MS) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fetchUrl(url, attempt = 1, maxAttempts = 3) {
  return new Promise((resolve, reject) => {
    const userAgent = getRandomUserAgent();
    const parsedUrl = new URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Sec-Ch-Ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      }
    };

    const req = https.request(options, (res) => {
      // Check for redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = `${config.BASE_URL}${redirectUrl}`;
        }
        return fetchUrl(redirectUrl, attempt, maxAttempts).then(resolve).catch(reject);
      }

      // Check for rate limit or block
      if (res.statusCode === 503 || res.statusCode === 429) {
        if (attempt < maxAttempts) {
          const backoff = attempt * 4000;
          console.warn(`[WARN] Got HTTP ${res.statusCode}. Backing off for ${backoff}ms before retry ${attempt + 1}...`);
          return sleep(backoff)
            .then(() => fetchUrl(url, attempt + 1, maxAttempts))
            .then(resolve)
            .catch(reject);
        } else {
          return reject(new Error(`Failed with HTTP ${res.statusCode} after ${maxAttempts} attempts`));
        }
      }

      let stream = res;
      const encoding = res.headers['content-encoding'];
      if (encoding === 'gzip') {
        stream = res.pipe(zlib.createGunzip());
      } else if (encoding === 'br') {
        stream = res.pipe(zlib.createBrotliDecompress());
      } else if (encoding === 'deflate') {
        stream = res.pipe(zlib.createInflate());
      }

      let html = '';
      stream.on('data', chunk => {
        html += chunk;
      });

      stream.on('end', () => {
        // Detect Amazon Captcha or Robot Check
        const isCaptcha = html.includes('validateCaptcha') ||
                          html.includes('Robot Check') ||
                          html.includes('To discuss automated access to Amazon data please contact');

        if (isCaptcha) {
          if (attempt < maxAttempts) {
            const backoff = (attempt + 1) * 5000;
            console.warn(`[WARN] Amazon CAPTCHA detected. Sleeping for ${backoff}ms before retry ${attempt + 1}...`);
            return sleep(backoff)
              .then(() => fetchUrl(url, attempt + 1, maxAttempts))
              .then(resolve)
              .catch(reject);
          } else {
            return reject(new Error('Amazon CAPTCHA / Robot Check triggered. Request aborted.'));
          }
        }

        resolve(html);
      });

      stream.on('error', err => reject(err));
    });

    req.on('error', (err) => {
      if (attempt < maxAttempts) {
        const backoff = attempt * 3000;
        console.warn(`[WARN] Network error (${err.message}). Retrying in ${backoff}ms...`);
        sleep(backoff)
          .then(() => fetchUrl(url, attempt + 1, maxAttempts))
          .then(resolve)
          .catch(reject);
      } else {
        reject(err);
      }
    });

    req.setTimeout(15000, () => {
      req.destroy(new Error('Request timed out after 15000ms'));
    });

    req.end();
  });
}

async function fetchSearchPage(keyword, page = 1) {
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `${config.BASE_URL}/s?k=${encodedKeyword}&page=${page}`;
  
  // Apply jitter delay before making the request
  const delay = getRandomDelay();
  await sleep(delay);
  
  return fetchUrl(url);
}

module.exports = {
  fetchUrl,
  fetchSearchPage,
  sleep,
  getRandomDelay
};
