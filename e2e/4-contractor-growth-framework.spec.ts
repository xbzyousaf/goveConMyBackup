import { test, expect } from '@playwright/test';

test('contractor growth framework flow (stable + visible)', async ({ page, request }) => {

  test.setTimeout(120000);

  // ======================
  // STEP 0: PREPARE USER
  // ======================
  const res = await request.post(`/api/test/setup-contractor`);
  expect(res.ok()).toBeTruthy();

  // ======================
  // STEP 1: LOGIN
  // ======================
  await page.goto(`/login`);

  await page.fill('input[name="email"]', 'contractor2@gmail.com');
  await page.fill('input[name="password"]', '11223344');

  await Promise.all([
    page.waitForURL(/dashboard/),
    page.click('button[type="submit"]'),
  ]);

  await page.waitForLoadState('networkidle');

  // ======================
  // HELPER FUNCTION
  // ======================
  const completeSection = async (url: string, sectionName: string) => {

    await page.goto(url);

    await expect(page.locator('text=Milestones & Checklist')).toBeVisible();

    const checkboxes = page.locator('[role="checkbox"]');
    await expect(checkboxes.first()).toBeVisible({ timeout: 10000 });

    const count = await checkboxes.count();

    for (let i = 0; i < count; i++) {
      const cb = checkboxes.nth(i);

      console.log(`Checking ${sectionName} milestone ${i + 1}`);

      await cb.scrollIntoViewIfNeeded();

      try {
        await cb.click({ timeout: 3000 });
      } catch {
        await cb.click({ force: true });
      }

      await page.waitForTimeout(500);
    }

    // ======================
    // VIEW VENDORS
    // ======================
    const viewVendorBtn = page.locator('text=View Vendors').first();

    if (await viewVendorBtn.isVisible().catch(() => false)) {
      console.log(`Opening Vendors from ${sectionName}`);

      await viewVendorBtn.scrollIntoViewIfNeeded();

      await Promise.all([
        page.waitForURL(/\/vendors\?categoryId=/),
        viewVendorBtn.click()
      ]);
      // validate categoryId exists
const url = new URL(page.url());
expect(url.searchParams.get('categoryId')).toBeTruthy();

      // ✅ WAIT FOR PAGE UI (CRITICAL FIX)
      await expect(
        page.locator('text=Vendors').first()
      ).toBeVisible({ timeout: 20000 });


      console.log('✅ Vendors page opened & click tracked');

      await page.waitForTimeout(1200);

      await page.goBack();

      await expect(
        page.locator('text=Milestones & Checklist')
      ).toBeVisible();
    }
  };

  // ======================
  // RUN ALL SECTIONS
  // ======================
  await completeSection(
    `/process/business_structure`,
    'Business Structure'
  );

  await completeSection(
    `/process/business_strategy`,
    'Business Strategy'
  );

  await completeSection(
    `/process/execution`,
    'Execution'
  );

  // ======================
  // FINAL STEP
  // ======================

const completion = page.locator('text=Startup Complete').first();
await expect(completion).toBeVisible({ timeout: 15000 });

const stayBtn = page.getByRole('button', { name: /stay in current/i });

await stayBtn.scrollIntoViewIfNeeded();

// ✅ WAIT HERE (before click)
await page.waitForTimeout(2000);

// now click
await Promise.all([
  page.waitForURL(/dashboard/),
  stayBtn.click()
]);

await expect(page).toHaveURL(/dashboard/);

console.log('🎉 Growth Framework Completed Successfully');
});