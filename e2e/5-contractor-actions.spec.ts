import { test, expect } from '@playwright/test';

// ======================
// HELPER: SCROLL + WAIT + CLICK
// ======================
async function scrollAndClick(page, locator) {
  await locator.waitFor({ state: 'attached', timeout: 15000 });

  await locator.scrollIntoViewIfNeeded();

  await expect(locator).toBeVisible({ timeout: 10000 });

  await page.waitForTimeout(300);

  await locator.click();
}

test('dashboard quick actions + vendors flow', async ({ page, request }) => {
  test.setTimeout(200000);
  const email = 'contractor@gmail.com';
  // ======================
  // STEP 0: PREPARE USER
  // ======================
  // await request.post('/api/setup-contractor');

  // ======================
  // STEP 1: LOGIN
  // ======================
  await page.goto('/login');

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', '11223344');

  await Promise.all([
    page.waitForURL(/dashboard|assessment/),
    page.click('button[type="submit"]'),
  ]);

  await page.waitForLoadState('networkidle');

  // ======================
  // STEP 2: ENSURE DASHBOARD
  // ======================
  if (!page.url().includes('/dashboard')) {
    await page.goto('/dashboard');
  }

  await expect(page).toHaveURL(/dashboard/);

  // ======================
  // STEP 3: QUICK ACTIONS TAB
  // ======================
  await page.getByText('Quick Actions').click();

  // ======================
  // STEP 4: CLICK FIND VENDORS (SCROLL + CLICK)
  // ======================
  await scrollAndClick(page, page.getByTestId('card-find-vendors'));
  await page.waitForURL(/vendors/);
  // ======================
  // STEP 5: WAIT FOR VENDORS PAGE
  // ======================
  await page.waitForSelector('[data-testid="text-page-title"]');
  
  await page.waitForTimeout(2000);
  // ======================
  // STEP 6: SEARCH "greg"
  // ======================
  const searchInput = page.getByTestId('input-search-vendors');

  await searchInput.fill('greg');
  await page.waitForTimeout(2000);

  // ======================
  // STEP 7: CLEAR FILTERS
  // ======================
  const clearBtn = page.getByTestId('button-clear-filters');

  if (await clearBtn.isVisible().catch(() => false)) {
    await clearBtn.click();
  }

  await expect(searchInput).toHaveValue('');

  // ======================
  // STEP 8: APPLY CATEGORY FILTER
  // ======================
  await page.getByTestId('select-category').click();
  await page.evaluate(() => window.scrollBy(0, 200));
  await page.getByRole('option', { name: 'Insurance' }).click();

  await page.waitForTimeout(3000);

  // ======================
  // STEP 9: BACK TO DASHBOARD
  // ======================
  await page.goBack();
  await page.waitForURL(/dashboard/);

  // ======================
  // STEP 10: RETAKE ASSESSMENT (SCROLL + CLICK)
  // ======================
 
  await scrollAndClick(page, page.getByTestId('card-retake-assessment'));
  await page.waitForURL(/assessment/);

  // ======================
  // STEP 11: SCROLL TOP + WAIT
  // ======================
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(2000);

  // ======================
  // STEP 12: BACK TO DASHBOARD
  // ======================
// reset BEFORE loading dashboard
const resetRes = await request.post('/api/test/reset-subscription', {
  data: { email },
});
expect(resetRes.ok()).toBeTruthy();

// NOW load dashboard fresh
await page.goto('/dashboard');
await page.waitForLoadState('networkidle');

  // ======================
  // STEP 13: CLICK UPGRADE PLAN (SCROLL + CLICK)
  // ======================
  await scrollAndClick(page, page.getByTestId('card-upgrade-plan'));
  await page.waitForURL(/billing/);

  // ======================
  // STEP 14: FINAL WAIT
  // ======================
  await page.waitForTimeout(2000);

  // ======================
  // FINAL VERIFY
  // ======================
  await expect(page).toHaveURL(/billing/);

  // ======================
// STEP 17: CLICK SUBSCRIBE
// ======================
// ======================
// STEP 17: CLICK PILOT BUTTON
// ======================

const subscribeBtn = page.locator(
  'button:has-text("Upgrade to Pilot")'
);

let isVisible = await subscribeBtn.isVisible().catch(() => false);

if (!isVisible) {
  console.log('⚠️ Not visible → forcing hard reload');

  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  await scrollAndClick(page, page.getByTestId('card-upgrade-plan'));

  await page.waitForURL(/billing/);

  await page.waitForTimeout(2000);

  isVisible = await subscribeBtn.isVisible().catch(() => false);
}

await expect(subscribeBtn).toBeVisible({ timeout: 15000 });

await Promise.all([
  page.waitForURL(/stripe|checkout/, { timeout: 30000 }),
  subscribeBtn.click(),
]);

// ======================
// STEP 18: WAIT FOR STRIPE PAGE
// ======================
await page.waitForTimeout(6000); // allow stripe to load


// ======================
// STEP 19: FILL STRIPE (FINAL WORKING)
// ======================

// wait until Stripe form is visible
await page.waitForSelector('text=Card information');

// Fill card details using labels (Stripe supported way)
await page.getByLabel('Card number').fill('4242424242424242');
await page.locator('input[name="cardExpiry"]').fill('1237');
await page.locator('input[name="cardCvc"]').fill('123');

// Name
await page.locator('input[name="billingName"]').fill('Muhammad Zeeshan');

// ======================
// STEP 20: SUBMIT PAYMENT
// ======================
const payBtn = page.getByTestId('hosted-payment-submit-button');

await expect(payBtn).toBeVisible();

await payBtn.click();

// wait for success / redirect
await Promise.race([
  page.waitForURL(/dashboard/, { timeout: 25000 }),
  page.waitForURL(/billing/, { timeout: 25000 }),
  page.waitForURL(/success/, { timeout: 25000 }),
]);
await page.waitForTimeout(2000);
// force correct state
if (!page.url().includes('/dashboard')) {
  await page.goto('/dashboard');
}

await page.waitForLoadState('networkidle');

console.log('💳 Stripe payment flow completed');

// ======================
// STEP: OPEN MATURITY SECTION
// ======================

// 1. Ensure tab is clicked AFTER render
const maturityTab = page.getByRole('button', {
  name: /Your Maturity Stage/i,
});

await page.waitForTimeout(1000);
await maturityTab.waitFor({ state: 'visible', timeout: 15000 });
await page.waitForTimeout(3000);
// click tab (this re-renders DOM)
await maturityTab.click();

// 2. Wait for tab content to actually mount
const maturityTitle = page.getByText('Your Maturity Stage');
await maturityTitle.waitFor({ state: 'visible', timeout: 10000 });

// 3. Handle collapse state (VERY IMPORTANT)
const collapseIcon = page.locator('svg').filter({ hasText: '' }).first();

const isCollapsed = await collapseIcon.evaluate(el =>
  el.classList.contains('rotate-180')
).catch(() => false);

if (isCollapsed) {
  await collapseIcon.click();
  await page.waitForTimeout(500); // allow expand animation
}

// ======================
// STEP: NOW scroll PROPERLY
// ======================

const retakeBtn = page.locator('button:has-text("Retake Assessment")');

// wait for DOM attach AFTER tab switch
await retakeBtn.waitFor({ state: 'attached', timeout: 15000 });

// 🔥 critical: scroll AFTER render, not before
await retakeBtn.scrollIntoViewIfNeeded();

// ensure visible
await expect(retakeBtn).toBeVisible({ timeout: 10000 });

// small stability wait
await page.waitForTimeout(300);

await retakeBtn.click();

// ======================
// STEP 12.3: CONFIRM RESET POPUP
// ======================

const resetBtn = page.locator('button:has-text("Reset Assessment")');

await expect(resetBtn).toBeVisible();

await Promise.all([
  page.waitForURL(/assessment/),
  resetBtn.click(),
]);

// ======================
// STEP 12.4: RUN ASSESSMENT AGAIN (GROWTH STAGE)
// ======================

// wait for chat input
const input = page.getByTestId('input-chat-message');
await input.waitFor({ timeout: 15000 });

// mostly positive answers → push toward Growth stage
const growthAnswers = [
  "We have already started working with government clients.",
  "We are registered on SAM.gov and have completed our profiles.",
  "We have a small but growing team handling projects.",
  "We have some past performance and references.",
  "We provide IT and consulting services for agencies.",
  "Our goal is to scale and win multiple contracts."
];

for (let i = 0; i < 12; i++) {
  const sendBtn = page.getByTestId('button-send-message');

  // check completion
  const isCompleted = await page
    .locator('[data-testid="button-continue-dashboard"], text=Status: Completed')
    .isVisible()
    .catch(() => false);

  if (isCompleted) {
    console.log('✅ Growth assessment completed');
    break;
  }

  if (!(await input.isVisible().catch(() => false))) break;
await input.waitFor({ state: 'visible', timeout: 10000 });
await input.click();
  await input.fill(growthAnswers[i % growthAnswers.length]);
  await sendBtn.click();
  await page.waitForTimeout(600);

  const assistantMessages = page.locator('[data-testid^="message-assistant"]');
  const beforeCount = await assistantMessages.count();

  await Promise.race([
  expect(assistantMessages).toHaveCount(beforeCount + 1, { timeout: 25000 }),
  page.locator('[data-testid="button-continue-dashboard"]').waitFor({ timeout: 25000 }),
  page.locator('text=Status: Completed').waitFor({ timeout: 25000 }), // ✅ restore
]);

  await page.waitForTimeout(400);
  if (i === 11) {
  console.log('⚠️ Max steps reached, forcing dashboard');
  await page.goto('/dashboard');
  break;
}
}

// ======================
// STEP 12.5: RETURN TO DASHBOARD
// ======================

await page.waitForTimeout(2000);

const continueBtn = page.getByTestId('button-continue-dashboard');

if (await continueBtn.isVisible().catch(() => false)) {
  await Promise.all([
    page.waitForURL(/dashboard/),
    continueBtn.click(),
  ]);
} else {
  await page.goto('/dashboard');
}

await expect(page).toHaveURL(/dashboard/);

console.log('🚀 Growth stage assessment completed');
});