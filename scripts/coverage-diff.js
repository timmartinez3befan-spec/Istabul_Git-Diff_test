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

function isSourceFile(file) {
  return /\.(js|ts|mjs|cjs|jsx|tsx)$/.test(file);
}

function parseGitDiff(diffText) {
  const files = {};
  const lines = diffText.split('\n');
  let currentFile = null;
  for (const line of lines) {
    if (line.startsWith('+++ b/')) {
      const filePath = line.replace('+++ b/', '').trim();
      if (!isSourceFile(filePath)) {
        currentFile = null;
        continue;
      }
      currentFile = filePath;
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

function generateHtml(report, baseCov, timestamp = new Date().toISOString()) {
  const regressions = report.filter(r => r.basePercent != null && r.covPercent < r.basePercent);
  const newFiles = report.filter(r => r.basePercent == null && r.covPercent < 100);
  const improved = report.filter(r => r.basePercent != null && r.covPercent > r.basePercent);
  
  const htmlReport = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coverage Diff Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    h1 { margin-bottom: 5px; font-size: 28px; }
    .timestamp { font-size: 13px; opacity: 0.9; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; padding: 20px; border-bottom: 1px solid #eee; }
    .stat-box { background: #fafafa; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; }
    .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
    .stat-label { font-size: 12px; color: #999; margin-top: 5px; }
    .stat-box.regression { border-left-color: #f56565; }
    .stat-box.regression .stat-value { color: #f56565; }
    .stat-box.improved { border-left-color: #48bb78; }
    .stat-box.improved .stat-value { color: #48bb78; }
    .content { padding: 30px; }
    section { margin-bottom: 40px; }
    h2 { font-size: 18px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea; color: #333; }
    .file-row { display: flex; align-items: center; padding: 12px; border-radius: 4px; border: 1px solid #eee; margin-bottom: 8px; background: #fafafa; }
    .file-row:hover { background: #f0f0f0; }
    .file-name { flex: 1; font-family: 'Monaco', 'Courier New', monospace; font-size: 13px; word-break: break-all; }
    .file-stat { display: flex; gap: 20px; align-items: center; }
    .coverage-bar { width: 100px; height: 8px; background: #eee; border-radius: 4px; overflow: hidden; }
    .coverage-fill { height: 100%; background: linear-gradient(90deg, #f56565 0%, #ed8936 40%, #ecc94b 70%, #48bb78 100%); transition: width 0.3s; }
    .coverage-percent { width: 50px; text-align: right; font-weight: bold; font-size: 13px; }
    .delta { width: 80px; text-align: right; font-size: 12px; }
    .delta.positive { color: #48bb78; }
    .delta.negative { color: #f56565; }
    .uncovered-lines { font-size: 11px; color: #999; max-width: 300px; word-break: break-word; }
    .empty { padding: 20px; text-align: center; color: #999; font-size: 14px; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 3px; font-size: 11px; font-weight: bold; margin-right: 5px; }
    .badge.regression { background: #fed7d7; color: #c53030; }
    .badge.improved { background: #c6f6d5; color: #22543d; }
    .badge.new { background: #bee3f8; color: #2c5282; }
    footer { padding: 15px 30px; background: #fafafa; border-top: 1px solid #eee; border-radius: 0 0 8px 8px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📊 Coverage Diff Report</h1>
      <div class="timestamp">Generated: ${timestamp}</div>
    </header>
    
    <div class="summary">
      <div class="stat-box">
        <div class="stat-value">${report.length}</div>
        <div class="stat-label">Changed Files</div>
      </div>
      <div class="stat-box regression">
        <div class="stat-value">${regressions.length}</div>
        <div class="stat-label">Coverage Regressions</div>
      </div>
      <div class="stat-box improved">
        <div class="stat-value">${improved.length}</div>
        <div class="stat-label">Coverage Improved</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${newFiles.length}</div>
        <div class="stat-label">New/Untested Files</div>
      </div>
    </div>
    
    <div class="content">
      ${regressions.length > 0 ? `
        <section>
          <h2>⚠️ Coverage Regressions</h2>
          ${regressions.map(r => `
            <div class="file-row">
              <div class="file-name">
                <span class="badge regression">REGRESSION</span>
                ${r.file}
              </div>
              <div class="file-stat">
                <div class="coverage-bar">
                  <div class="coverage-fill" style="width: ${r.covPercent}%"></div>
                </div>
                <div class="coverage-percent">${r.covPercent}%</div>
                <div class="delta negative">from ${r.basePercent}% (${Math.round((r.covPercent - r.basePercent)*100)/100}%)</div>
              </div>
            </div>
            ${r.uncoveredLines.length ? `<div class="file-row" style="border: none; background: #fff; padding: 0 12px 12px; margin-bottom: 8px;"><div class="uncovered-lines"><strong>Uncovered lines:</strong> ${r.uncoveredLines.join(', ')}</div></div>` : ''}
          `).join('')}
        </section>
      ` : '<section><h2>✅ No Regressions</h2></section>'}
      
      ${newFiles.length > 0 ? `
        <section>
          <h2>🆕 New/Untested Files</h2>
          ${newFiles.map(r => `
            <div class="file-row">
              <div class="file-name">
                <span class="badge new">NEW</span>
                ${r.file}
              </div>
              <div class="file-stat">
                <div class="coverage-bar">
                  <div class="coverage-fill" style="width: ${r.covPercent}%"></div>
                </div>
                <div class="coverage-percent">${r.covPercent}%</div>
              </div>
            </div>
          `).join('')}
        </section>
      ` : ''}
      
      ${improved.length > 0 ? `
        <section>
          <h2>🎉 Coverage Improved</h2>
          ${improved.map(r => `
            <div class="file-row">
              <div class="file-name">
                <span class="badge improved">IMPROVED</span>
                ${r.file}
              </div>
              <div class="file-stat">
                <div class="coverage-bar">
                  <div class="coverage-fill" style="width: ${r.covPercent}%"></div>
                </div>
                <div class="coverage-percent">${r.covPercent}%</div>
                <div class="delta positive">from ${r.basePercent}% (+${Math.round((r.covPercent - r.basePercent)*100)/100}%)</div>
              </div>
            </div>
          `).join('')}
        </section>
      ` : ''}
    </div>
    
    <footer>
      💡 Tip: Run \`npm run coverage:run\` to generate coverage, then \`npm run coverage:diff\` to create this report.
    </footer>
  </div>
</body>
</html>`;

  return htmlReport;
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

  // optional HTML output: --html=path
  const htmlArg = process.argv.find(a => a.startsWith('--html='));
  const htmlOutputPath = htmlArg ? path.resolve(process.cwd(), htmlArg.replace('--html=', '')) : null;

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

  // generate HTML if requested
  if (htmlOutputPath) {
    const html = generateHtml(report, baseCov);
    const dir = path.dirname(htmlOutputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(htmlOutputPath, html, 'utf8');
    console.log(`\nHTML report written to: ${htmlOutputPath}`);
  }
}

main();
