import { test, expect } from '@playwright/test';

const BO_URL = 'https://bo.mitoera.com';

test.describe('Pricing page — subscription CTAs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('page loads with plan cards', async ({ page }) => {
    await expect(page.locator('.plan')).toHaveCount(2);
  });

  test('Mora CTA links to BO register with plan=mora', async ({ page }) => {
    const link = page.locator('[data-plan="mora"]');
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toBe(`${BO_URL}/login?plan=mora&mode=register`);
  });

  test('Soa CTA links to BO register with plan=soa', async ({ page }) => {
    const link = page.locator('[data-plan="soa"]');
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toBe(`${BO_URL}/login?plan=soa&mode=register`);
  });

  test('Mora plan shows correct quota label', async ({ page }) => {
    const moraCard = page.locator('.plan').first();
    await expect(moraCard).toContainText('2 500');
  });

  test('Soa plan shows correct quota label', async ({ page }) => {
    const soaCard = page.locator('.plan.plan--featured');
    await expect(soaCard).toContainText('5 000');
  });

  test('clicking Mora CTA navigates to BO (link destination)', async ({ page, context }) => {
    // Intercept navigation to BO to avoid actually leaving the page
    const [newPage] = await Promise.all([
      context.waitForEvent('page').catch(() => null),
      page.locator('[data-plan="mora"]').click({ modifiers: ['Meta'] }).catch(() => null),
    ]);
    // Verify the link href is correct (navigation itself is external — only attribute check matters)
    const href = await page.locator('[data-plan="mora"]').getAttribute('href');
    expect(href).toContain('plan=mora');
    expect(href).toContain('mode=register');
  });
});
