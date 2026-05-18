import { test, expect } from '@playwright/test';

// ======================
// HELPER
// ======================

async function slowClick(page, locator) {
  await locator.waitFor({
    state: 'visible',
    timeout: 15000,
  });

  await locator.scrollIntoViewIfNeeded();

  // visible pause
  await page.waitForTimeout(1500);

  await locator.hover();

  // human pause
  await page.waitForTimeout(1000);

  await locator.click();

  // after click pause
  await page.waitForTimeout(2000);
}

test.use({
  launchOptions: {
    slowMo: 800, // 🔥 makes browser visibly slow
  },
});

test('admin vendors management flow', async ({ page }) => {
  test.setTimeout(180000);

  // ======================
  // STEP 1: LOGIN PAGE
  // ======================

  console.log('Opening login page');

  await page.goto('/login');

  await page.waitForTimeout(2000);

  // ======================
  // STEP 2: LOGIN
  // ======================

  console.log('Typing admin email');

  await page.fill('input[name="email"]', 'admin@gmail.com');

  await page.waitForTimeout(1500);

  console.log('Typing password');

  await page.fill('input[name="password"]', '11223344');

  await page.waitForTimeout(1500);

  console.log('Clicking login');

  await Promise.all([
    page.waitForURL(/admin-dashboard|dashboard/),

    page.click('button[type="submit"]'),
  ]);

  await page.waitForLoadState('networkidle');

  await page.waitForTimeout(1000);

  // ======================
  // STEP 3: OPEN VENDORS
  // ======================

  console.log('Opening vendors page');

  const vendorsBtn = page.getByRole('link', {
    name: /vendors/i,
  });

  await slowClick(page, vendorsBtn);

  await page.waitForURL(/admin\/vendors/);

  // visible wait
  await page.waitForTimeout(1000);

  // ======================
  // STEP 4: VERIFY PAGE
  // ======================

  await expect(
    page.getByText('Manage Vendors')
  ).toBeVisible();

  console.log('Vendors page loaded');

  await page.waitForTimeout(1000);

  // ======================
  // STEP 5: WAIT TABLE
  // ======================

  await page.waitForSelector('table');

  const rows = page.locator('tbody tr');

  const rowCount = await rows.count();

  expect(rowCount).toBeGreaterThan(0);

  console.log(`Found ${rowCount} vendors`);


  // ======================
  // STEP 6: FIRST ROW
  // ======================

  const firstRow = rows.first();

  await firstRow.scrollIntoViewIfNeeded();

  await page.waitForTimeout(1000);

  // ======================
  // STEP 7: DEACTIVATE
  // ======================

  const deactivateBtn = firstRow.getByRole('button', {
    name: /deactivate/i,
  });

  const activateBtn = firstRow.getByRole('button', {
    name: /activate/i,
  });

  // ======================
  // IF ACTIVE
  // ======================

  if (await deactivateBtn.isVisible().catch(() => false)) {
    console.log('Vendor active');

    await page.waitForTimeout(500);

    console.log('Clicking deactivate');

    await slowClick(page, deactivateBtn);

    // toast wait
    await page.waitForTimeout(1000);

    // verify deactivate changed to activate
    // wait for rerender
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(3000);

    // refetch row
    const updatedRowAfterDeactivate = page.locator('tbody tr').first();

    await expect(
    updatedRowAfterDeactivate.getByRole('button', {
        name: /activate/i,
    })
    ).toBeVisible({
    timeout: 15000,
    });

    console.log('Vendor deactivated');

    // visible pause
    await page.waitForTimeout(1000);

    // ======================
    // ACTIVATE AGAIN
    // ======================

    const activateAgainBtn = firstRow.getByRole('button', {
      name: /activate/i,
    });

    await activateAgainBtn.waitFor({
      state: 'visible',
    });

    await page.waitForTimeout(1000);

    console.log('Clicking activate');

    await slowClick(page, activateAgainBtn);

    // verify activate changed to deactivate
    // wait for rerender
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(3000);

    // refetch row
    const updatedRowAfterActivate = page.locator('tbody tr').first();

    await expect(
    updatedRowAfterActivate.getByRole('button', {
        name: /deactivate/i,
    })
    ).toBeVisible({
    timeout: 15000,
    });

    console.log('Vendor activated');

    // visible pause
    await page.waitForTimeout(1000);
  }

  // ======================
  // IF PENDING
  // ======================

  else if (await activateBtn.isVisible().catch(() => false)) {
    console.log('Vendor pending');

    console.log('Clicking activate');

    await slowClick(page, activateBtn);

    // wait for UI refresh
    await page.waitForTimeout(1000);

    // verify activate changed to deactivate
    // wait for rerender
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(3000);

    // refetch row
    const updatedPendingRow = page.locator('tbody tr').first();

    await expect(
    updatedPendingRow.getByRole('button', {
        name: /deactivate/i,
    })
    ).toBeVisible({
    timeout: 15000,
    });

    console.log('Vendor activated');

    await page.waitForTimeout(1000);
  }

  // ======================
  // STEP 8: DELETE FLOW
  // ======================

  page.on('dialog', async (dialog) => {
    console.log('Delete confirmation opened');

    await page.waitForTimeout(1000);

    await dialog.dismiss();

    console.log('Delete cancelled');
  });

  const deleteBtn = firstRow.getByRole('button', {
    name: /delete/i,
  });

  await page.waitForTimeout(1000);

  console.log('Opening delete popup');

  await slowClick(page, deleteBtn);

  await page.waitForTimeout(1000);

  // ======================
  // FINAL
  // ======================

  console.log('Admin vendors flow completed');
});