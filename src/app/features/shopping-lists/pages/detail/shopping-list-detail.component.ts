import { Component, ChangeDetectionStrategy, signal, computed, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CategoryIconComponent } from '@app/shared/ui/category-icon/category-icon.component';
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
import { ShoppingListResponseDto, CategoryDto, ShoppingListItemResponseDto } from '@types';
import { HttpErrorResponse } from '@angular/common/http';

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
    DatePipe,
    MatTooltipModule,
    CategoryIconComponent,
  ],
  templateUrl: './shopping-list-detail.component.html',
  styleUrls: ['./shopping-list-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShoppingListDetailComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  loading = signal<boolean>(true);
  shoppingList = signal<ShoppingListResponseDto | null>(null);
  categories = signal<CategoryDto[]>([]);

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

  // Computed signals derived from sorted items
  uncheckedItems = computed(() => this.sortedItems().filter(item => !item.is_checked));
  checkedItems = computed(() => this.sortedItems().filter(item => item.is_checked));

  // Combined state for template consumption
  shoppingListState = computed(() => ({
    loading: this.loading(),
    data: this.shoppingList(),
    categories: this.categories(),
    sortedItems: this.sortedItems(),
    uncheckedItems: this.uncheckedItems(),
    checkedItems: this.checkedItems(),
  }));

  constructor(
    private route: ActivatedRoute,
    private shoppingListService: ShoppingListService,
    private shoppingListItemsService: ShoppingListItemsService,
    private categoryService: CategoryService
  ) {
    const shoppingList$ = this.route.params.pipe(
      map(params => params['id']),
      switchMap(id =>
        this.shoppingListService.getShoppingListById(id).pipe(
          map(data => ({ loading: false, data })),
          catchError(error => this.handleError('Error loading shopping list:', error)),
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
    console.error(message, error);
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
}
