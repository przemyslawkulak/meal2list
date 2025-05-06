import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  // Navigation
  async goto() {
    await this.page.goto('auth/login');
  }

  // Locators
  private get emailInput() {
    return this.page.getByTestId('email-input');
  }

  private get passwordInput() {
    return this.page.getByTestId('password-input');
  }

  private get loginButton() {
    return this.page.getByTestId('login-button');
  }

  // Actions
  async login(
    email: string = process.env['TEST_USER_EMAIL'] || 'test@example.com',
    password: string = process.env['TEST_USER_PASSWORD'] || 'password123'
  ) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForURL('/lists');
  }
}
