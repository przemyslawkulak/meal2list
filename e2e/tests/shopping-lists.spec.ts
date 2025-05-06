import { test, expect, Page } from '@playwright/test';
import { ShoppingListsPage } from '../page-objects/shopping-lists.page';
import { ShoppingListDetailPage } from '../page-objects/shopping-list-detail.page';
import { NewShoppingListDialog } from 'e2e/page-objects/new-shopping-list.dialog';
import { LoginPage } from 'e2e/page-objects/login.page';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

test.describe('Shopping Lists Feature', () => {
  let shoppingListsPage: ShoppingListsPage;
  let loginPage: LoginPage;
  let newListDialog: NewShoppingListDialog;
  let listDetailPage: ShoppingListDetailPage;
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    shoppingListsPage = new ShoppingListsPage(page);
    loginPage = new LoginPage(page);
    newListDialog = new NewShoppingListDialog(page);
    listDetailPage = new ShoppingListDetailPage(page);

    // Login before each test
    await loginPage.goto();
    await loginPage.login();
  });

  test('complete shopping list workflow', async () => {
    // 1. Navigate to shopping lists page
    await shoppingListsPage.goto();
    await shoppingListsPage.waitForListsLoaded();

    // 2. Create new list
    await shoppingListsPage.clickCreateNewList();

    // 3. Fill list name
    await newListDialog.fillListName('test-list');

    // 4. Create list
    await newListDialog.clickCreate();
    await page.waitForTimeout(200);

    // Verify list was created
    await expect(await shoppingListsPage.hasListWithTitle('test-list')).toBeTruthy();

    // Get list ID for further operations
    const listId = await shoppingListsPage.getListIdByName('test-list');
    console.log('listId', listId);

    // 5. Open list details
    await shoppingListsPage.openListDetails(listId);
    await listDetailPage.waitForPageLoaded();

    // 6. Navigate back to lists
    await shoppingListsPage.goto();
    await shoppingListsPage.waitForListsLoaded();

    // 7. Delete list
    await shoppingListsPage.deleteList(listId);
    await page.waitForTimeout(200);

    await expect(await shoppingListsPage.isListVisible(listId)).toBeFalsy();
  });
});
