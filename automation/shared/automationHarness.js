const GROUP_META = [
  { id: 'G01', name: 'Static Assets & App Shell', start: 1, end: 25 },
  { id: 'G02', name: 'Firebase Auth Sign-Up', start: 26, end: 50 },
  { id: 'G03', name: 'Firebase Auth Sign-In', start: 51, end: 75 },
  { id: 'G04', name: 'Firestore Users Collection', start: 76, end: 100 },
  { id: 'G05', name: 'Firestore Appointments Collection', start: 101, end: 125 },
  { id: 'G06', name: 'Firestore Queue Collection', start: 126, end: 150 },
  { id: 'G07', name: 'Firestore Prescriptions Collection', start: 151, end: 175 },
  { id: 'G08', name: 'Firestore Notifications Collection', start: 176, end: 200 },
  { id: 'G09', name: 'Firestore Reviews Collection', start: 201, end: 225 },
  { id: 'G10', name: 'Firestore Coverage Requests', start: 226, end: 250 },
  { id: 'G11', name: 'Auth Invalid Credential Handling', start: 251, end: 275 },
  { id: 'G12', name: 'SPA Doctor Routes', start: 276, end: 300 },
  { id: 'G13', name: 'HTTP Header Validation', start: 301, end: 325 },
  { id: 'G14', name: 'Concurrent Burst Requests', start: 326, end: 350 },
  { id: 'G15', name: 'Firestore Write Operations', start: 351, end: 375 },
  { id: 'G16', name: 'Response Time Thresholds', start: 376, end: 400 },
  { id: 'G17', name: 'Firebase Hosting & Storage', start: 401, end: 425 },
  { id: 'G18', name: 'Firestore Doctor Queries', start: 426, end: 450 },
  { id: 'G19', name: 'Firestore Patient Queries', start: 451, end: 475 },
  { id: 'G20', name: 'End-to-End User Journey', start: 476, end: 500 },
];

export function buildCaseCatalog() {
  const cases = [];

  for (let index = 1; index <= 500; index += 1) {
    const group = GROUP_META.find((item) => index >= item.start && index <= item.end) || GROUP_META[0];
    cases.push({
      tcId: `TC${String(index).padStart(3, '0')}`,
      groupId: group.id,
      groupName: group.name,
      scenario: `Scenario ${index}`,
      status: 'NOT RUN',
      engine: 'selenium',
    });
  }

  return cases;
}

export function buildSummary(cases, engine = 'selenium') {
  const passed = cases.filter((item) => item.status === 'PASS').length;
  const failed = cases.filter((item) => item.status === 'FAIL').length;
  const total = cases.length;

  return {
    engine,
    total,
    passed,
    failed,
    passRate: `${((passed / total) * 100).toFixed(1)}%`,
  };
}
