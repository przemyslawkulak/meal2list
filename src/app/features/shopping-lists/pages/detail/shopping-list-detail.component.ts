import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnDestroy,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DatePipe, CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CategoryIconComponent } from '@app/shared/category-icon/category-icon.component';
import {
  catchError,
  map,
  of,
  startWith,
  switchMap,
  combineLatest,
  tap,
  takeUntil,
  Subject,
  Observable,
} from 'rxjs';
import { ShoppingListService } from '@app/core/supabase/shopping-list.service';
import { ShoppingListItemsService } from '@app/core/supabase/shopping-list-items.service';
import { CategoryService } from '@app/core/supabase/category.service';
import { CategoryOrderService } from '@app/core/services/category-order.service';
import {
  ShoppingListResponseDto,
  CategoryDto,
  ShoppingListItemResponseDto,
  UpdateShoppingListItemCommand,
} from '@types';
import { HttpErrorResponse } from '@angular/common/http';
import { AddItemDialogComponent } from '../../components/add-item-dialog/add-item-dialog.component';
import {
  EditItemDialogComponent,
  EditItemDialogData,
  UpdatedShoppingListItem,
} from '../../components/edit-item-dialog/edit-item-dialog.component';
import { ProductService } from '@app/core/supabase/product.service';
import { NotificationService } from '@app/shared/services/notification.service';
import { LoggerService } from '@app/shared/services/logger.service';
import { LongPressTooltipDirective } from '@app/shared/long-press-tooltip.directive';

interface RecipeGroup {
  recipeName: string;
  items: ShoppingListItemResponseDto[];
  uncheckedItems: ShoppingListItemResponseDto[];
  checkedItems: ShoppingListItemResponseDto[];
}

interface ShoppingListState {
  loading: boolean;
  data: ShoppingListResponseDto | null;
  categories: CategoryDto[];
  sortedItems: ShoppingListItemResponseDto[];
  uncheckedItems: ShoppingListItemResponseDto[];
  checkedItems: ShoppingListItemResponseDto[];
  groupByRecipe: boolean;
  groupedByRecipeItems: RecipeGroup[];
  allCheckedItemsInGroupedView: ShoppingListItemResponseDto[];
  showBadges: boolean;
}

@Component({
  selector: 'app-shopping-list-detail',
  standalone: true,
  imports: [
    MatCardModule,
    MatListModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    DatePipe,
    CommonModule,
    MatTooltipModule,
    CategoryIconComponent,
    RouterModule,
    LongPressTooltipDirective,
  ],
  templateUrl: './shopping-list-detail.component.html',
  styleUrls: ['./shopping-list-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShoppingListDetailComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly notification = inject(NotificationService);
  private readonly logger = inject(LoggerService);
  private readonly categoryOrderService = inject(CategoryOrderService);

  loading = signal<boolean>(true);
  shoppingList = signal<ShoppingListResponseDto | null>(null);
  categories = signal<CategoryDto[]>([]);
  groupByRecipe = signal<boolean>(false);
  showBadges = signal<boolean>(true);
  readonly deleteAllCheckedLabel = 'Usuń zaznaczone produkty';

  // Computed signal for sorted items - unchecked at top, checked at bottom (sorted by category)
  sortedItems = computed(() => {
    const list = this.shoppingList();
    if (!list?.items) return [];

    // Split items into checked and unchecked
    const uncheckedItems = list.items.filter(item => !item.is_checked);
    const checkedItems = list.items.filter(item => item.is_checked);

    // Sort both groups by category and combine
    return [...this.sortItemsByCategory(uncheckedItems), ...this.sortItemsByCategory(checkedItems)];
  });

  // Computed signal for items grouped by recipe
  groupedByRecipeItems = computed(
    (): { recipeGroups: RecipeGroup[]; allCheckedItems: ShoppingListItemResponseDto[] } => {
      const list = this.shoppingList();
      if (!list?.items) return { recipeGroups: [], allCheckedItems: [] };

      // Group ALL items by recipe_source (both checked and unchecked)
      const grouped = new Map<string, ShoppingListItemResponseDto[]>();

      list.items.forEach(item => {
        const recipeKey = item.recipe_source || 'Ręczne dodanie';
        if (!grouped.has(recipeKey)) {
          grouped.set(recipeKey, []);
        }
        grouped.get(recipeKey)!.push(item);
      });

      // Convert to array and sort each group
      const recipeGroups: RecipeGroup[] = Array.from(grouped.entries())
        .map(([recipeName, allItems]): RecipeGroup => {
          const sortedItems = this.sortItemsByCategory(allItems);
          const uncheckedItems = sortedItems.filter(item => !item.is_checked);
          return {
            recipeName,
            items: sortedItems, // All items (checked + unchecked) for correct count
            uncheckedItems: uncheckedItems, // Only unchecked items to display in group
            checkedItems: [], // Empty - checked items will be shown at bottom
          };
        })
        .filter(group => group.uncheckedItems.length > 0) // Only show groups with unchecked items
        // Sort groups: recipe items first, then manual additions
        .sort((a, b) => {
          // Manual additions go last
          if (a.recipeName === 'Ręczne dodanie' && b.recipeName !== 'Ręczne dodanie') return 1;
          if (a.recipeName !== 'Ręczne dodanie' && b.recipeName === 'Ręczne dodanie') return -1;
          // Otherwise sort alphabetically
          return a.recipeName.localeCompare(b.recipeName);
        });

      return {
        recipeGroups,
        allCheckedItems: this.sortItemsByCategory(list.items.filter(item => item.is_checked)),
      };
    }
  );

  // Computed signals derived from sorted items
  uncheckedItems = computed(() => this.sortedItems().filter(item => !item.is_checked));
  checkedItems = computed(() => this.sortedItems().filter(item => item.is_checked));

  // Combined state for template consumption
  shoppingListState = computed(() => {
    const groupedData = this.groupedByRecipeItems();
    return {
      loading: this.loading(),
      data: this.shoppingList(),
      categories: this.categories(),
      sortedItems: this.sortedItems(),
      uncheckedItems: this.uncheckedItems(),
      checkedItems: this.checkedItems(),
      groupByRecipe: this.groupByRecipe(),
      groupedByRecipeItems: groupedData.recipeGroups as RecipeGroup[],
      allCheckedItemsInGroupedView: groupedData.allCheckedItems,
      showBadges: this.showBadges(),
    };
  });

  constructor(
    private route: ActivatedRoute,
    private shoppingListService: ShoppingListService,
    private shoppingListItemsService: ShoppingListItemsService,
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private productService: ProductService
  ) {
    const shoppingList$ = this.route.params.pipe(
      map(params => params['id']),
      switchMap(id =>
        this.shoppingListService.getShoppingListById(id).pipe(
          map(data => ({ loading: false, data })),
          catchError(error => this.handleError('Error loading shopping list', error)),
          startWith({ loading: true, data: null })
        )
      )
    );

    combineLatest([shoppingList$, this.categoryService.categories$])
      .pipe(
        takeUntil(this.destroy$),
        tap(([shoppingList, categories]) => {
          this.loading.set(shoppingList.loading);
          this.shoppingList.set(shoppingList.data);
          this.categories.set(categories);
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Opens the dialog to add a new item to the shopping list
   */
  openAddItemDialog(): void {
    const currentList = this.shoppingList();
    if (!currentList) return;

    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      width: '100%',
      maxWidth: '600px',
      height: '90vh',
      data: {
        listId: currentList.id,
        categories: this.categories(),
      },
      panelClass: 'add-item-dialog',
    });

    // Get a reference to the component instance
    const componentInstance = dialogRef.componentInstance;

    // Subscribe to items added while the dialog is open
    componentInstance.itemAdded
      .pipe(
        takeUntil(this.destroy$),
        switchMap(newItemData => {
          // Check if product_id is missing
          if (!newItemData.product_id) {
            // Create product first, then add shopping list item
            return this.productService
              .createProduct({
                name: newItemData.productName,
                default_category_id: newItemData.category_id,
                is_common: false,
              })
              .pipe(
                switchMap(createdProduct =>
                  this.shoppingListItemsService.addShoppingListItem({
                    shopping_list_id: currentList.id,
                    product_name: newItemData.productName,
                    quantity: newItemData.quantity,
                    unit: newItemData.unit,
                    category_id: newItemData.category_id,
                    source: 'manual',
                    is_checked: false,
                    product_id: createdProduct.id,
                  })
                )
              );
          } else {
            // Product already exists, just add the shopping list item
            return this.shoppingListItemsService.addShoppingListItem({
              shopping_list_id: currentList.id,
              product_name: newItemData.productName,
              quantity: newItemData.quantity,
              unit: newItemData.unit,
              category_id: newItemData.category_id,
              source: 'manual',
              is_checked: false,
              product_id: newItemData.product_id,
            });
          }
        }),
        map(newItem => ({ newItem })),
        catchError(error => {
          this.handleError('Error adding item:', error);
          return of(null);
        })
      )
      .subscribe(result => {
        if (result) {
          const latestList = this.shoppingList();
          if (!latestList) return;

          const updatedList = {
            ...latestList,
            items: [...(latestList.items || []), result.newItem],
          };
          this.shoppingList.set(updatedList);
        }
      });

    // Also handle items from dialog close
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe();
  }

  /**
   * Sorts items by category using food-first hierarchy
   */
  private sortItemsByCategory(items: ShoppingListItemResponseDto[]): ShoppingListItemResponseDto[] {
    const categories = this.categories();
    return [...items].sort((a, b) => {
      const categoryA = this.getCategoryName(a.category_id, categories);
      const categoryB = this.getCategoryName(b.category_id, categories);

      return this.categoryOrderService.compareCategoryNames(categoryA, categoryB);
    });
  }

  /**
   * Standard error handler for HTTP operations
   */
  private handleError(
    message: string,
    error: HttpErrorResponse
  ): Observable<{ loading: boolean; data: null }> {
    this.logger.logError(error, message);
    this.notification.showError(message);
    return of({ loading: false, data: null });
  }

  getCategoryName(categoryId: string, categories: CategoryDto[]): string {
    return categories.find(cat => cat.id === categoryId)?.name || 'Others';
  }

  toggleItemChecked(itemId: string, currentState: boolean): void {
    const currentList = this.shoppingList();
    if (!currentList?.items) return;

    this.shoppingListItemsService
      .updateShoppingListItem(itemId, { is_checked: !currentState })
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => this.handleError('Error updating item:', error))
      )
      .subscribe(() => {
        this.updateLocalShoppingListItem(itemId, { is_checked: !currentState });
      });
  }

  deleteItem(itemId: string): void {
    const currentList = this.shoppingList();
    if (!currentList?.items) return;

    this.shoppingListItemsService
      .deleteShoppingListItem(itemId)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => this.handleError('Error deleting item:', error))
      )
      .subscribe(() => {
        this.removeItemFromLocalShoppingList(itemId);
      });
  }

  /**
   * Deletes all checked items after confirmation and updates local state
   */
  onDeleteAllChecked(): void {
    const currentList = this.shoppingList();
    if (!currentList?.items) return;
    const checkedIds = this.checkedItems().map(item => item.id);
    if (!checkedIds.length) return;
    this.shoppingListItemsService
      .deleteChecked(currentList.id, checkedIds)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => this.handleError('Error deleting checked items:', error))
      )
      .subscribe(() => {
        const updatedItems = (this.shoppingList()?.items || []).filter(
          item => !checkedIds.includes(item.id)
        );
        this.shoppingList.set({ ...currentList, items: updatedItems });
        this.notification.showSuccess('Deleted checked items successfully');
      });
  }

  /**
   * Updates a shopping list item property in the local state
   */
  private updateLocalShoppingListItem(
    itemId: string,
    updates: Partial<ShoppingListItemResponseDto>
  ): void {
    const currentList = this.shoppingList();
    if (!currentList?.items) return;

    const updatedItems = currentList.items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );

    this.shoppingList.set({ ...currentList, items: updatedItems });
  }

  /**
   * Removes an item from the local shopping list state
   */
  private removeItemFromLocalShoppingList(itemId: string): void {
    const currentList = this.shoppingList();
    if (!currentList?.items) return;

    this.shoppingList.set({
      ...currentList,
      items: currentList.items.filter(item => item.id !== itemId),
    });
  }

  /**
   * Toggles between normal view and grouped by recipe view
   */
  toggleGroupByRecipe(): void {
    this.groupByRecipe.set(!this.groupByRecipe());
  }

  /**
   * Toggles visibility of recipe and source badges
   */
  toggleShowBadges(): void {
    const current = this.showBadges();
    this.showBadges.set(!current);
    this.logger.logInfo('Toggled show badges', `showBadges: ${!current}`);
  }

  /**
   * Opens the dialog to edit an existing item
   */
  openEditItemDialog(item: ShoppingListItemResponseDto): void {
    const currentList = this.shoppingList();
    if (!currentList) return;

    const dialogRef = this.dialog.open(EditItemDialogComponent, {
      width: '100%',
      maxWidth: '600px',
      data: {
        item: { ...item },
        categories: this.categories(),
        listId: currentList.id,
      } as EditItemDialogData,
      panelClass: 'edit-item-dialog',
    });

    dialogRef
      .afterClosed()
      .subscribe(
        (result?: { updates: UpdateShoppingListItemCommand; result: UpdatedShoppingListItem }) => {
          if (result?.updates) {
            // Optimistic update
            this.updateLocalShoppingListItemOptimistic(item.id, result.updates);

            // Send update to server
            this.shoppingListItemsService
              .updateShoppingListItem(item.id, result.updates)
              .pipe(
                takeUntil(this.destroy$),
                switchMap((updatedItem: ShoppingListItemResponseDto) => {
                  // Confirm with server response
                  this.updateLocalShoppingListItem(item.id, updatedItem);
                  this.notification.showSuccess('Item updated successfully');
                  return of(updatedItem);
                }),
                catchError(error => {
                  // Rollback optimistic update on error
                  this.updateLocalShoppingListItem(item.id, item);
                  this.logger.logError(error, 'Error updating item');
                  this.notification.showError('Failed to update item. Please try again.');
                  return of(null);
                })
              )
              .subscribe();
          }
        }
      );
  }

  /**
   * Updates a shopping list item optimistically (for immediate UI feedback)
   */
  private updateLocalShoppingListItemOptimistic(
    itemId: string,
    updates: UpdateShoppingListItemCommand
  ): void {
    const currentList = this.shoppingList();
    if (!currentList?.items) return;

    const updatedItems = currentList.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          ...updates,
          updated_at: new Date().toISOString(), // Optimistic timestamp
        };
      }
      return item;
    });

    this.shoppingList.set({ ...currentList, items: updatedItems });
  }

  /**
   * Get the count of completed items
   */
  getTotalItemsCount(state: ShoppingListState): number {
    if (!state.data?.items) return 0;
    return state.data.items.filter((item: ShoppingListItemResponseDto) => item.is_checked).length;
  }

  /**
   * Get the total count of all items
   */
  getAllItemsCount(state: ShoppingListState): number {
    if (!state.data?.items) return 0;
    return state.data.items.length;
  }

  /**
   * Get the progress percentage
   */
  getProgressPercentage(state: ShoppingListState): number {
    const total = this.getAllItemsCount(state);
    if (total === 0) return 0;
    const completed = this.getTotalItemsCount(state);
    return Math.round((completed / total) * 100);
  }

  /**
   * Check if there's a partial selection in the given items
   */
  hasPartialSelection(items: ShoppingListItemResponseDto[]): boolean {
    if (!items.length) return false;
    const checkedCount = items.filter(item => item.is_checked).length;
    return checkedCount > 0 && checkedCount < items.length;
  }

  /**
   * Toggle all items checked state
   */
  toggleAllItems(items: ShoppingListItemResponseDto[], checked: boolean): void {
    items.forEach(item => {
      if (item.is_checked !== checked) {
        this.toggleItemChecked(item.id, item.is_checked);
      }
    });
  }

  /**
   * Update item quantity with inline editing
   */
  updateItemQuantity(itemId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const quantity = parseFloat(target.value);

    if (!isNaN(quantity) && quantity > 0) {
      const updateCommand: UpdateShoppingListItemCommand = { quantity };
      this.updateLocalShoppingListItemOptimistic(itemId, updateCommand);

      this.shoppingListItemsService
        .updateShoppingListItem(itemId, updateCommand)
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            this.notification.showError('Błąd podczas aktualizacji ilości produktu');
            this.logger.logError(error, 'Error updating item quantity');
            // Revert optimistic update on error
            const currentItem = this.shoppingList()?.items?.find(item => item.id === itemId);
            if (currentItem) {
              target.value = currentItem.quantity.toString();
            }
            return of(null);
          })
        )
        .subscribe();
    }
  }

  /**
   * Update item unit with inline editing
   */
  updateItemUnit(itemId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const unit = target.value.trim();

    if (unit) {
      const updateCommand: UpdateShoppingListItemCommand = { unit };
      this.updateLocalShoppingListItemOptimistic(itemId, updateCommand);

      this.shoppingListItemsService
        .updateShoppingListItem(itemId, updateCommand)
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            this.notification.showError('Błąd podczas aktualizacji jednostki produktu');
            this.logger.logError(error, 'Error updating item unit');
            // Revert optimistic update on error
            const currentItem = this.shoppingList()?.items?.find(item => item.id === itemId);
            if (currentItem && currentItem.unit !== null) {
              target.value = currentItem.unit;
            }
            return of(null);
          })
        )
        .subscribe();
    }
  }

  /**
   * Get the count of completed items in a group
   */
  getCompletedCount(items: ShoppingListItemResponseDto[]): number {
    return items.filter(item => item.is_checked).length;
  }
}
