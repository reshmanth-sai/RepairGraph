/**
 * RepairGraph Production Smoke Test Suite
 * Tests live HTTP endpoints, security headers, rate limiting, token suppression,
 * device CRUD, and frontend route health.
 *
 * Usage: npx tsx scripts/smoke-test.ts [BASE_URL]
 */

const BASE_URL = process.argv[2] || process.env.TEST_BASE_URL || 'http://localhost:3000';

interface HealthResponse {
  success: boolean;
  data?: {
    status: string;
    database: string;
    latencyMs: number;
    uptime: number;
    timestamp: string;
    environment: string;
  };
}

interface LoginResponse {
  success: boolean;
  data?: {
    user: { id: string; name: string; email: string; role: string };
    token?: string;
  };
  error?: { message: string; code: string };
}

let passedCount = 0;
let failedCount = 0;

async function assertTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err: unknown) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${(err as Error).message}\n`);
    failedCount++;
  }
}

async function runSmokeTests() {
  console.log('====================================================');
  console.log(`🚀 RUNNING REPAIRGRAPH LIVE SMOKE TESTS ON: ${BASE_URL}`);
  console.log('====================================================\n');

  // 1. Health & Database Connectivity Check
  await assertTest('Health Endpoint: GET /api/health verifies DB connection and returns latency', async () => {
    const res = await fetch(`${BASE_URL}/api/health`, { cache: 'no-store' });
    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200 from /api/health, got ${res.status}`);
    }
    const json = (await res.json()) as HealthResponse;
    if (!json.success || json.data?.status !== 'ok' || json.data?.database !== 'connected') {
      throw new Error(`Health payload invalid: ${JSON.stringify(json)}`);
    }
    if (typeof json.data.latencyMs !== 'number') {
      throw new Error(`Expected latencyMs numeric telemetry`);
    }
  });

  // 2. Production Security Headers Check
  await assertTest('Security Headers: Verifies strict HTTP security headers on responses', async () => {
    const res = await fetch(`${BASE_URL}/api/health`, { method: 'HEAD' });
    const nosniff = res.headers.get('x-content-type-options');
    const xframe = res.headers.get('x-frame-options');
    const xss = res.headers.get('x-xss-protection');
    const referrer = res.headers.get('referrer-policy');
    const permissions = res.headers.get('permissions-policy');
    const hsts = res.headers.get('strict-transport-security');

    if (nosniff !== 'nosniff') throw new Error(`Missing X-Content-Type-Options: nosniff`);
    if (xframe !== 'DENY') throw new Error(`Missing X-Frame-Options: DENY`);
    if (!xss?.includes('1; mode=block')) throw new Error(`Missing X-XSS-Protection`);
    if (referrer !== 'strict-origin-when-cross-origin') throw new Error(`Missing Referrer-Policy`);
    if (!permissions?.includes('camera=()')) throw new Error(`Missing Permissions-Policy`);
    if (!hsts?.includes('max-age=31536000')) throw new Error(`Missing Strict-Transport-Security`);
  });

  // 3. Browser Token Suppression vs Programmatic Token Access
  let sessionCookie = '';
  let customerToken = '';

  await assertTest('Auth Security: Standard browser login sets HTTP-only cookie and omits raw JWT in JSON', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'consumer@repairgraph.internal',
        password: 'Password123!',
      }),
    });

    if (res.status !== 200) {
      throw new Error(`Login failed with HTTP ${res.status}`);
    }

    const setCookie = res.headers.get('set-cookie');
    if (!setCookie || !setCookie.includes('rg_token=')) {
      throw new Error(`Missing rg_token in Set-Cookie header`);
    }
    sessionCookie = setCookie.split(';')[0];

    const json = (await res.json()) as LoginResponse;
    if (!json.data?.user) {
      throw new Error(`Missing user profile in response`);
    }
    if (json.data.token !== undefined) {
      throw new Error(`Raw JWT token must be omitted from standard browser response for security!`);
    }
  });

  await assertTest('Auth API: Programmatic login (?includeToken=true) supplies token for integration clients', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login?includeToken=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'consumer@repairgraph.internal',
        password: 'Password123!',
      }),
    });

    if (res.status !== 200) {
      throw new Error(`Login with includeToken failed with HTTP ${res.status}`);
    }

    const json = (await res.json()) as LoginResponse;
    if (!json.data?.token || typeof json.data.token !== 'string') {
      throw new Error(`Expected programmatic token in response`);
    }
    customerToken = json.data.token;
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    if (meRes.status !== 200) {
      throw new Error(`Bearer token authentication failed on /api/auth/me (HTTP ${meRes.status})`);
    }
  });

  // 4. Rate Limiting on Auth
  await assertTest('Auth Rate Limiting: Blocks abusive login bursts with HTTP 429 RATE_LIMIT_EXCEEDED', async () => {
    // Send 12 rapid requests from an arbitrary IP header
    let received429 = false;
    for (let i = 0; i < 12; i++) {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.88',
        },
        body: JSON.stringify({
          email: 'abusive.attacker@example.com',
          password: 'WrongPassword!',
        }),
      });

      if (res.status === 429) {
        const json = await res.json();
        if (json.error?.code === 'RATE_LIMIT_EXCEEDED') {
          received429 = true;
          break;
        }
      }
    }

    if (!received429) {
      throw new Error('Expected rate limiter to return HTTP 429 after threshold was exceeded');
    }
  });

  // 5. Device Full CRUD (Create, Read, Update, Delete)
  let createdDeviceId = '';

  await assertTest('Device CRUD: Customer creates, updates via PUT, and deletes device using cookie session', async () => {
    // Create
    const createRes = await fetch(`${BASE_URL}/api/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        category: 'LAPTOP',
        brand: 'Framework',
        model: 'Laptop 13 AMD',
        serialNumber: `FW-SMOKE-${Date.now().toString().slice(-6)}`,
        purchasePrice: 92000,
        currentValue: 80000,
        condition: 'EXCELLENT',
      }),
    });

    if (createRes.status !== 201) {
      const err = await createRes.text();
      throw new Error(`Device creation failed (HTTP ${createRes.status}): ${err}`);
    }
    const createJson = await createRes.json();
    createdDeviceId = createJson.data.id;

    // Read
    const getRes = await fetch(`${BASE_URL}/api/devices/${createdDeviceId}`, {
      headers: { Cookie: sessionCookie },
    });
    if (getRes.status !== 200) {
      throw new Error(`Device read failed with HTTP ${getRes.status}`);
    }

    // Update (PUT)
    const updateRes = await fetch(`${BASE_URL}/api/devices/${createdDeviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        currentValue: 75000,
        condition: 'GOOD',
      }),
    });

    if (updateRes.status !== 200) {
      const err = await updateRes.text();
      throw new Error(`Device update failed (HTTP ${updateRes.status}): ${err}`);
    }
    const updateJson = await updateRes.json();
    if (updateJson.data.currentValue !== 75000 || updateJson.data.condition !== 'GOOD') {
      throw new Error(`Updated device fields did not persist`);
    }

    // Delete
    const deleteRes = await fetch(`${BASE_URL}/api/devices/${createdDeviceId}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    if (deleteRes.status !== 200) {
      throw new Error(`Device deletion failed with HTTP ${deleteRes.status}`);
    }
  });

  // 6. Repair Passport Ledger
  await assertTest('Repair Passport: GET /api/repair-history returns standardized service records', async () => {
    const res = await fetch(`${BASE_URL}/api/repair-history`, {
      headers: { Cookie: sessionCookie },
    });
    if (res.status !== 200) {
      throw new Error(`Repair history endpoint returned HTTP ${res.status}`);
    }
    const json = await res.json();
    if (!Array.isArray(json.data)) {
      throw new Error(`Expected array of repair history records in json.data`);
    }
  });

  // 7. Frontend Pages Verification
  const frontendRoutes = [
    '/',
    '/devices',
    '/repairs',
    '/passport',
    '/report',
    '/login',
  ];

  for (const route of frontendRoutes) {
    await assertTest(`Frontend Page: GET ${route} returns HTTP 200 with HTML document`, async () => {
      const res = await fetch(`${BASE_URL}${route}`);
      if (res.status !== 200) {
        throw new Error(`GET ${route} failed with HTTP ${res.status}`);
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        throw new Error(`GET ${route} did not return text/html (got ${contentType})`);
      }
    });
  }

  console.log('\n----------------------------------------------------');
  console.log(`SMOKE TEST RESULTS: ${passedCount} PASSED | ${failedCount} FAILED`);
  console.log('----------------------------------------------------');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSmokeTests().catch((err) => {
  console.error('Fatal smoke test error:', err);
  process.exit(1);
});
