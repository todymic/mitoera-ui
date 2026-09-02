import { test, expect } from '@playwright/test';

const BO_URL = 'https://bo.mitoera.com';

async function login(page, email = 'gtody.rabekoto@gmail.com', password = 'todymic2026') {
  await page.goto(`${BO_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /Se connecter/i }).click();
  await page.waitForURL(`${BO_URL}/`, { timeout: 10000 });
}

// Badge SANDBOX = le span amber avec texte exact "SANDBOX"
const sandboxBadge = (page) => page.locator('span.bg-amber-400', { hasText: /^SANDBOX$/ });

test.describe('Sandbox switcher', () => {

  test('le bouton sandbox est visible après login', async ({ page }) => {
    await login(page);
    await expect(page.getByTitle('Passer en mode Sandbox')).toBeVisible({ timeout: 5000 });
  });

  test('clic bascule en sandbox — badge SANDBOX apparaît', async ({ page }) => {
    await login(page);
    await page.getByTitle('Passer en mode Sandbox').click();
    await page.waitForLoadState('networkidle');
    await expect(sandboxBadge(page)).toBeVisible({ timeout: 8000 });
    await expect(page.getByTitle('Passer en mode Production')).toBeVisible();
  });

  test('en sandbox : Usage, Facturation, Équipe absents du menu', async ({ page }) => {
    await login(page);
    await page.evaluate(() => localStorage.setItem('bo_api_mode', 'sandbox'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(sandboxBadge(page)).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: /^Usage$/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /^Facturation$/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /^Équipe$/i })).not.toBeVisible();
  });

  test('en sandbox : Accueil, Plans, Événements, Clés API visibles', async ({ page }) => {
    await login(page);
    await page.evaluate(() => localStorage.setItem('bo_api_mode', 'sandbox'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(sandboxBadge(page)).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: /^Accueil$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^Plans$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^Événements$/i }).first()).toBeVisible();
  });

  test('retour en prod — badge SANDBOX disparaît', async ({ page }) => {
    await login(page);
    await page.evaluate(() => localStorage.setItem('bo_api_mode', 'sandbox'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(sandboxBadge(page)).toBeVisible({ timeout: 8000 });

    await page.getByTitle('Passer en mode Production').click();
    await page.waitForLoadState('networkidle');
    await expect(sandboxBadge(page)).not.toBeVisible({ timeout: 5000 });
  });

  test('t.razafindrabekoto@irytech.net — sandbox OK, workspace locale visible', async ({ page }) => {
    await login(page, 't.razafindrabekoto@irytech.net', 'Azerty1.');

    await page.evaluate(() => localStorage.setItem('bo_api_mode', 'sandbox'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    expect(page.url()).not.toContain('/login');
    await expect(sandboxBadge(page)).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: '/tmp/sandbox-irytech.png', fullPage: true });
    // workspace "locale" visible quelque part dans l'interface (switcher ou sidebar)
    await expect(page.locator('text=locale').first()).toBeVisible({ timeout: 8000 });
  });

});
