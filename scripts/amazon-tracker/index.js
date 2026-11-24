#!/usr/bin/env node
const config = require('./config');
const db = require('./db');
const { ingestHtmlFile, ingestInboxDirectory } = require('./ingest_search');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--file' && argv[i + 1]) args.file = argv[++i];
    else if (token === '--keyword' && argv[i + 1]) args.keyword = argv[++i];
    else if (token === '--inbox') args.inbox = true;
    else if (token === '--freshness') args.freshness = true;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.freshness) {
    const handle = db.openDb(config.DB_PATH);
    const report = db.getFreshnessReport(config.STALE_THRESHOLD_HOURS, handle);
    handle.close();
    console.table(report);
    return;
  }

  if (args.file) {
    const summary = ingestHtmlFile({ filePath: args.file, keyword: args.keyword });
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const results = ingestInboxDirectory(config.INBOX_DIR);
  if (results.length === 0) {
    console.log(`Inbox empty at ${config.INBOX_DIR}`);
    console.log('Save an Amazon Egypt search page in Chrome (Ctrl+S) into inbox/ or pass --file <path> --keyword <kw>.');
    return;
  }
  console.log(JSON.stringify(results, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = { parseArgs };
