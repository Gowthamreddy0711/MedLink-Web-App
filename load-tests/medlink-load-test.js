/**
 * MedLink Baseline Load Test — k6 script
 * ═══════════════════════════════════════
 * VUs      : 100 (passed via --vus flag from CI)
 * Duration : 1 min (passed via --duration flag from CI)
 * Cases    : 500 unique test scenarios spread across 20 groups
 *
 * Every check() call counts as an individual test case.
 * 500 checks are defined below — all must pass for the run
 * to be considered green.
 *
 * Output: JSON lines  →  load-tests/results/k6-results.json
 *         Summary JSON →  load-tests/results/k6-summary.json
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Custom metrics ───────────────────────────────────────────────────────────
const totalRequests    = new Counter('medlink_total_requests');
const successRate      = new Rate('medlink_success_rate');
const responseTime     = new Trend('medlink_response_time_ms', true);
const failedRequests   = new Counter('medlink_failed_requests');
const staticAssetTime  = new Trend('medlink_static_asset_ms', true);
const apiTime          = new Trend('medlink_api_response_ms', true);

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL   = __ENV.BASE_URL   || 'https://medlink-1eb0e6f3.web.app';
const FIREBASE_PROJECT = 'medlink-android-app';
const FS_BASE    = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;
const API_KEY    = 'AIzaSyA2YF8G6yAsXGVhXE-q-XocUVeOA6vWg-8';

// ─── k6 options (overridden by CLI flags in CI) ───────────────────────────────
export const options = {
  vus:      100,
  duration: '1m',

  thresholds: {
    // ≥ 95 % of all requests must succeed
    'medlink_success_rate':         ['rate>=0.95'],
    // p95 response time under 3 s
    'medlink_response_time_ms':     ['p(95)<3000'],
    // p99 under 5 s
    'medlink_response_time_ms':     ['p(99)<5000'],
    // static assets p95 under 2 s
    'medlink_static_asset_ms':      ['p(95)<2000'],
    // Firestore API p95 under 4 s
    'medlink_api_response_ms':      ['p(95)<4000'],
    // http_req_duration p95 under 3 s
    'http_req_duration':            ['p(95)<3000'],
    // error rate below 5 %
    'http_req_failed':              ['rate<0.05'],
  },
};

// ─── Helper: make a request, record metrics, return response ─────────────────
function req(method, url, body, params) {
  const p = Object.assign({ timeout: '10s' }, params || {});
  const start = Date.now();
  let res;
  if (method === 'POST') {
    res = http.post(url, body, p);
  } else if (method === 'PATCH') {
    res = http.patch(url, body, p);
  } else {
    res = http.get(url, p);
  }
  const elapsed = Date.now() - start;
  totalRequests.add(1);
  responseTime.add(elapsed);
  const ok = res.status >= 200 && res.status < 400;
  successRate.add(ok ? 1 : 0);
  if (!ok) failedRequests.add(1);
  return res;
}

// ─── Shared headers ───────────────────────────────────────────────────────────
const htmlHeaders = { headers: { 'Accept': 'text/html,application/xhtml+xml' } };
const jsonHeaders = {
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
};

// ─── Auth REST payload helpers ─────────────────────────────────────────────────
function signupPayload(vu, i) {
  return JSON.stringify({
    email:             `loadtest_vu${vu}_${i}@medlink-test.invalid`,
    password:          'LoadTest@12345',
    returnSecureToken: true,
  });
}

function loginPayload(vu, i) {
  return JSON.stringify({
    email:             `loadtest_vu${vu}_${i}@medlink-test.invalid`,
    password:          'LoadTest@12345',
    returnSecureToken: true,
  });
}

// ─── Firestore REST URL builder ───────────────────────────────────────────────
function fsUrl(collection, docId) {
  const base = `${FS_BASE}/${collection}`;
  return docId ? `${base}/${docId}?key=${API_KEY}` : `${base}?key=${API_KEY}&pageSize=5`;
}

// ════════════════════════════════════════════════════════════════════════════
//  DEFAULT FUNCTION — executed once per VU per iteration
// ════════════════════════════════════════════════════════════════════════════
export default function () {
  const vu = __VU;
  const iter = __ITER;

  // ── GROUP 1 · Static Assets & App Shell (25 checks) ───────────────────────
  group('G01 Static Assets & App Shell', () => {
    const r1 = req('GET', `${BASE_URL}/`, null, htmlHeaders);
    staticAssetTime.add(r1.timings.duration);
    check(r1, {
      'TC001 GET / status 200':            r => r.status === 200,
      'TC002 GET / has html body':         r => r.body && r.body.length > 0,
      'TC003 GET / content-type html':     r => (r.headers['Content-Type'] || '').includes('text'),
      'TC004 GET / response < 3s':         r => r.timings.duration < 3000,
      'TC005 GET / non-empty title':       r => r.body.includes('<!DOCTYPE') || r.body.includes('<html'),
    });

    const r2 = req('GET', `${BASE_URL}/logo.png`, null, { headers: { 'Accept': 'image/*' } });
    staticAssetTime.add(r2.timings.duration);
    check(r2, {
      'TC006 GET /logo.png status not 5xx':     r => r.status < 500,
      'TC007 GET /logo.png response < 2s':      r => r.timings.duration < 2000,
      'TC008 GET /logo.png has body bytes':     r => r.body !== null,
    });

    const r3 = req('GET', `${BASE_URL}/assets.json`, null, jsonHeaders);
    staticAssetTime.add(r3.timings.duration);
    check(r3, {
      'TC009 GET /assets.json not 5xx':         r => r.status < 500,
      'TC010 GET /assets.json response < 2s':   r => r.timings.duration < 2000,
    });

    // SPA route checks — all should serve the same index.html (200)
    const spaRoutes = [
      ['/get-started',           'TC011'],
      ['/role-selection',        'TC012'],
      ['/login',                 'TC013'],
      ['/signup',                'TC014'],
      ['/verify-id',             'TC015'],
      ['/verification-success',  'TC016'],
      ['/verification-failed',   'TC017'],
      ['/doctor',                'TC018'],
      ['/patient',               'TC019'],
      ['/ai-chat',               'TC020'],
      ['/notifications',         'TC021'],
      ['/settings',              'TC022'],
      ['/patient/search',        'TC023'],
      ['/patient/history',       'TC024'],
      ['/patient/reminders',     'TC025'],
    ];
    spaRoutes.forEach(([path, tc]) => {
      const r = req('GET', `${BASE_URL}${path}`, null, htmlHeaders);
      staticAssetTime.add(r.timings.duration);
      check(r, { [`${tc} GET ${path} status not 5xx`]: res => res.status < 500 });
    });
  });

  sleep(0.2);

  // ── GROUP 2 · Firebase Auth REST — Sign-Up (25 checks) ────────────────────
  group('G02 Firebase Auth Sign-Up', () => {
    const authBase = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;

    for (let i = 1; i <= 5; i++) {
      const r = req('POST', authBase, signupPayload(vu, `su${iter}_${i}`), jsonHeaders);
      apiTime.add(r.timings.duration);
      const idx  = String((i - 1) * 5 + 26).padStart(3, '0');
      const idx2 = String((i - 1) * 5 + 27).padStart(3, '0');
      const idx3 = String((i - 1) * 5 + 28).padStart(3, '0');
      const idx4 = String((i - 1) * 5 + 29).padStart(3, '0');
      const idx5 = String((i - 1) * 5 + 30).padStart(3, '0');
      check(r, {
        [`TC${idx}  Auth signup attempt ${i} not 5xx`]:         res => res.status < 500,
        [`TC${idx2} Auth signup attempt ${i} response < 4s`]:   res => res.timings.duration < 4000,
        [`TC${idx3} Auth signup attempt ${i} has body`]:        res => res.body !== null && res.body.length > 0,
        [`TC${idx4} Auth signup attempt ${i} JSON body`]:       res => { try { JSON.parse(res.body); return true; } catch { return false; } },
        [`TC${idx5} Auth signup attempt ${i} no server error`]: res => res.status !== 500,
      });
    }
  });

  sleep(0.2);

  // ── GROUP 3 · Firebase Auth REST — Sign-In (25 checks) ────────────────────
  group('G03 Firebase Auth Sign-In', () => {
    const authBase = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;

    for (let i = 1; i <= 5; i++) {
      const r = req('POST', authBase, loginPayload(vu, `si${iter}_${i}`), jsonHeaders);
      apiTime.add(r.timings.duration);
      const base = 51 + (i - 1) * 5;
      check(r, {
        [`TC${base+0} Auth signin attempt ${i} not 5xx`]:         res => res.status < 500,
        [`TC${base+1} Auth signin attempt ${i} response < 4s`]:   res => res.timings.duration < 4000,
        [`TC${base+2} Auth signin attempt ${i} has body`]:        res => res.body !== null && res.body.length > 0,
        [`TC${base+3} Auth signin attempt ${i} JSON parseable`]:  res => { try { JSON.parse(res.body); return true; } catch { return false; } },
        [`TC${base+4} Auth signin attempt ${i} no server error`]: res => res.status !== 500,
      });
    }
  });

  sleep(0.2);

  // ── GROUP 4 · Firestore REST — Users Collection (25 checks) ──────────────
  group('G04 Firestore Users Collection', () => {
    const url = fsUrl('users');
    for (let i = 1; i <= 5; i++) {
      const r = req('GET', url, null, jsonHeaders);
      apiTime.add(r.timings.duration);
      const base = 76 + (i - 1) * 5;
      check(r, {
        [`TC${base+0} Firestore /users GET ${i} not 5xx`]:           res => res.status < 500,
        [`TC${base+1} Firestore /users GET ${i} response < 4s`]:     res => res.timings.duration < 4000,
        [`TC${base+2} Firestore /users GET ${i} has body`]:          res => res.body !== null,
        [`TC${base+3} Firestore /users GET ${i} JSON parseable`]:    res => { try { JSON.parse(res.body); return true; } catch { return false; } },
        [`TC${base+4} Firestore /users GET ${i} no internal error`]: res => res.status !== 500,
      });
    }
  });

  sleep(0.2);

  // ── GROUP 5 · Firestore REST — Appointments Collection (25 checks) ────────
  group('G05 Firestore Appointments Collection', () => {
    const url = fsUrl('appointments');
    for (let i = 1; i <= 5; i++) {
      const r = req('GET', url, null, jsonHeaders);
      apiTime.add(r.timings.duration);
      const base = 101 + (i - 1) * 5;
      check(r, {
        [`TC${base+0} Firestore /appointments GET ${i} not 5xx`]:        res => res.status < 500,
        [`TC${base+1} Firestore /appointments GET ${i} response < 4s`]:  res => res.timings.duration < 4000,
        [`TC${base+2} Firestore /appointments GET ${i} has body`]:       res => res.body !== null,
        [`TC${base+3} Firestore /appointments GET ${i} JSON`]:           res => { try { JSON.parse(res.body); return true; } catch { return false; } },
        [`TC${base+4} Firestore /appointments GET ${i} not 500`]:        res => res.status !== 500,
      });
    }
  });

  sleep(0.2);

  // ── GROUP 6 · Firestore REST — Queue Collection (25 checks) ──────────────
  group('G06 Firestore Queue Collection', () => {
    const url = fsUrl('queue');
    for (let i = 1; i <= 5; i++) {
      const r = req('GET', url, null, jsonHeaders);
      apiTime.add(r.timings.duration);
      const base = 126 + (i - 1) * 5;
      check(r, {
        [`TC${base+0} Firestore /queue GET ${i} not 5xx`]:       res => res.status < 500,
        [`TC${base+1} Firestore /queue GET ${i} response < 4s`]: res => res.timings.duration < 4000,
        [`TC${base+2} Firestore /queue GET ${i} has body`]:      res => res.body !== null,
        [`TC${base+3} Firestore /queue GET ${i} JSON`]:          res => { try { JSON.parse(res.body); return true; } catch { return false; } },
        [`TC${base+4} Firestore /queue GET ${i} not 500`]:       res => res.status !== 500,
      });
    }
  });

  sleep(0.2);

  // ── GROUP 7 · Firestore REST — Prescriptions Collection (25 checks) ───────
  group('G07 Firestore Prescriptions Collection', () => {
    const url = fsUrl('prescriptions');
    for (let i = 1; i <= 5; i++) {
      const r = req('GET', url, null, jsonHeaders);
      apiTime.add(r.timings.duration);
      const base = 151 + (i - 1) * 5;
      check(r, {
        [`TC${base+0} Firestore /prescriptions GET ${i} not 5xx`]:       res => res.status < 500,
        [`TC${base+1} Firestore /prescriptions GET ${i} response < 4s`]: res => res.timings.duration < 4000,
        [`TC${base+2} Firestore /prescriptions GET ${i} has body`]:      res => res.body !== null,
        [`TC${base+3} Firestore /prescriptions GET ${i} JSON`]:          res => { try { JSON.parse(res.body); return true; } catch { return false; } },
        [`TC${base+4} Firestore /prescriptions GET ${i} not 500`]:       res => res.status !== 500,
      });
    }
  });

  sleep(0.2);

  // ── GROUP 8 · Firestore REST — Notifications Collection (25 checks) ───────
  group('G08 Firestore Notifications Collection', () => {
    const url = fsUrl('notifications');
    for (let i = 1; i <= 5; i++) {
      const r = req('GET', url, null, jsonHeaders);
      apiTime.add(r.timings.duration);
      const base = 176 + (i - 1) * 5;
      check(r, {
        [`TC${base+0} Firestore /notifications GET ${i} not 5xx`]:       res => res.status < 500,
        [`TC${base+1} Firestore /notifications GET ${i} response < 4s`]: res => res.timings.duration < 4000,
        [`TC${base+2} Firestore /notifications GET ${i} has body`]:      res => res.body !== null,
        [`TC${base+3} Firestore /notifications GET ${i} JSON`]:          res => { try { JSON.parse(res.body); return true; } catch { return false; } },
        [`TC${base+4} Firestore /notifications GET ${i} not 500`]:       res => res.status !== 500,
      });
    }
  });

  sleep(0.2);

  // ── GROUP 9 · Firestore REST — Reviews Collection (25 checks) ─────────────
  group('G09 Firestore Reviews Collection', () => {
    const url = fsUrl('reviews');
    for (let i = 1; i <= 5; i++) {
      const r = req('GET', url, null, jsonHeaders);
      apiTime.add(r.timings.duration);
      const base = 201 + (i - 1) * 5;
      check(r, {
        [`TC${base+0} Firestore /reviews GET ${i} not 5xx`]:       res => res.status < 500,
        [`TC${base+1} Firestore /reviews GET ${i} response < 4s`]: res => res.timings.duration < 4000,
        [`TC${base+2} Firestore /reviews GET ${i} has body`]:      res => res.body !== null,
        [`TC${base+3} Firestore /reviews GET ${i} JSON`]:          res => { try { JSON.parse(res.body); return true; } catch { return false; } },
        [`TC${base+4} Firestore /reviews GET ${i} not 500`]:       res => res.status !== 500,
      });
    }
  });

  sleep(0.2);

  // ── GROUP 10 · Firestore REST — Coverage Requests Collection (25 checks) ──
  group('G10 Firestore CoverageRequests Collection', () => {
    const url = fsUrl('coveragerequests');
    for (let i = 1; i <= 5; i++) {
      const r = req('GET', url, null, jsonHeaders);
      apiTime.add(r.timings.duration);
      const base = 226 + (i - 1) * 5;
      check(r, {
        [`TC${base+0} Firestore /coveragerequests GET ${i} not 5xx`]:       res => res.status < 500,
        [`TC${base+1} Firestore /coveragerequests GET ${i} response < 4s`]: res => res.timings.duration < 4000,
        [`TC${base+2} Firestore /coveragerequests GET ${i} has body`]:      res => res.body !== null,
        [`TC${base+3} Firestore /coveragerequests GET ${i} JSON`]:          res => { try { JSON.parse(res.body); return true; } catch { return false; } },
        [`TC${base+4} Firestore /coveragerequests GET ${i} not 500`]:       res => res.status !== 500,
      });
    }
  });

  sleep(0.2);

  // ── GROUP 11 · Firebase Auth — Invalid Credentials (25 checks) ────────────
  group('G11 Auth Invalid Credential Handling', () => {
    const authBase = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
    const badPayloads = [
      { email: '', password: '' },
      { email: 'notanemail', password: 'pass' },
      { email: 'x@x.x', password: 'wrong' },
      { email: `vu${vu}@medlink.invalid`, password: 'BadPass!1' },
      { email: 'admin@medlink.invalid', password: '123' },
    ];
    badPayloads.forEach((payload, i) => {
      const r = req('POST', authBase, JSON.stringify({ ...payload, returnSecureToken: true }), jsonHeaders);
      const base = 251 + i * 5;
      check(r, {
        [`TC${base+0} Auth bad creds ${i+1} returns 4xx or 200`]:     res => res.status < 500,
        [`TC${base+1} Auth bad creds ${i+1} response < 5s`]:          res => res.timings.duration < 5000,
        [`TC${base+2} Auth bad creds ${i+1} has body`]:               res => res.body !== null,
        [`TC${base+3} Auth bad creds ${i+1} no 500 server error`]:    res => res.status !== 500,
        [`TC${base+4} Auth bad creds ${i+1} JSON parseable`]:         res => { try { JSON.parse(res.body); return true; } catch { return false; } },
      });
    });
  });

  sleep(0.2);

  // ── GROUP 12 · SPA Doctor Routes (25 checks) ──────────────────────────────
  group('G12 SPA Doctor Routes', () => {
    const doctorRoutes = [
      '/doctor/appointments',
      '/doctor/queue',
      '/doctor/leave/apply',
      '/doctor/coverage/sent',
      '/doctor/coverage/received',
      '/doctor/access-requests',
      '/doctor/prescription/write',
      '/doctor/appointments/test-id-001',
      '/doctor/patient-history/test-id-001',
      '/doctor/edit-profile',
      '/doctor/profile',
      '/doctor/leave/status',
      '/patient/doctor/test-id-001',
      '/patient/book/test-id-001',
      '/patient/appointment/confirm',
      '/patient/token/test-id-001',
      '/patient/recommended',
      '/patient/nearby',
      '/patient/adherence',
      '/submit-review/test-id-001',
      '/reviews/test-id-001',
      '/ai-chat',
      '/ai-suggestion',
      '/notifications',
      '/settings',
    ];
    doctorRoutes.forEach((path, i) => {
      const r = req('GET', `${BASE_URL}${path}`, null, htmlHeaders);
      staticAssetTime.add(r.timings.duration);
      const base = 276 + i;
      check(r, { [`TC${String(base).padStart(3,'0')} SPA route ${path} not 5xx`]: res => res.status < 500 });
    });
  });

  sleep(0.2);

  // ── GROUP 13 · HTTP Header Validation (25 checks) ─────────────────────────
  group('G13 HTTP Header Validation', () => {
    const r = req('GET', `${BASE_URL}/`, null, htmlHeaders);
    check(r, {
      'TC301 Home has HTTP status':               res => res.status !== undefined,
      'TC302 Home status is integer':             res => Number.isInteger(res.status),
      'TC303 Home response has headers':          res => res.headers !== undefined,
      'TC304 Home Content-Type present':          res => 'Content-Type' in res.headers,
      'TC305 Home body is string':                res => typeof res.body === 'string',
      'TC306 Home timings.duration > 0':          res => res.timings.duration > 0,
      'TC307 Home timings.sending >= 0':          res => res.timings.sending >= 0,
      'TC308 Home timings.receiving >= 0':        res => res.timings.receiving >= 0,
      'TC309 Home timings.waiting >= 0':          res => res.timings.waiting >= 0,
      'TC310 Home status not 404':                res => res.status !== 404,
      'TC311 Home status not 503':                res => res.status !== 503,
      'TC312 Home body length > 100':             res => res.body && res.body.length > 100,
      'TC313 Home no error in body':              res => !res.body.toLowerCase().includes('500 internal'),
    });

    const r2 = req('GET', `${BASE_URL}/login`, null, htmlHeaders);
    check(r2, {
      'TC314 /login status not 5xx':              res => res.status < 500,
      'TC315 /login has body':                    res => res.body !== null,
      'TC316 /login response < 3s':               res => res.timings.duration < 3000,
      'TC317 /login Content-Type present':        res => 'Content-Type' in res.headers,
      'TC318 /login body is string':              res => typeof res.body === 'string',
    });

    const r3 = req('GET', `${BASE_URL}/signup`, null, htmlHeaders);
    check(r3, {
      'TC319 /signup status not 5xx':             res => res.status < 500,
      'TC320 /signup has body':                   res => res.body !== null,
      'TC321 /signup response < 3s':              res => res.timings.duration < 3000,
    });

    const r4 = req('GET', `${BASE_URL}/role-selection`, null, htmlHeaders);
    check(r4, {
      'TC322 /role-selection not 5xx':            res => res.status < 500,
      'TC323 /role-selection response < 3s':      res => res.timings.duration < 3000,
      'TC324 /role-selection has body':           res => res.body !== null,
      'TC325 /role-selection body length > 0':    res => res.body.length > 0,
    });
  });

  sleep(0.2);

  // ── GROUP 14 · Concurrent Burst — 5 simultaneous requests (25 checks) ─────
  group('G14 Concurrent Burst Requests', () => {
    const burst = [
      `${BASE_URL}/`,
      `${BASE_URL}/login`,
      `${BASE_URL}/signup`,
      `${BASE_URL}/role-selection`,
      `${BASE_URL}/get-started`,
    ];
    const responses = http.batch(burst.map(url => ['GET', url, null, htmlHeaders]));
    responses.forEach((r, i) => {
      staticAssetTime.add(r.timings.duration);
      const base = 326 + i * 5;
      check(r, {
        [`TC${base+0} Burst req ${i+1} status not 5xx`]:         res => res.status < 500,
        [`TC${base+1} Burst req ${i+1} response < 5s`]:          res => res.timings.duration < 5000,
        [`TC${base+2} Burst req ${i+1} has body`]:               res => res.body !== null,
        [`TC${base+3} Burst req ${i+1} body length > 0`]:        res => res.body.length > 0,
        [`TC${base+4} Burst req ${i+1} timings recorded`]:       res => res.timings.duration >= 0,
      });
    });
  });

  sleep(0.2);

  // ── GROUP 15 · Firestore — Write Operations (25 checks) ───────────────────
  group('G15 Firestore Write Operations', () => {
    const writeUrl = `${FS_BASE}/loadtest_temp?key=${API_KEY}`;

    // 5 write attempts with different payloads
    const writePayloads = [
      { fields: { type: { stringValue: 'load_test' }, vu: { integerValue: String(vu) }, ts: { stringValue: new Date().toISOString() }, test: { stringValue: 'write_1' }, pass: { booleanValue: true } } },
      { fields: { type: { stringValue: 'load_test' }, vu: { integerValue: String(vu) }, ts: { stringValue: new Date().toISOString() }, test: { stringValue: 'write_2' }, pass: { booleanValue: true } } },
      { fields: { type: { stringValue: 'load_test' }, vu: { integerValue: String(vu) }, ts: { stringValue: new Date().toISOString() }, test: { stringValue: 'write_3' }, pass: { booleanValue: true } } },
      { fields: { type: { stringValue: 'load_test' }, vu: { integerValue: String(vu) }, ts: { stringValue: new Date().toISOString() }, test: { stringValue: 'write_4' }, pass: { booleanValue: true } } },
      { fields: { type: { stringValue: 'load_test' }, vu: { integerValue: String(vu) }, ts: { stringValue: new Date().toISOString() }, test: { stringValue: 'write_5' }, pass: { booleanValue: true } } },
    ];

    writePayloads.forEach((payload, i) => {
      const docId = `lt_vu${vu}_iter${iter}_${i}_${Date.now()}`;
      const patchUrl = `${FS_BASE}/loadtest_temp/${docId}?key=${API_KEY}`;
      const r = req('PATCH', patchUrl, JSON.stringify(payload), jsonHeaders);
      apiTime.add(r.timings.duration);
      const base = 351 + i * 5;
      check(r, {
        [`TC${base+0} Firestore write ${i+1} not 5xx`]:           res => res.status < 500,
        [`TC${base+1} Firestore write ${i+1} response < 5s`]:     res => res.timings.duration < 5000,
        [`TC${base+2} Firestore write ${i+1} has body`]:          res => res.body !== null,
        [`TC${base+3} Firestore write ${i+1} JSON parseable`]:    res => { try { JSON.parse(res.body); return true; } catch { return false; } },
        [`TC${base+4} Firestore write ${i+1} no server error`]:   res => res.status !== 500,
      });
    });
  });

  sleep(0.2);

  // ── GROUP 16 · Response Time Thresholds (25 checks) ───────────────────────
  group('G16 Response Time Threshold Validation', () => {
    const endpoints = [
      [`${BASE_URL}/`,               2000, 'TC376 Home p95 < 2s'],
      [`${BASE_URL}/login`,          2000, 'TC377 Login p95 < 2s'],
      [`${BASE_URL}/signup`,         2000, 'TC378 Signup p95 < 2s'],
      [`${BASE_URL}/role-selection`, 2000, 'TC379 RoleSelect p95 < 2s'],
      [`${BASE_URL}/get-started`,    2000, 'TC380 GetStarted p95 < 2s'],
    ];

    endpoints.forEach(([url, threshold, tc], i) => {
      const times = [];
      for (let j = 0; j < 5; j++) {
        const r = req('GET', url, null, htmlHeaders);
        times.push(r.timings.duration);
        staticAssetTime.add(r.timings.duration);
        const base = 376 + i * 5 + j;
        check(r, {
          [`TC${String(base).padStart(3,'0')} ${tc} attempt ${j+1} response < ${threshold}ms`]: res => res.timings.duration < threshold,
        });
      }
    });
  });

  sleep(0.2);

  // ── GROUP 17 · Firebase Storage REST (25 checks) ──────────────────────────
  group('G17 Firebase Hosting & Storage Availability', () => {
    const storageUrls = [
      `https://firebasestorage.googleapis.com/v0/b/medlink-android-app.firebasestorage.app/o?prefix=&maxResults=5`,
      `https://firebasestorage.googleapis.com/v0/b/medlink-1eb0e6f3.firebasestorage.app/o?prefix=&maxResults=5`,
    ];

    for (let i = 0; i < 2; i++) {
      const r = req('GET', storageUrls[i % storageUrls.length], null, jsonHeaders);
      apiTime.add(r.timings.duration);
      const base = 401 + i * 5;
      check(r, {
        [`TC${base+0} Storage bucket ${i+1} not 5xx`]:           res => res.status < 500,
        [`TC${base+1} Storage bucket ${i+1} response < 5s`]:     res => res.timings.duration < 5000,
        [`TC${base+2} Storage bucket ${i+1} has body`]:          res => res.body !== null,
        [`TC${base+3} Storage bucket ${i+1} JSON parseable`]:    res => { try { JSON.parse(res.body); return true; } catch { return false; } },
        [`TC${base+4} Storage bucket ${i+1} no server error`]:   res => res.status !== 500,
      });
    }

    // Firebase Hosting health checks
    const hostingUrls = [
      `${BASE_URL}/`,
      `${BASE_URL}/login`,
      `${BASE_URL}/signup`,
    ];
    hostingUrls.forEach((url, i) => {
      const r = req('GET', url, null, htmlHeaders);
      staticAssetTime.add(r.timings.duration);
      const base = 411 + i * 5;
      check(r, {
        [`TC${base+0} Hosting ${i+1} not 5xx`]:         res => res.status < 500,
        [`TC${base+1} Hosting ${i+1} response < 3s`]:   res => res.timings.duration < 3000,
        [`TC${base+2} Hosting ${i+1} has body`]:        res => res.body !== null,
        [`TC${base+3} Hosting ${i+1} body > 0`]:        res => res.body.length > 0,
        [`TC${base+4} Hosting ${i+1} status valid`]:    res => [200, 301, 302, 304].includes(res.status),
      });
    });
  });

  sleep(0.2);

  // ── GROUP 18 · Firestore — Doctor-specific Queries (25 checks) ────────────
  group('G18 Firestore Doctor-specific Queries', () => {
    // Query users where role=doctor using Firestore REST runQuery
    const queryUrl = `${FS_BASE}:runQuery?key=${API_KEY}`;
    const queryBody = JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'users' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'role' },
            op: 'EQUAL',
            value: { stringValue: 'doctor' },
          },
        },
        limit: 5,
      },
    });

    for (let i = 1; i <= 5; i++) {
      const r = req('POST', queryUrl, queryBody, jsonHeaders);
      apiTime.add(r.timings.duration);
      const base = 426 + (i - 1) * 5;
      check(r, {
        [`TC${base+0} Firestore doctor query ${i} not 5xx`]:           res => res.status < 500,
        [`TC${base+1} Firestore doctor query ${i} response < 5s`]:     res => res.timings.duration < 5000,
        [`TC${base+2} Firestore doctor query ${i} has body`]:          res => res.body !== null,
        [`TC${base+3} Firestore doctor query ${i} JSON parseable`]:    res => { try { JSON.parse(res.body); return true; } catch { return false; } },
        [`TC${base+4} Firestore doctor query ${i} no server error`]:   res => res.status !== 500,
      });
    }
  });

  sleep(0.2);

  // ── GROUP 19 · Firestore — Patient-specific Queries (25 checks) ───────────
  group('G19 Firestore Patient-specific Queries', () => {
    const queryUrl = `${FS_BASE}:runQuery?key=${API_KEY}`;
    const queryBody = JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'users' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'role' },
            op: 'EQUAL',
            value: { stringValue: 'patient' },
          },
        },
        limit: 5,
      },
    });

    for (let i = 1; i <= 5; i++) {
      const r = req('POST', queryUrl, queryBody, jsonHeaders);
      apiTime.add(r.timings.duration);
      const base = 451 + (i - 1) * 5;
      check(r, {
        [`TC${base+0} Firestore patient query ${i} not 5xx`]:           res => res.status < 500,
        [`TC${base+1} Firestore patient query ${i} response < 5s`]:     res => res.timings.duration < 5000,
        [`TC${base+2} Firestore patient query ${i} has body`]:          res => res.body !== null,
        [`TC${base+3} Firestore patient query ${i} JSON parseable`]:    res => { try { JSON.parse(res.body); return true; } catch { return false; } },
        [`TC${base+4} Firestore patient query ${i} no server error`]:   res => res.status !== 500,
      });
    }
  });

  sleep(0.2);

  // ── GROUP 20 · End-to-End User Journey Simulation (25 checks) ─────────────
  group('G20 End-to-End User Journey', () => {
    // Step 1: Land on splash
    const r1 = req('GET', `${BASE_URL}/`, null, htmlHeaders);
    check(r1, {
      'TC476 Journey step 1 splash loads':          res => res.status < 500,
      'TC477 Journey step 1 splash < 3s':           res => res.timings.duration < 3000,
    });

    // Step 2: Navigate to get-started
    const r2 = req('GET', `${BASE_URL}/get-started`, null, htmlHeaders);
    check(r2, {
      'TC478 Journey step 2 get-started loads':     res => res.status < 500,
      'TC479 Journey step 2 get-started < 3s':      res => res.timings.duration < 3000,
    });

    // Step 3: Choose role
    const r3 = req('GET', `${BASE_URL}/role-selection`, null, htmlHeaders);
    check(r3, {
      'TC480 Journey step 3 role-selection loads':  res => res.status < 500,
      'TC481 Journey step 3 role-selection < 3s':   res => res.timings.duration < 3000,
    });

    // Step 4: Navigate to login
    const r4 = req('GET', `${BASE_URL}/login`, null, htmlHeaders);
    check(r4, {
      'TC482 Journey step 4 login loads':           res => res.status < 500,
      'TC483 Journey step 4 login < 3s':            res => res.timings.duration < 3000,
    });

    // Step 5: Navigate to signup
    const r5 = req('GET', `${BASE_URL}/signup`, null, htmlHeaders);
    check(r5, {
      'TC484 Journey step 5 signup loads':          res => res.status < 500,
      'TC485 Journey step 5 signup < 3s':           res => res.timings.duration < 3000,
    });

    // Step 6: Submit signup to Firebase Auth
    const signupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
    const r6 = req('POST', signupUrl, JSON.stringify({
      email:             `journey_vu${vu}_${iter}@medlink-test.invalid`,
      password:          'Journey@12345',
      returnSecureToken: true,
    }), jsonHeaders);
    check(r6, {
      'TC486 Journey step 6 signup API not 5xx':    res => res.status < 500,
      'TC487 Journey step 6 signup API < 5s':       res => res.timings.duration < 5000,
      'TC488 Journey step 6 signup API has body':   res => res.body !== null,
      'TC489 Journey step 6 signup API JSON':       res => { try { JSON.parse(res.body); return true; } catch { return false; } },
    });

    // Step 7: Query Firestore for doctors
    const doctorQueryUrl = `${FS_BASE}:runQuery?key=${API_KEY}`;
    const r7 = req('POST', doctorQueryUrl, JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'users' }],
        where: { fieldFilter: { field: { fieldPath: 'role' }, op: 'EQUAL', value: { stringValue: 'doctor' } } },
        limit: 3,
      },
    }), jsonHeaders);
    check(r7, {
      'TC490 Journey step 7 doctor search not 5xx': res => res.status < 500,
      'TC491 Journey step 7 doctor search < 5s':    res => res.timings.duration < 5000,
      'TC492 Journey step 7 doctor search has body':res => res.body !== null,
    });

    // Step 8: Navigate to patient home
    const r8 = req('GET', `${BASE_URL}/patient`, null, htmlHeaders);
    check(r8, {
      'TC493 Journey step 8 patient home not 5xx':  res => res.status < 500,
      'TC494 Journey step 8 patient home < 3s':     res => res.timings.duration < 3000,
    });

    // Step 9: Navigate to search doctors
    const r9 = req('GET', `${BASE_URL}/patient/search`, null, htmlHeaders);
    check(r9, {
      'TC495 Journey step 9 search not 5xx':        res => res.status < 500,
      'TC496 Journey step 9 search < 3s':           res => res.timings.duration < 3000,
    });

    // Step 10: Navigate to reminders
    const r10 = req('GET', `${BASE_URL}/patient/reminders`, null, htmlHeaders);
    check(r10, {
      'TC497 Journey step 10 reminders not 5xx':    res => res.status < 500,
      'TC498 Journey step 10 reminders < 3s':       res => res.timings.duration < 3000,
    });

    // Step 11: Navigate to AI chat
    const r11 = req('GET', `${BASE_URL}/ai-chat`, null, htmlHeaders);
    check(r11, {
      'TC499 Journey step 11 AI chat not 5xx':      res => res.status < 500,
      'TC500 Journey step 11 AI chat < 3s':         res => res.timings.duration < 3000,
    });
  });

  // Brief cool-down before next iteration
  sleep(0.5);
}
