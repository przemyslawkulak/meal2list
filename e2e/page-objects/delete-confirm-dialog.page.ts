import { Page } from '@playwright/test';

export class DeleteConfirmDialog {
  constructor(private page: Page) {}

  // Locators
  private get confirmButton() {
    return this.page.getByTestId('confirm-delete-button');
  }

  private get cancelButton() {
    return this.page.getByTestId('cancel-delete-button');
  }

  // Actions
  async confirmDelete() {
    await this.confirmButton.click();
  }

  async cancelDelete() {
    await this.cancelButton.click();
  }

  // State checks
  async waitForDialogVisible() {
    await this.confirmButton.waitFor({ state: 'visible' });
  }
}
