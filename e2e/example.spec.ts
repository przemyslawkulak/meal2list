import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';

test.describe('Example test suite', () => {
  test('should load the login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.emailInput).toBeVisible();
  });
});
