import { test as setup } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/blog/admin');

  // Pause - log in, get to dashboard, then click Resume in the Inspector
  await page.pause();

  // Save auth state immediately (before any assertions that could fail)
  await page.context().storageState({ path: authFile });
  console.log('Auth state saved successfully!');
});
