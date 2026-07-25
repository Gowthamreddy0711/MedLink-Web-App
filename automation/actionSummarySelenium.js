#!/usr/bin/env node
'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const reportPath = path.join(rootDir, 'test-results', 'automation-reports', 'Selenium-Automation-Report.json');

if (!fs.existsSync(reportPath)) {
  console.error(`Report JSON not found: ${reportPath}`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const { summary } = report;

const lines = [];
lines.push('## 🧪 Selenium Automation Summary');
lines.push('');
lines.push('| Metric | Value |');
lines.push('| --- | --- |');
lines.push(`| Engine | ${summary.engine} |`);
lines.push(`| Total Test Cases | ${summary.total} |`);
lines.push(`| Passed | ${summary.passed} |`);
lines.push(`| Failed | ${summary.failed} |`);
lines.push(`| Pass Rate | ${summary.passRate} |`);
lines.push(`| Generated At | ${summary.generatedAt} |`);
lines.push('');
lines.push('- Excel artifact: `Selenium-Automation-Report.xlsx`');

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
} else {
  console.log(lines.join('\n'));
}
