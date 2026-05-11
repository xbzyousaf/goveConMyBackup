# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 5-contractor-actions.spec.ts >> dashboard quick actions + vendors flow
- Location: e2e\5-contractor-actions.spec.ts:18:1

# Error details

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]: Hurry! Only 348 Free PROOF Audits remaining
      - generic [ref=e6]:
        - generic [ref=e7]:
          - link "PROOF Logo" [ref=e8] [cursor=pointer]:
            - /url: /dashboard
            - img "PROOF Logo" [ref=e11]
          - navigation [ref=e12]:
            - link "Dashboard" [ref=e13] [cursor=pointer]:
              - /url: /dashboard
              - button "Dashboard" [ref=e14]
            - link "Marketplace" [ref=e15] [cursor=pointer]:
              - /url: /marketplace
              - button "Marketplace" [ref=e16]
        - generic [ref=e17]:
          - generic [ref=e18]:
            - img [ref=e19]
            - searchbox "Search vendors, services..." [ref=e22]
          - generic [ref=e23]:
            - button [ref=e24] [cursor=pointer]:
              - generic [ref=e25]:
                - img
            - button [ref=e26] [cursor=pointer]:
              - generic [ref=e27]:
                - img
            - button "Toggle theme" [ref=e28] [cursor=pointer]:
              - img
              - img
              - generic [ref=e29]: Toggle theme
            - button "C" [ref=e30] [cursor=pointer]:
              - generic [ref=e32]: C
    - generic [ref=e33]:
      - heading "Billing & Subscription" [level=1] [ref=e34]
      - generic [ref=e35]:
        - paragraph [ref=e36]: "Plan: Free"
        - paragraph [ref=e37]: "Status: free"
        - paragraph [ref=e38]: "Next Billing / Expiry: -"
      - generic [ref=e39]:
        - generic [ref=e40]:
          - heading "Free" [level=2] [ref=e41]
          - paragraph [ref=e42]: $0
          - paragraph [ref=e43]: Basic access
          - list [ref=e44]:
            - listitem [ref=e45]: ✔ Limited Marketplace
            - listitem [ref=e46]: ✔ Basic Visibility
          - paragraph [ref=e47]: Current Plan
        - generic [ref=e48]:
          - heading "Monthly" [level=2] [ref=e49]
          - paragraph [ref=e50]: $9.97
          - paragraph [ref=e51]: Billed monthly
          - list [ref=e52]:
            - listitem [ref=e53]: ✔ Full Access
            - listitem [ref=e54]: ✔ Templates
            - listitem [ref=e55]: ✔ Priority Support
          - button "Subscribe ($9.97/month)" [ref=e56] [cursor=pointer]
        - generic [ref=e57]:
          - heading "Yearly" [level=2] [ref=e58]
          - paragraph [ref=e59]: $119.64
          - paragraph [ref=e60]: Billed yearly (save more)
          - list [ref=e61]:
            - listitem [ref=e62]: ✔ Full Access
            - listitem [ref=e63]: ✔ Templates
            - listitem [ref=e64]: ✔ Priority Support
          - paragraph [ref=e65]: Coming soon
```

# Test source

```ts
  66  |   // ======================
  67  |   // STEP 6: SEARCH "greg"
  68  |   // ======================
  69  |   const searchInput = page.getByTestId('input-search-vendors');
  70  | 
  71  |   await searchInput.fill('greg');
  72  |   await page.waitForTimeout(2000);
  73  | 
  74  |   // ======================
  75  |   // STEP 7: CLEAR FILTERS
  76  |   // ======================
  77  |   const clearBtn = page.getByTestId('button-clear-filters');
  78  | 
  79  |   if (await clearBtn.isVisible().catch(() => false)) {
  80  |     await clearBtn.click();
  81  |   }
  82  | 
  83  |   await expect(searchInput).toHaveValue('');
  84  | 
  85  |   // ======================
  86  |   // STEP 8: APPLY CATEGORY FILTER
  87  |   // ======================
  88  |   await page.getByTestId('select-category').click();
  89  |   await page.evaluate(() => window.scrollBy(0, 200));
  90  |   await page.getByRole('option', { name: 'Insurance' }).click();
  91  | 
  92  |   await page.waitForTimeout(3000);
  93  | 
  94  |   // ======================
  95  |   // STEP 9: BACK TO DASHBOARD
  96  |   // ======================
  97  |   await page.goBack();
  98  |   await page.waitForURL(/dashboard/);
  99  | 
  100 |   // ======================
  101 |   // STEP 10: RETAKE ASSESSMENT (SCROLL + CLICK)
  102 |   // ======================
  103 |  
  104 |   await scrollAndClick(page, page.getByTestId('card-retake-assessment'));
  105 |   await page.waitForURL(/assessment/);
  106 | 
  107 |   // ======================
  108 |   // STEP 11: SCROLL TOP + WAIT
  109 |   // ======================
  110 |   await page.waitForTimeout(2000);
  111 |   await page.evaluate(() => window.scrollTo(0, 0));
  112 |   await page.waitForTimeout(2000);
  113 | 
  114 |   // ======================
  115 |   // STEP 12: BACK TO DASHBOARD
  116 |   // ======================
  117 | // reset BEFORE loading dashboard
  118 | const resetRes = await request.post('/api/test/reset-subscription', {
  119 |   data: { email },
  120 | });
  121 | expect(resetRes.ok()).toBeTruthy();
  122 | 
  123 | // NOW load dashboard fresh
  124 | await page.goto('/dashboard');
  125 | await page.waitForLoadState('networkidle');
  126 | 
  127 |   // ======================
  128 |   // STEP 13: CLICK UPGRADE PLAN (SCROLL + CLICK)
  129 |   // ======================
  130 |   await scrollAndClick(page, page.getByTestId('card-upgrade-plan'));
  131 |   await page.waitForURL(/billing/);
  132 | 
  133 |   // ======================
  134 |   // STEP 14: FINAL WAIT
  135 |   // ======================
  136 |   await page.waitForTimeout(2000);
  137 | 
  138 |   // ======================
  139 |   // FINAL VERIFY
  140 |   // ======================
  141 |   await expect(page).toHaveURL(/billing/);
  142 | 
  143 |   // ======================
  144 | // STEP 17: CLICK SUBSCRIBE
  145 | // ======================
  146 | const subscribeBtn = page.getByRole('button', {
  147 |   name: /subscribe/i,
  148 | });
  149 | let isVisible = await subscribeBtn.isVisible().catch(() => false);
  150 | 
  151 | if (!isVisible) {
  152 |   console.log('⚠️ Not visible → forcing hard reload');
  153 | 
  154 |   await page.goto('/dashboard'); // reset state properly
  155 |   await page.waitForLoadState('networkidle');
  156 | 
  157 |   await scrollAndClick(page, page.getByTestId('card-upgrade-plan'));
  158 |   await page.waitForURL(/billing/);
  159 | 
  160 |   isVisible = await subscribeBtn.isVisible().catch(() => false);
  161 | }
  162 | 
  163 | await expect(subscribeBtn).toBeVisible();
  164 | 
  165 | await Promise.all([
> 166 |   page.waitForURL(/stripe|checkout/, { timeout: 20000 }),
      |        ^ TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
  167 |   subscribeBtn.click(),
  168 | ]);
  169 | 
  170 | // ======================
  171 | // STEP 18: WAIT FOR STRIPE PAGE
  172 | // ======================
  173 | await page.waitForTimeout(6000); // allow stripe to load
  174 | 
  175 | 
  176 | // ======================
  177 | // STEP 19: FILL STRIPE (FINAL WORKING)
  178 | // ======================
  179 | 
  180 | // wait until Stripe form is visible
  181 | await page.waitForSelector('text=Card information');
  182 | 
  183 | // Fill card details using labels (Stripe supported way)
  184 | await page.getByLabel('Card number').fill('4242424242424242');
  185 | await page.locator('input[name="cardExpiry"]').fill('1237');
  186 | await page.locator('input[name="cardCvc"]').fill('123');
  187 | 
  188 | // Name
  189 | await page.locator('input[name="billingName"]').fill('Muhammad Zeeshan');
  190 | 
  191 | // ======================
  192 | // STEP 20: SUBMIT PAYMENT
  193 | // ======================
  194 | const payBtn = page.getByTestId('hosted-payment-submit-button');
  195 | 
  196 | await expect(payBtn).toBeVisible();
  197 | 
  198 | await payBtn.click();
  199 | 
  200 | // wait for success / redirect
  201 | await Promise.race([
  202 |   page.waitForURL(/dashboard/, { timeout: 25000 }),
  203 |   page.waitForURL(/billing/, { timeout: 25000 }),
  204 |   page.waitForURL(/success/, { timeout: 25000 }),
  205 | ]);
  206 | await page.waitForTimeout(2000);
  207 | // force correct state
  208 | if (!page.url().includes('/dashboard')) {
  209 |   await page.goto('/dashboard');
  210 | }
  211 | 
  212 | await page.waitForLoadState('networkidle');
  213 | 
  214 | console.log('💳 Stripe payment flow completed');
  215 | 
  216 | // ======================
  217 | // STEP: OPEN MATURITY SECTION
  218 | // ======================
  219 | 
  220 | // 1. Ensure tab is clicked AFTER render
  221 | const maturityTab = page.getByRole('button', {
  222 |   name: /Your Maturity Stage/i,
  223 | });
  224 | 
  225 | await page.waitForTimeout(1000);
  226 | await maturityTab.waitFor({ state: 'visible', timeout: 15000 });
  227 | await page.waitForTimeout(3000);
  228 | // click tab (this re-renders DOM)
  229 | await maturityTab.click();
  230 | 
  231 | // 2. Wait for tab content to actually mount
  232 | const maturityTitle = page.getByText('Your Maturity Stage');
  233 | await maturityTitle.waitFor({ state: 'visible', timeout: 10000 });
  234 | 
  235 | // 3. Handle collapse state (VERY IMPORTANT)
  236 | const collapseIcon = page.locator('svg').filter({ hasText: '' }).first();
  237 | 
  238 | const isCollapsed = await collapseIcon.evaluate(el =>
  239 |   el.classList.contains('rotate-180')
  240 | ).catch(() => false);
  241 | 
  242 | if (isCollapsed) {
  243 |   await collapseIcon.click();
  244 |   await page.waitForTimeout(500); // allow expand animation
  245 | }
  246 | 
  247 | // ======================
  248 | // STEP: NOW scroll PROPERLY
  249 | // ======================
  250 | 
  251 | const retakeBtn = page.locator('button:has-text("Retake Assessment")');
  252 | 
  253 | // wait for DOM attach AFTER tab switch
  254 | await retakeBtn.waitFor({ state: 'attached', timeout: 15000 });
  255 | 
  256 | // 🔥 critical: scroll AFTER render, not before
  257 | await retakeBtn.scrollIntoViewIfNeeded();
  258 | 
  259 | // ensure visible
  260 | await expect(retakeBtn).toBeVisible({ timeout: 10000 });
  261 | 
  262 | // small stability wait
  263 | await page.waitForTimeout(300);
  264 | 
  265 | await retakeBtn.click();
  266 | 
```