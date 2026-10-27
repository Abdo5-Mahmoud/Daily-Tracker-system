#!/usr/bin/env node
/**
 * Notion Daily Tracker Sync CLI
 * Reads, updates, and syncs Abdo's Daily Growth Tracker on Notion.
 *
 * Usage:
 *   node scripts/sync_notion_tracker.js --status
 *   node scripts/sync_notion_tracker.js --check "Job Search"
 *   node scripts/sync_notion_tracker.js --uncheck "Job Search"
 *   node scripts/sync_notion_tracker.js --append-log "Completed 1 Medium problem on LRU Cache"
 */

const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env');

function loadEnv() {
  if (!fs.existsSync(envPath)) {
    console.error('[ERROR] .env file not found.');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
  }
  return env;
}

const env = loadEnv();
const TOKEN = env.NOTION_TOKEN;
const PAGE_ID = env.NOTION_PAGE_ID || '3b4a99dc2b9a801aa66af77d89687bca';

if (!TOKEN) {
  console.error('[ERROR] NOTION_TOKEN is missing in .env');
  process.exit(1);
}

const HEADERS = {
  'Authorization': `Bearer ${TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json'
};

async function getPageBlocks() {
  const res = await fetch(`https://api.notion.com/v1/blocks/${PAGE_ID}/children`, {
    headers: HEADERS
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch blocks: ${err}`);
  }
  return await res.json();
}

async function showStatus() {
  const data = await getPageBlocks();
  console.log('\n======================================================');
  console.log('         ABDO DAILY GROWTH TRACKER (NOTION)           ');
  console.log('======================================================\n');
  data.results.forEach((block, idx) => {
    const type = block.type;
    if (type === 'to_do') {
      const text = block.to_do.rich_text.map(t => t.plain_text).join('');
      const status = block.to_do.checked ? '[x]' : '[ ]';
      console.log(`  ${status} ${text} (id: ${block.id})`);
    } else if (type === 'bulleted_list_item') {
      const text = block.bulleted_list_item.rich_text.map(t => t.plain_text).join('');
      console.log(`      * ${text}`);
    } else if (type === 'divider') {
      console.log('  ----------------------------------------------------');
    } else if (type === 'paragraph') {
      const text = block.paragraph.rich_text.map(t => t.plain_text).join('');
      if (text) console.log(`    ${text}`);
    } else if (type === 'heading_2' || type === 'heading_3') {
      const text = block[type].rich_text.map(t => t.plain_text).join('');
      console.log(`\n### ${text}\n`);
    }
  });
  console.log('\n======================================================\n');
}

async function setTaskChecked(taskPattern, checked) {
  const data = await getPageBlocks();
  const target = data.results.find(b => {
    if (b.type !== 'to_do') return false;
    const text = b.to_do.rich_text.map(t => t.plain_text).join('');
    return text.toLowerCase().includes(taskPattern.toLowerCase());
  });

  if (!target) {
    console.error(`[NOT FOUND] No to_do block matching: "${taskPattern}"`);
    return;
  }

  const patchRes = await fetch(`https://api.notion.com/v1/blocks/${target.id}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({
      to_do: {
        checked: checked
      }
    })
  });

  if (!patchRes.ok) {
    console.error('[ERROR] Failed to update block:', await patchRes.text());
  } else {
    const taskName = target.to_do.rich_text.map(t => t.plain_text).join('');
    console.log(`[SUCCESS] Task "${taskName}" marked as ${checked ? 'COMPLETED [x]' : 'PENDING [ ]'}`);
  }
}

async function appendLog(message) {
  const now = new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo' });
  const children = [
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: `[Log ${now}] ${message}`
            },
            annotations: {
              code: true,
              color: 'blue'
            }
          }
        ]
      }
    }
  ];

  const res = await fetch(`https://api.notion.com/v1/blocks/${PAGE_ID}/children`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({ children })
  });

  if (!res.ok) {
    console.error('[ERROR] Failed to append log:', await res.text());
  } else {
    console.log(`[SUCCESS] Appended log entry: "${message}"`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--status')) {
    await showStatus();
    return;
  }

  if (args[0] === '--check') {
    const pattern = args.slice(1).join(' ');
    await setTaskChecked(pattern, true);
    return;
  }

  if (args[0] === '--uncheck') {
    const pattern = args.slice(1).join(' ');
    await setTaskChecked(pattern, false);
    return;
  }

  if (args[0] === '--append-log') {
    const msg = args.slice(1).join(' ');
    await appendLog(msg);
    return;
  }

  console.log('Usage:');
  console.log('  node scripts/sync_notion_tracker.js --status');
  console.log('  node scripts/sync_notion_tracker.js --check <task>');
  console.log('  node scripts/sync_notion_tracker.js --uncheck <task>');
  console.log('  node scripts/sync_notion_tracker.js --append-log <message>');
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
