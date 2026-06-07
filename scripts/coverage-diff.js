#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' });
}

function loadCoverage(coveragePath) {
  if (!fs.existsSync(coveragePath)) return null;
  return JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
}

function parseGitDiff(diffText) {
  const files = {};
  const lines = diffText.split('\n');
  let currentFile = null;
  for (const line of lines) {
    if (line.startsWith('+++ b/')) {
      currentFile = line.replace('+++ b/', '').trim();
      if (!files[currentFile]) files[currentFile] = new Set();
      continue;
    }
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (hunk && currentFile) {
      const start = parseInt(hunk[1], 10);
      const len = hunk[2] ? parseInt(hunk[2], 10) : 1;
      for (let i = 0; i < len; i++) files[currentFile].add(start + i);
    }
  }
  return files;
}

function fileCoveragePercent(fileCov) {
  // compute statements coverage percent
  const s = fileCov.s || {};
  const total = Object.keys(s).length;
  const covered = Object.values(s).filter(v => v > 0).length;
  return total === 0 ? 100 : Math.round((covered / total) * 10000) / 100;
}

function main() {
  const coveragePath = path.resolve(process.cwd(), 'coverage', 'coverage-final.json');
  const cov = loadCoverage(coveragePath);
  if (!cov) {
    console.error('coverage/coverage-final.json not found. Run `npm run coverage:run` first.');
    process.exit(2);
  }

  // optional base coverage JSON for comparison: --base=path
  const baseArg = process.argv.find(a => a.startsWith('--base='));
  const baseCov = baseArg ? loadCoverage(path.resolve(process.cwd(), baseArg.replace('--base=', ''))) : null;

  let diff;
  try {
    diff = run('git diff --no-color -U0 HEAD');
  } catch (e) {
    console.error('git diff failed:', e.message);
    process.exit(3);
  }

  const changed = parseGitDiff(diff);
  const report = [];

  for (const [file, linesSet] of Object.entries(changed)) {
    // normalize paths to coverage keys
    const abs = path.resolve(process.cwd(), file);
    // coverage keys may be absolute or relative; try both
    const covKey = Object.keys(cov).find(k => k === file || path.resolve(k) === abs || path.resolve(k).endsWith(file));
    if (!covKey) {
      report.push({ file, note: 'no-coverage-info' });
      continue;
    }
    const fileCov = cov[covKey];
    const stmtMap = fileCov.statementMap || fileCov.statementMap || {};
    const s = fileCov.s || {};
    const uncoveredLines = [];
    for (const [id, meta] of Object.entries(stmtMap)) {
      const startLine = meta.start && meta.start.line;
      if (!startLine) continue;
      if (linesSet.has(startLine)) {
        if ((s[id] || 0) === 0) uncoveredLines.push(startLine);
      }
    }

    report.push({
      file,
      covPercent: fileCoveragePercent(fileCov),
      uncoveredLines: Array.from(new Set(uncoveredLines)).sort((a,b)=>a-b),
      basePercent: baseCov ? (function(){
        const baseKey = Object.keys(baseCov).find(k => k === file || path.resolve(k) === abs || path.resolve(k).endsWith(file));
        if (!baseKey) return null;
        return fileCoveragePercent(baseCov[baseKey]);
      })() : null
    });
  }

  // output summary
  console.log('\nCoverage diff report:');
  for (const r of report) {
    if (r.note === 'no-coverage-info') {
      console.log(`- ${r.file}: no coverage data (not instrumented or ignored)`);
      continue;
    }
    const uncovered = r.uncoveredLines.length ? ` — uncovered changed lines: ${r.uncoveredLines.join(',')}` : '';
    const delta = (r.basePercent == null) ? '' : ` (base: ${r.basePercent}%, delta: ${Math.round((r.covPercent - r.basePercent)*100)/100}%)`;
    console.log(`- ${r.file}: ${r.covPercent}%${delta}${uncovered}`);
  }
  console.log('\nHint: run `npm run coverage:run` to (re)generate coverage and then `npm run coverage:diff`.');
}

main();
