import { Page } from '@playwright/test';

export class ShoppingListDetailPage {
  constructor(private page: Page) {}

  // Navigation
  async goto(id: string) {
    await this.page.goto(`/lists/${id}`);
  }

  // Locators
  private get spinner() {
    return this.page.getByTestId('detail-spinner');
  }

  private get listTitle() {
    return this.page.getByTestId('list-title');
  }

  private get itemsList() {
    return this.page.getByTestId('shopping-list-details-container');
  }

  private getItemCheckbox(itemId: string) {
    return this.page.getByTestId(`item-checkbox-${itemId}`);
  }

  // Actions
  async toggleItem(itemId: string) {
    await this.getItemCheckbox(itemId).click();
  }

  // State checks
  async waitForPageLoaded() {
    // await this.spinner.waitFor({ state: 'hidden' });
    await this.itemsList.waitFor({ state: 'visible' });
  }

  async isItemChecked(itemId: string) {
    const checkbox = this.getItemCheckbox(itemId);
    return await checkbox.isChecked();
  }
}
