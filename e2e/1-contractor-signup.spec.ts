import { test, expect } from '@playwright/test';

test('contractor signup flow', async ({ page }) => {

  await page.goto('http://localhost:5000/signup');

  await page.waitForTimeout(1000);

  // ======================
  // FILL FORM (USE TESTIDS)
  // ======================
  const email = `test${Date.now()}@gmail.com`;

  await page.fill('[data-testid="input-firstname"]', 'Test');
  await page.fill('[data-testid="input-lastname"]', 'User');
  await page.fill('[data-testid="input-email"]', email);
  await page.fill('[data-testid="input-password"]', '11223344');
  await page.fill('[data-testid="input-confirm-password"]', '11223344');

  // ✅ CORRECT DROPDOWN
  await page.selectOption('[data-testid="select-business-type"]', 'both');

  // ======================
  // ENSURE BUTTON VISIBLE
  // ======================
  await page.locator('[data-testid="button-signup"]').scrollIntoViewIfNeeded();

  // ======================
  // SUBMIT
  // ======================
  await page.click('[data-testid="button-signup"]');
  // wait for redirect
  await page.waitForTimeout(8000);
});