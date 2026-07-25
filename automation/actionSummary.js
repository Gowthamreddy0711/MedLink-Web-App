#!/usr/bin/env node
'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const reportPath = path.join(rootDir, 'test-results', 'automation-reports', 'MedLink-Automation-Report.json');

if (!fs.existsSync(reportPath)) {
  console.error(`Report JSON not found at ${reportPath}`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const { seleniumReport, appiumReport } = report;

const lines = [];
lines.push('## 🧪 MedLink Automation Summary');
lines.push('');
lines.push('| Engine | Total | Passed | Failed | Pass Rate |');
lines.push('| --- | --- | --- | --- | --- |');
lines.push(`| Selenium | ${seleniumReport.total} | ${seleniumReport.passed} | ${seleniumReport.failed} | ${seleniumReport.passRate} |`);
lines.push(`| Appium | ${appiumReport.total} | ${appiumReport.passed} | ${appiumReport.failed} | ${appiumReport.passRate} |`);
lines.push('');
lines.push(`- Excel report: \\`MedLink-Automation-Report.xlsx\\``);
lines.push('');
lines.push('> Download the automation report artifact from the Actions run artifacts section.');

const summaryContent = lines.join('\n');
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryContent + '\n');
} else {
  console.log(summaryContent);
}
