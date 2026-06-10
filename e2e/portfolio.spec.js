import { test, expect } from '@playwright/test';
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from '../playwright.config';

test.describe('portfolio', () => {
  test('site loads with content from the API', async ({ page }) => {
    await page.goto('/');
    // Hero name renders once content arrives (text-scramble settles on the name).
    await expect(page.locator('.hero__title')).toContainText('Aydin', { timeout: 15_000 });
    // Sections render from API content.
    await expect(page.locator('#about .section__title')).toHaveText('About Me');
    await expect(page.locator('#contact .section__title')).toHaveText('Get In Touch');
  });

  test('contact form submits a real message', async ({ page }) => {
    await page.goto('/');
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.fill('.contact__form input[name="name"]', 'E2E Visitor');
    await page.fill('.contact__form input[name="email"]', 'visitor@portfolio-ci.dev');
    await page.fill('.contact__form textarea[name="message"]', 'Automated end-to-end check.');
    await page.click('.contact__submit');
    await expect(page.locator('.contact__submit')).toContainText('Message sent', {
      timeout: 10_000,
    });
  });

  test('admin can sign in, publish a change, and see it live', async ({ page }) => {
    const greeting = `E2E ${Date.now()}`;

    await page.goto('/');
    await page.click('.admin-fab');

    // Login gate appears for unauthenticated users.
    await expect(page.locator('.admin-login')).toBeVisible();
    await page.fill('.admin-login input[type="email"]', E2E_ADMIN_EMAIL);
    await page.fill('.admin-login input[type="password"]', E2E_ADMIN_PASSWORD);
    await page.click('.admin-login button[type="submit"]');

    // Editor unlocks; wait for a possible server-draft restore to settle
    // before typing so it cannot overwrite the edit.
    await expect(page.locator('.admin-tabs')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1_000);

    // First input on the Hero tab is the greeting.
    const greetingInput = page.locator('.admin-content .admin-section input.admin-input').first();
    await greetingInput.fill(greeting);

    const publish = page.locator('.admin-header-actions .admin-btn--primary');
    await expect(publish).toHaveText('Publish');
    await publish.click();
    await expect(publish).toHaveText('Published', { timeout: 10_000 });

    // The published change is live for a fresh page load.
    await page.reload();
    await expect(page.locator('.hero__title')).toContainText(greeting, { timeout: 15_000 });
  });
});
