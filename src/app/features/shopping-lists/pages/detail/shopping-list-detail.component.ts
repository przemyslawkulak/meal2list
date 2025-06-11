import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnDestroy,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  ],
  templateUrl: './shopping-list-detail.component.html',
  styleUrls: ['./shopping-list-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShoppingListDetailComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly notification = inject(NotificationService);
  private readonly logger = inject(LoggerService);

  loading = signal<boolean>(true);
  shoppingList = signal<ShoppingListResponseDto | null>(null);
  categories = signal<CategoryDto[]>([]);
  groupByRecipe = signal<boolean>(false);
  showBadges = signal<boolean>(true);

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
  groupedByRecipeItems = computed(() => {
    const list = this.shoppingList();
    if (!list?.items) return { recipeGroups: [], allCheckedItems: [] };

    // Split all items into checked and unchecked
    const uncheckedItems = list.items.filter(item => !item.is_checked);
    const checkedItems = list.items.filter(item => item.is_checked);

    // Group only unchecked items by recipe_source
    const grouped = new Map<string, ShoppingListItemResponseDto[]>();

    uncheckedItems.forEach(item => {
      const recipeKey = item.recipe_source || 'Ręczne dodanie';
      if (!grouped.has(recipeKey)) {
        grouped.set(recipeKey, []);
      }
      grouped.get(recipeKey)!.push(item);
    });

    // Convert to array and sort each group
    const recipeGroups = Array.from(grouped.entries())
      .map(([recipeName, items]) => ({
        recipeName,
        items: this.sortItemsByCategory(items),
        uncheckedItems: items, // All items in groups are unchecked now
        checkedItems: [] as ShoppingListItemResponseDto[], // Empty since checked items are separate
      }))
      // Sort groups: recipe items first, then manual additions
      .sort((a, b) => {
        // If both are manual additions or both are recipes, sort alphabetically
        if ((a.recipeName === 'Ręczne dodanie') === (b.recipeName === 'Ręczne dodanie')) {
          return a.recipeName.localeCompare(b.recipeName);
        }
        // Manual additions go last
        if (a.recipeName === 'Ręczne dodanie') return 1;
        if (b.recipeName === 'Ręczne dodanie') return -1;
        return 0;
      });

    return {
      recipeGroups,
      allCheckedItems: this.sortItemsByCategory(checkedItems),
    };
  });

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
      groupedByRecipeItems: groupedData.recipeGroups,
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
    dialogRef.afterClosed().subscribe();
  }

  /**
   * Sorts items by category with 'Others' always at the end
   */
  private sortItemsByCategory(items: ShoppingListItemResponseDto[]): ShoppingListItemResponseDto[] {
    const categories = this.categories();
    return [...items].sort((a, b) => {
      const categoryA = this.getCategoryName(a.category_id, categories);
      const categoryB = this.getCategoryName(b.category_id, categories);

      // Handle 'Others' case to sort it last
      if (categoryA === 'Others' && categoryB !== 'Others') return 1;
      if (categoryA !== 'Others' && categoryB === 'Others') return -1;

      return categoryA.localeCompare(categoryB);
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
    this.showBadges.set(!this.showBadges());
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
}
