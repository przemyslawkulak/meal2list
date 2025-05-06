import { Page } from '@playwright/test';

export class ShoppingListsPage {
  constructor(private page: Page) {}

  // Navigation
  async goto() {
    await this.page.goto('/lists');
  }

  // Locators
  private get createNewListButton() {
    return this.page.getByTestId('create-new-list-button');
  }

  private get shoppingListsContainer() {
    return this.page.getByTestId('shopping-lists-container');
  }

  private get confirmDeleteButton() {
    return this.page.getByTestId('confirm-delete-button');
  }

  private getShoppingListItem(id: string) {
    return this.page.getByTestId(`shopping-list-item-${id}`);
  }

  private getShoppingListDetailsLink(id: string) {
    return this.page.getByTestId(`shopping-list-details-link-${id}`);
  }

  private getDeleteListButton(id: string) {
    return this.page.getByTestId(`delete-list-button-${id}`);
  }

  // Actions
  async clickCreateNewList() {
    await this.createNewListButton.click();
  }

  async openListDetails(id: string) {
    await this.getShoppingListDetailsLink(id).click();
  }

  async deleteList(id: string) {
    await this.getDeleteListButton(id).click();
    await this.confirmDeleteButton.click();
  }

  // State checks
  async isListVisible(id: string) {
    return await this.getShoppingListItem(id).isVisible();
  }

  async waitForListsLoaded() {
    await this.shoppingListsContainer.waitFor({ state: 'visible' });
  }

  async getListIdByName(name: string): Promise<string> {
    // First find all list items
    const listItems = this.page.locator('[data-testid^="shopping-list-item-"]');
    const count = await listItems.count();

    // Iterate through items to find matching title
    for (let i = 0; i < count; i++) {
      const item = listItems.nth(i);
      const titleElement = item.locator('.list-item-title');
      const itemTitle = await titleElement.textContent();

      if (itemTitle?.trim() === name) {
        const testId = await item.getAttribute('data-testid');
        return testId?.replace('shopping-list-item-', '') || '';
      }
    }

    return '';
  }

  async hasListWithTitle(title: string): Promise<boolean> {
    const listItems = this.page.locator('[data-testid^="shopping-list-item-"]');
    const count = await listItems.count();

    for (let i = 0; i < count; i++) {
      const item = listItems.nth(i);
      const titleElement = item.locator('.list-item-title');
      const itemTitle = await titleElement.textContent();
      if (itemTitle?.trim() === title) {
        return true;
      }
    }

    return false;
  }
}
