import { test, expect } from '@playwright/test';

const BO_URL = 'https://bo.mitoera.com';

test('api-keys page accessible après login', async ({ page }) => {
  const log: string[] = [];

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/')) {
      log.push(`[${res.status()}] ${res.request().method()} ${url.replace(BO_URL, '')}`);
    }
  });

  // Login
  await page.goto(`${BO_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill('gtody.rabekoto@gmail.com');
  await page.locator('input[type="password"]').fill('Azerty1.');
  await page.getByRole('button', { name: /Se connecter/i }).click();

  // Attendre la redirection (peu importe l'URL finale)
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  const urlAfterLogin = page.url();
  console.log('URL after login:', urlAfterLogin);

  // Naviguer vers api-keys
  await page.goto(`${BO_URL}/api-keys`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('=== NETWORK LOG ===');
  log.forEach(l => console.log(l));

  await page.screenshot({ path: '/tmp/api-keys.png', fullPage: true });

  // Vérifier qu'il n'y a pas de 500
  const has500 = log.some(l => l.startsWith('[500]'));
  expect(has500, '500 détecté sur /api/api-keys').toBe(false);
});
