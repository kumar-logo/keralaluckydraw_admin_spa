import { test, expect, type Page } from '@playwright/test';

/**
 * End-to-end skeleton for the admin money path:
 *   login -> dashboard -> open the recharge queue -> approve a pending recharge.
 *
 * The backend is stubbed at the network layer so the skeleton runs without a
 * live API. Replace the route handlers with a seeded test backend to turn this
 * into a full integration run.
 */

const SUCCESS = 0;

const envelope = (data: unknown) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ code: SUCCESS, msg: 'ok', data }),
});

const superAdmin = {
  id: 1,
  username: 'superadmin',
  displayName: 'Super Admin',
  role: 'super_admin',
};

const pendingRecharge = {
  id: 1,
  orderNo: 'RC-E2E-0001',
  userId: 'U1000',
  username: 'e2e_user',
  amount: 3000,
  channel: 'UPI',
  gatewayMode: 'manual',
  status: 0,
  createdAt: '2026-06-27T10:00:00',
  updatedAt: '2026-06-27T10:00:00',
};

let approveCalled = false;

const stubBackend = async (page: Page) => {
  approveCalled = false;

  await page.route('**/admin/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/auth/login') && method === 'POST') {
      return route.fulfill(envelope({ admin: superAdmin, token: 'e2e-token' }));
    }
    if (url.includes('/config/meta')) {
      return route.fulfill(
        envelope({
          appName: 'Kerala Lucky Draw',
          gameTypes: [],
          lotteryColors: {},
          statusMaps: {
            recharge: {
              0: { text: 'Pending', color: 'orange' },
              1: { text: 'Success', color: 'green' },
            },
          },
          intervalPresets: [],
          prizeTierOptions: [],
          positionColors: [],
          positionGradients: [],
        }),
      );
    }
    if (url.includes('/config/grouped')) {
      return route.fulfill(envelope({}));
    }
    if (url.includes('/finance/recharge/approve') && method === 'POST') {
      approveCalled = true;
      return route.fulfill(envelope({ success: true }));
    }
    if (url.includes('/finance/recharge/list') && method === 'POST') {
      const rows = approveCalled ? [] : [pendingRecharge];
      return route.fulfill(
        envelope({ list: rows, total: rows.length, pageNo: 1, pageSize: 10 }),
      );
    }
    if (url.includes('/dashboard')) {
      return route.fulfill(envelope({}));
    }
    // Generic fallback for any other admin call (badges, counts, etc.).
    return route.fulfill(envelope({ list: [], total: 0 }));
  });
};

test.describe('Admin recharge money path (e2e skeleton)', () => {
  test('login -> dashboard -> recharge queue -> approve', async ({ page }) => {
    await stubBackend(page);

    // 1. Login (relative path resolves under the /admin/ base).
    await page.goto('login');
    await page.getByPlaceholder('Enter your username').fill('superadmin');
    await page.getByPlaceholder('Enter your password').fill('secret');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // 2. Dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    // 3. Open the recharge money queue
    await page.goto('finance/recharge');
    await expect(page.getByText('RC-E2E-0001')).toBeVisible();

    // 4. Approve the pending recharge
    await page.getByRole('button', { name: /Approve/i }).first().click();
    await page.getByRole('button', { name: 'Approve', exact: true }).click();

    await expect.poll(() => approveCalled).toBe(true);
  });
});
