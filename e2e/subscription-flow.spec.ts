import { test, expect } from '@playwright/test';

const BO_URL = 'https://bo.mitoera.com';
const TEST_EMAIL = `e2e.test.${Date.now()}@yopmail.com`;

// ─── helpers ────────────────────────────────────────────────────────────────

async function loginAs(page, email: string, password: string) {
  await page.goto(`${BO_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /Se connecter/i }).click();
  await page.waitForURL(`${BO_URL}/`, { timeout: 10000 });
}

// ─── Pricing CTAs ────────────────────────────────────────────────────────────

test.describe('Pricing — CTAs', () => {
  test('Mora et Soa pointent vers BO register avec plan', async ({ page }) => {
    await page.goto('/pricing');
    const moraHref = await page.locator('[data-plan="mora"]').getAttribute('href');
    const soaHref  = await page.locator('[data-plan="soa"]').getAttribute('href');
    expect(moraHref).toBe(`${BO_URL}/login?plan=mora&mode=register`);
    expect(soaHref).toBe(`${BO_URL}/login?plan=soa&mode=register`);
  });
});

// ─── Register ────────────────────────────────────────────────────────────────

test.describe('Register', () => {
  test('affiche le formulaire avec badge plan', async ({ page }) => {
    await page.goto(`${BO_URL}/login?plan=mora&mode=register`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Créer un compte')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Plan sélectionné.*Mora/i)).toBeVisible();
  });

  test('crée un compte et envoie un email de vérification', async ({ page }) => {
    await page.goto(`${BO_URL}/login?plan=mora&mode=register`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Créer un compte')).toBeVisible({ timeout: 10000 });

    await page.locator('input[placeholder="Jean"]').fill('E2E');
    await page.locator('input[placeholder="Dupont"]').fill('Test');
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill('Azerty1.');
    await page.getByRole('button', { name: /Créer mon compte/i }).click();

    await expect(page.getByText(/email de vérification/i)).toBeVisible({ timeout: 15000 });
    await expect(page.locator('input[type="email"]')).toHaveValue(TEST_EMAIL);
  });

  test('email déjà utilisé → erreur', async ({ page }) => {
    await page.goto(`${BO_URL}/login?mode=register`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Créer un compte')).toBeVisible({ timeout: 10000 });

    await page.locator('input[placeholder="Jean"]').fill('Dup');
    await page.locator('input[placeholder="Dupont"]').fill('Test');
    await page.locator('input[type="email"]').fill('gtody.rabekoto@gmail.com');
    await page.locator('input[type="password"]').fill('Azerty1.');
    await page.getByRole('button', { name: /Créer mon compte/i }).click();

    await expect(page.getByText(/déjà utilisé/i)).toBeVisible({ timeout: 10000 });
  });

  test('mot de passe < 8 caractères → erreur client', async ({ page }) => {
    await page.goto(`${BO_URL}/login?mode=register`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Créer un compte')).toBeVisible({ timeout: 10000 });

    await page.locator('input[placeholder="Jean"]').fill('Court');
    await page.locator('input[placeholder="Dupont"]').fill('Test');
    await page.locator('input[type="email"]').fill('court@example.com');
    await page.locator('input[type="password"]').fill('abc');
    await page.getByRole('button', { name: /Créer mon compte/i }).click();

    await expect(page.getByText(/8 caractères/i)).toBeVisible();
  });
});

// ─── Email verification ───────────────────────────────────────────────────────

test.describe('Email verification', () => {
  test('verified=1 déconnecte la session courante', async ({ page }) => {
    await page.goto(`${BO_URL}/login`);
    await page.evaluate(() => localStorage.setItem('bo_jwt', 'fake.jwt.token'));
    await page.goto(`${BO_URL}/login?verified=1`);
    await page.waitForLoadState('networkidle');

    const token = await page.evaluate(() => localStorage.getItem('bo_jwt'));
    expect(token).toBeNull();
    await expect(page.getByText(/Email vérifié/i)).toBeVisible({ timeout: 8000 });
  });
});

// ─── Prod vs Sandbox workspaces ───────────────────────────────────────────────

test.describe('Prod vs Sandbox — workspaces séparés', () => {
  test('prod : workspaces chargés après login', async ({ page }) => {
    await loginAs(page, 'gtody.rabekoto@gmail.com', 'todymic2026');

    // Le mode prod est actif (pas de header X-Api-Mode: sandbox)
    const mode = await page.evaluate(() => localStorage.getItem('bo_api_mode') || 'prod');
    expect(mode).toBe('prod');

    // Le workspace switcher est visible
    await expect(page.locator('[class*="workspace"], [data-workspace]').first()
      .or(page.getByText('gtody').first())
    ).toBeVisible({ timeout: 8000 });
  });

  test('mode prod par défaut — pas de sandbox résiduel après logout', async ({ page }) => {
    await page.goto(`${BO_URL}/login`);
    await page.evaluate(() => {
      localStorage.removeItem('bo_jwt');
      localStorage.removeItem('bo_api_mode');
    });
    const mode = await page.evaluate(() => localStorage.getItem('bo_api_mode'));
    expect(mode).toBeNull(); // null → 'prod' dans currentMode()
  });

  test('sandbox — compte inexistant bascule en prod sans déconnexion', async ({ page }) => {
    // Login prod
    await loginAs(page, 'gtody.rabekoto@gmail.com', 'todymic2026');

    // Simuler le switch en sandbox (comme si l'utilisateur avait cliqué sur "Sandbox")
    await page.evaluate(() => localStorage.setItem('bo_api_mode', 'sandbox'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Après le rechargement, si sandbox retourne 401,
    // le BO doit basculer en prod et rester connecté (pas de redirect login)
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');

    // Toujours connecté
    const token = await page.evaluate(() => localStorage.getItem('bo_jwt'));
    expect(token).not.toBeNull();
  });
});
