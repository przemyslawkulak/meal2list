import { Page } from '@playwright/test';

export class NewShoppingListDialog {
  constructor(private page: Page) {}

  // Locators
  private get nameInput() {
    return this.page.getByTestId('new-list-name-input');
  }

  private get createButton() {
    return this.page.getByTestId('create-list-submit-button');
  }

  private get cancelButton() {
    return this.page.getByTestId('new-list-cancel-button');
  }

  // Actions
  async fillListName(name: string) {
    await this.nameInput.fill(name);
  }

  async clickCreate() {
    await this.createButton.click();
  }

  async clickCancel() {
    await this.cancelButton.click();
  }
}
