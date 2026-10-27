#!/usr/bin/env node
/**
 * Notion API Connectivity Verification Script
 * Validates NOTION_TOKEN from .env and lists connected pages/databases.
 */

const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env');

function loadEnv() {
  if (!fs.existsSync(envPath)) {
    console.error('[ERROR] .env file not found at:', envPath);
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

async function verifyNotion() {
  const env = loadEnv();
  const token = env.NOTION_TOKEN;

  if (!token || token.trim() === '' || token.includes('your_token_here')) {
    console.error('\n[NOTION_STATUS: UNSET]');
    console.error('NOTION_TOKEN is not configured in .env yet.');
    console.error('Please open .env and paste your secret token: NOTION_TOKEN=secret_...\n');
    process.exit(2);
  }

  console.log('\n======================================================');
  console.log('[1/2] Verifying Notion API Authentication...');
  console.log('======================================================');

  try {
    const userRes = await fetch('https://api.notion.com/v1/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });

    if (!userRes.ok) {
      const errBody = await userRes.text();
      console.error(`[ERROR] Authentication failed (HTTP ${userRes.status}):`, errBody);
      process.exit(1);
    }

    const userData = await userRes.json();
    console.log('[SUCCESS] Connected as Bot Integration:', userData.name || userData.id);
    if (userData.bot && userData.bot.owner) {
      console.log('Workspace Owner Type:', userData.bot.owner.type);
    }

    console.log('\n======================================================');
    console.log('[2/2] Scanning Accessible Pages & Databases...');
    console.log('======================================================');

    const searchRes = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ page_size: 15 })
    });

    if (!searchRes.ok) {
      const errBody = await searchRes.text();
      console.error(`[ERROR] Search failed (HTTP ${searchRes.status}):`, errBody);
      process.exit(1);
    }

    const searchData = await searchRes.json();
    const results = searchData.results || [];

    if (results.length === 0) {
      console.warn('\n[WARNING] No pages or databases found!');
      console.warn('Remember: Notion requires you to explicitly share each page with the integration:');
      console.warn('1. Open your Notion page/database');
      console.warn('2. Click "..." at the top right -> "Connect to" -> Select your integration\n');
    } else {
      console.log(`\n[SUCCESS] Found ${results.length} accessible items:\n`);
      results.forEach((item, idx) => {
        let title = 'Untitled';
        if (item.properties && item.properties.title && item.properties.title.title) {
          title = item.properties.title.title.map(t => t.plain_text).join('');
        } else if (item.properties && item.properties.Name && item.properties.Name.title) {
          title = item.properties.Name.title.map(t => t.plain_text).join('');
        } else if (item.title && Array.isArray(item.title)) {
          title = item.title.map(t => t.plain_text).join('');
        }
        console.log(`  ${idx + 1}. [${item.object.toUpperCase()}] "${title}" (ID: ${item.id})`);
        console.log(`     URL: ${item.url}`);
      });
      console.log('\nAll systems operational! Notion integration is ready.\n');
    }

  } catch (err) {
    console.error('[ERROR] Network or unexpected error:', err.message);
    process.exit(1);
  }
}

verifyNotion();
