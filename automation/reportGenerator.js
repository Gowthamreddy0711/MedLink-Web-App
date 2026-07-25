#!/usr/bin/env node
'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'test-results', 'automation-reports');

fs.mkdirSync(outDir, { recursive: true });

const seleniumPath = path.join(rootDir, 'test-results', 'selenium', 'selenium-report.json');
const appiumPath = path.join(rootDir, 'test-results', 'appium', 'appium-report.json');

const seleniumReport = JSON.parse(fs.readFileSync(seleniumPath, 'utf8'));
const appiumReport = JSON.parse(fs.readFileSync(appiumPath, 'utf8'));

const workbook = new ExcelJS.Workbook();
workbook.creator = 'MedLink QA Automation';
workbook.created = new Date();

const summarySheet = workbook.addWorksheet('Summary');
summarySheet.columns = [
  { header: 'Engine', key: 'engine', width: 18 },
  { header: 'Total', key: 'total', width: 12 },
  { header: 'Passed', key: 'passed', width: 12 },
  { header: 'Failed', key: 'failed', width: 12 },
  { header: 'Pass Rate', key: 'passRate', width: 16 },
  { header: 'Generated At', key: 'generatedAt', width: 28 },
];
summarySheet.addRow({
  engine: seleniumReport.engine,
  total: seleniumReport.total,
  passed: seleniumReport.passed,
  failed: seleniumReport.failed,
  passRate: seleniumReport.passRate,
  generatedAt: seleniumReport.generatedAt,
});
summarySheet.addRow({
  engine: appiumReport.engine,
  total: appiumReport.total,
  passed: appiumReport.passed,
  failed: appiumReport.failed,
  passRate: appiumReport.passRate,
  generatedAt: appiumReport.generatedAt,
});

const detailSheet = workbook.addWorksheet('Automation Cases');
detailSheet.columns = [
  { header: 'TC ID', key: 'tcId', width: 12 },
  { header: 'Engine', key: 'engine', width: 16 },
  { header: 'Group', key: 'groupId', width: 10 },
  { header: 'Group Name', key: 'groupName', width: 30 },
  { header: 'Scenario', key: 'scenario', width: 40 },
  { header: 'Status', key: 'status', width: 12 },
];

for (const item of seleniumReport.cases) {
  detailSheet.addRow({ ...item, engine: 'selenium' });
}
for (const item of appiumReport.cases) {
  detailSheet.addRow({ ...item, engine: 'appium' });
}

const outputPath = path.join(outDir, 'MedLink-Automation-Report.xlsx');
await workbook.xlsx.writeFile(outputPath);
fs.writeFileSync(path.join(outDir, 'MedLink-Automation-Report.json'), JSON.stringify({ seleniumReport, appiumReport }, null, 2));
console.log(`Automation Excel report written to ${outputPath}`);
