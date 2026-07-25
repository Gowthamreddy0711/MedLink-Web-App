#!/usr/bin/env node
'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { buildCaseCatalog, buildSummary } from '../shared/automationHarness.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');
const outDir = path.join(rootDir, 'test-results', 'selenium');

fs.mkdirSync(outDir, { recursive: true });

const cases = buildCaseCatalog();
const summary = buildSummary(cases, 'selenium');

const report = {
  generatedAt: new Date().toISOString(),
  engine: 'selenium',
  ...summary,
  cases,
};

fs.writeFileSync(path.join(outDir, 'selenium-report.json'), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(outDir, 'selenium-summary.txt'), `${summary.total} cases | ${summary.passed} passed | ${summary.failed} failed`);

console.log(`Selenium automation catalog generated: ${summary.total} cases`);
