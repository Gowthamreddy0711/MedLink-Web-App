import { describe, expect, it } from 'vitest';

import { buildCaseCatalog, buildSummary } from '../../automation/shared/automationHarness.js';

describe('automation case catalog', () => {
  it('builds a 500-case catalog with 20 grouped suites', () => {
    const cases = buildCaseCatalog();

    expect(cases).toHaveLength(500);
    expect(cases[0]).toMatchObject({ tcId: 'TC001', groupId: 'G01' });
    expect(cases[499]).toMatchObject({ tcId: 'TC500', groupId: 'G20' });

    const uniqueGroups = [...new Set(cases.map((item) => item.groupId))];
    expect(uniqueGroups).toHaveLength(20);
  });

  it('summarizes pass and fail counts accurately', () => {
    const cases = buildCaseCatalog().map((item, index) => ({
      ...item,
      status: index % 2 === 0 ? 'PASS' : 'FAIL',
    }));

    const summary = buildSummary(cases, 'selenium');

    expect(summary.total).toBe(500);
    expect(summary.passed).toBe(250);
    expect(summary.failed).toBe(250);
    expect(summary.passRate).toBe('50.0%');
  });
});
