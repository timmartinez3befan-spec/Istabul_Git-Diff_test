#!/usr/bin/env node
/**
 * coverage-history.js
 * 
 * Manages coverage report history for tracking changes over time.
 * Usage: node scripts/coverage-history.js [command]
 *   - save: Save current coverage to history
 *   - list: List all saved coverage snapshots
 *   - compare <id>: Compare current coverage with a snapshot
 *   - clean: Remove old coverage snapshots (keep last 30)
 */

const fs = require('fs');
const path = require('path');

const HISTORY_DIR = path.resolve(process.cwd(), 'coverage-history');
const CURRENT_COVERAGE = path.resolve(process.cwd(), 'coverage', 'coverage-final.json');

function ensureHistoryDir() {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

function saveCoverageSnapshot() {
  ensureHistoryDir();
  if (!fs.existsSync(CURRENT_COVERAGE)) {
    console.error('No current coverage found at', CURRENT_COVERAGE);
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotPath = path.join(HISTORY_DIR, `coverage-${timestamp}.json`);
  const data = fs.readFileSync(CURRENT_COVERAGE, 'utf8');
  fs.writeFileSync(snapshotPath, data, 'utf8');
  
  // Also save metadata
  const metaPath = path.join(HISTORY_DIR, `coverage-${timestamp}.meta.json`);
  const meta = {
    timestamp: new Date().toISOString(),
    branch: process.env.GIT_BRANCH || 'unknown',
    commit: process.env.GIT_COMMIT || 'unknown',
    author: process.env.GIT_AUTHOR || 'unknown'
  };
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
  
  console.log(`✅ Coverage snapshot saved: ${snapshotPath}`);
  return snapshotPath;
}

function listSnapshots() {
  ensureHistoryDir();
  const files = fs.readdirSync(HISTORY_DIR)
    .filter(f => f.startsWith('coverage-') && f.endsWith('.json') && !f.includes('.meta'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('No coverage snapshots found.');
    return;
  }

  console.log(`\n📋 Coverage History (${files.length} snapshots):\n`);
  files.forEach((f, i) => {
    const metaPath = path.join(HISTORY_DIR, f.replace('.json', '.meta.json'));
    let meta = {};
    try {
      if (fs.existsSync(metaPath)) {
        meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      }
    } catch (e) {}
    
    const timestamp = f.replace('coverage-', '').replace('.json', '').replace(/-/g, ':').slice(0, -4);
    console.log(`  [${i}] ${f}`);
    console.log(`      Timestamp: ${meta.timestamp || timestamp}`);
    if (meta.branch) console.log(`      Branch: ${meta.branch}`);
    if (meta.commit) console.log(`      Commit: ${meta.commit.slice(0, 8)}`);
  });
  console.log();
}

function cleanOldSnapshots(keep = 30) {
  ensureHistoryDir();
  const files = fs.readdirSync(HISTORY_DIR)
    .filter(f => f.startsWith('coverage-') && f.endsWith('.json') && !f.includes('.meta'))
    .sort()
    .reverse();

  if (files.length > keep) {
    const toRemove = files.slice(keep);
    console.log(`🗑️  Removing ${toRemove.length} old snapshots (keeping ${keep})...`);
    toRemove.forEach(f => {
      const jsonPath = path.join(HISTORY_DIR, f);
      const metaPath = jsonPath.replace('.json', '.meta.json');
      if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
      if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
    });
    console.log('✅ Cleanup complete');
  } else {
    console.log(`No cleanup needed. Current snapshots: ${files.length}, keeping: ${keep}`);
  }
}

function compareWithSnapshot(snapshotId) {
  ensureHistoryDir();
  const files = fs.readdirSync(HISTORY_DIR)
    .filter(f => f.startsWith('coverage-') && f.endsWith('.json') && !f.includes('.meta'))
    .sort()
    .reverse();

  if (snapshotId >= files.length) {
    console.error(`Snapshot [${snapshotId}] not found. Available: 0-${files.length - 1}`);
    process.exit(1);
  }

  const snapshotFile = files[snapshotId];
  const snapshotPath = path.join(HISTORY_DIR, snapshotFile);
  
  console.log(`📊 Comparing current coverage with snapshot [${snapshotId}]: ${snapshotFile}\n`);
  
  // You can extend this to generate a diff report
  // For now, just show the command to run the diff
  console.log(`Run: npm run coverage:diff:compare -- --base=${snapshotPath}`);
}

const cmd = process.argv[2] || 'help';

switch (cmd) {
  case 'save':
    saveCoverageSnapshot();
    break;
  case 'list':
    listSnapshots();
    break;
  case 'clean':
    cleanOldSnapshots(30);
    break;
  case 'compare':
    compareWithSnapshot(parseInt(process.argv[3]) || 0);
    break;
  default:
    console.log(`
coverage-history.js - Manage coverage snapshots

Usage:
  node scripts/coverage-history.js save      Save current coverage to history
  node scripts/coverage-history.js list      List all saved snapshots
  node scripts/coverage-history.js clean     Remove snapshots older than last 30
  node scripts/coverage-history.js compare <id>  Compare current vs snapshot [id]
    `);
}
