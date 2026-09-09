import { test, expect } from '@playwright/test';

const BO_URL = 'https://bo.mitoera.com';

async function login(page) {
  await page.goto(`${BO_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill('gtody.rabekoto@gmail.com');
  await page.locator('input[type="password"]').fill('Azerty1.');
  await page.getByRole('button', { name: /Se connecter/i }).click();
  await page.waitForURL(`${BO_URL}/`, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

test('debug: switch sandbox — capturer erreurs réseau workspaces', async ({ page }) => {
  const networkLog: string[] = [];

  page.on('response', async (res) => {
    const url = res.url();
    const status = res.status();
    if (status >= 400 || url.includes('mitoera.com')) {
      networkLog.push(`[${status}] ${res.request().method()} ${url.replace('https://bo.mitoera.com', '')}`);
    }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') networkLog.push(`[console.error] ${msg.text()}`);
  });

  await login(page);
  await page.screenshot({ path: '/tmp/debug-01-prod.png', fullPage: true });

  // Basculer en sandbox via localStorage + reload (comme le BO le fait)
  await page.evaluate(() => localStorage.setItem('bo_api_mode', 'sandbox'));
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: '/tmp/debug-02-sandbox.png', fullPage: true });

  console.log('=== NETWORK LOG ===');
  networkLog.forEach(l => console.log(l));

  // Vérifier l'état du localStorage après le switch
  const mode = await page.evaluate(() => localStorage.getItem('bo_api_mode'));
  const token = await page.evaluate(() => localStorage.getItem('bo_jwt'));
  console.log('mode after switch:', mode);
  console.log('token present:', !!token);
  if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('token payload:', JSON.stringify(payload));
  }

  // Le mode doit rester sandbox
  expect(mode).toBe('sandbox');
});
