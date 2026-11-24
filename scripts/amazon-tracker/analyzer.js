const db = require('./db');
const config = require('./config');

/** Computes comparative deltas and staleness metadata for a captured timestamp. */
function analyzeLatestRun(currentTimestamp, dbHandle = db.getDb(), keyword = null) {
  const timestamps = db.getLatestTimestamps(dbHandle, keyword);
  const latestTime = currentTimestamp || timestamps.latest;
  const previousTime = timestamps.previous;
  const isFirstRun = !previousTime || previousTime === latestTime;

  const freshness = db.getFreshnessReport(config.STALE_THRESHOLD_HOURS, dbHandle);
  const targetFreshness = keyword
    ? freshness.find(f => f.keyword === keyword)
    : freshness[0];

  const keywordStats = db.getKeywordStats(latestTime, dbHandle);
  const priceChanges = isFirstRun ? [] : db.getPriceChanges(latestTime, previousTime, dbHandle);
  const reviewSurges = isFirstRun ? [] : db.getReviewSurges(latestTime, previousTime, dbHandle);
  const undercuts = db.getUndercutCompetitors(config.COMPETITOR_UNDERCUT_THRESHOLD, latestTime, dbHandle);

  return {
    latestTime,
    previousTime,
    isFirstRun,
    ageHours: targetFreshness ? targetFreshness.age_hours : null,
    isStale: targetFreshness ? targetFreshness.is_stale : true,
    keywordStats,
    priceDrops: priceChanges.filter(p => p.price_diff < 0),
    priceHikes: priceChanges.filter(p => p.price_diff > 0),
    reviewSurges,
    undercuts,
    undercutThreshold: config.COMPETITOR_UNDERCUT_THRESHOLD,
  };
}

module.exports = { analyzeLatestRun };
