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
} from 'rxjs';
import { ShoppingListService } from '@app/core/supabase/shopping-list.service';
import { ShoppingListItemsService } from '@app/core/supabase/shopping-list-items.service';
import { CategoryService } from '@app/core/supabase/category.service';
import { ShoppingListResponseDto, CategoryDto } from '@types';

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

  // Computed signal for the combined state
  shoppingListState = computed(() => ({
    loading: this.loading(),
    data: this.shoppingList(),
    categories: this.categories(),
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
          catchError(error => {
            console.error('Error loading shopping list:', error);
            return of({ loading: false, data: null });
          }),
          startWith({ loading: true, data: null })
        )
      )
    );

    // Subscribe to data streams and update signals
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

  getCategoryName(categoryId: string, categories: CategoryDto[]): string {
    return categories.find(cat => cat.id === categoryId)?.name || 'Others';
  }

  deleteItem(itemId: string): void {
    const currentList = this.shoppingList();
    if (!currentList?.items) return;

    this.shoppingListItemsService
      .deleteShoppingListItem(itemId)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error deleting item:', error);
          return of(null);
        })
      )
      .subscribe(() => {
        // Update local state by removing the deleted item
        const updatedData: ShoppingListResponseDto = {
          id: currentList.id,
          name: currentList.name,
          recipe_id: currentList.recipe_id,
          created_at: currentList.created_at,
          updated_at: currentList.updated_at,
          items: currentList.items!.filter(item => item.id !== itemId),
        };

        this.shoppingList.set(updatedData);
      });
  }
}
