#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Locate root .env file
const envPath = path.resolve(__dirname, '..', '..', '..', '.env');

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key] && val) {
        process.env[key] = val;
      }
    }
  }
}

if (!process.env.NOTION_TOKEN) {
  process.stderr.write('[notion-mcp] WARNING: NOTION_TOKEN is not set in .env!\n');
}

const isWin = process.platform === 'win32';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

const child = spawn(npxCmd, ['-y', 'notion-mcp-server'], {
  stdio: 'inherit',
  shell: isWin,
  env: process.env
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

child.on('error', (err) => {
  process.stderr.write(`[notion-mcp] Failed to spawn server: ${err.message}\n`);
  process.exit(1);
});
