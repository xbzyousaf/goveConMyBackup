import { test, expect } from '@playwright/test';

test('contractor login + dashboard view', async ({ page }) => {

  // ======================
  // STEP 1: OPEN LOGIN
  // ======================
  await page.goto('http://localhost:5000/login');

  await page.waitForTimeout(1000);

  // ======================
  // STEP 2: LOGIN
  // ======================
  await page.fill('input[name="email"]', 'contractor@gmail.com');
  await page.fill('input[name="password"]', '11223344');

  await page.click('button[type="submit"]');

  // wait for redirect
  // await page.waitForTimeout(3000);

  // ======================
  // STEP 3: VERIFY LOGIN
  // ======================
  await expect(page).toHaveURL(/dashboard|home|contractor/);

  // ======================
  // STEP 4: SCROLL PAGE (NEW)
  // ======================

  // scroll down step by step
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, 100); // scroll down
    await page.waitForTimeout(200);
  }

  // ======================
  // STEP 5: WAIT TO SEE FULL DASHBOARD
  // ======================
  await page.waitForTimeout(5000);
});