const db = require('./db');
const config = require('./config');

function analyzeLatestRun(currentTimestamp) {
  const timestamps = db.getLatestTimestamps();
  const latestTime = currentTimestamp || timestamps.latest;
  const previousTime = timestamps.previous;

  const isFirstRun = !previousTime || previousTime === latestTime;

  // 1. Keyword breakdown & market averages
  const keywordStats = db.getKeywordStats(latestTime);

  // 2. Price movements (cuts and hikes)
  const priceChanges = isFirstRun ? [] : db.getPriceChanges(latestTime, previousTime);
  const priceDrops = priceChanges.filter(p => p.price_diff < 0);
  const priceHikes = priceChanges.filter(p => p.price_diff > 0);

  // 3. Review velocity (surging products)
  const reviewSurges = isFirstRun ? [] : db.getReviewSurges(latestTime, previousTime);

  // 4. New entrants in the market
  const newCompetitors = db.getNewCompetitors(latestTime, previousTime);

  // 5. Undercut competitors (selling below threshold)
  const undercuts = db.getUndercutCompetitors(config.COMPETITOR_UNDERCUT_THRESHOLD, latestTime);

  return {
    latestTime,
    previousTime,
    isFirstRun,
    keywordStats,
    priceDrops,
    priceHikes,
    reviewSurges,
    newCompetitors,
    undercuts,
    undercutThreshold: config.COMPETITOR_UNDERCUT_THRESHOLD
  };
}

module.exports = {
  analyzeLatestRun
};
