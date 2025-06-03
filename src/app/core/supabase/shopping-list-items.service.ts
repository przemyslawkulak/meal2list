import { Injectable, Inject } from '@angular/core';
import { from, Observable, map, catchError, throwError, switchMap, of, forkJoin } from 'rxjs';
import { SupabaseService } from '@core/supabase/supabase.service';
import type {
  CreateBatchShoppingListItemsCommand,
  ShoppingListItemResponseDto,
  CategoryDto,
  ShoppingListResponseDto,
  UpdateShoppingListItemCommand,
} from '../../../types';
import { AppEnvironment } from '@app/app.config';
import {
  batchShoppingListItemsSchema,
  updateShoppingListItemSchema,
} from '@schemas/shopping-list-item.schema';
import { CategoryService } from './category.service';
import { DEFAULT_CATEGORY_NAMES } from '@app/shared/mocks/defaults.mock';
import { shareReplay, take } from 'rxjs/operators';
import { ShoppingListService } from './shopping-list.service';

@Injectable({
  providedIn: 'root',
})
export class ShoppingListItemsService extends SupabaseService {
  private categories$: Observable<CategoryDto[]>;
  private shoppingLists$: Observable<ShoppingListResponseDto[]>;

  constructor(
    @Inject('APP_ENVIRONMENT') environment: AppEnvironment,
    private categoryService: CategoryService,
    private shoppingListService: ShoppingListService
  ) {
    super(environment);
    this.categories$ = this.categoryService.categories$;
    this.shoppingLists$ = this.shoppingListService
      .getShoppingLists()
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }

  private verifyListOwnership(listId: string): Observable<void> {
    return this.shoppingLists$.pipe(
      map(lists => {
        if (!lists.some(l => l.id === listId)) {
          throw new Error('Shopping list not found or access denied');
        }
      }),
      take(1)
    );
  }

  private getDefaultCategoryId(): Observable<string> {
    return this.categories$.pipe(
      map(categories => {
        const defaultCategory = categories.find(
          category => category.name === DEFAULT_CATEGORY_NAMES.DEFAULT_CATEGORY
        );
        if (!defaultCategory) {
          throw new Error('Default category not found');
        }
        return defaultCategory.id;
      })
    );
  }

  private verifyCategoryExists(categoryId: string): Observable<boolean> {
    return this.categories$.pipe(
      map(categories => categories.some(category => category.id === categoryId))
    );
  }

  addItemsToShoppingList(
    listId: string,
    items: CreateBatchShoppingListItemsCommand
  ): Observable<ShoppingListItemResponseDto[]> {
    const validationResult = batchShoppingListItemsSchema.safeParse(items);
    if (!validationResult.success) {
      console.error('Invalid input data', validationResult.error.format());
      return throwError(() => ({
        message: 'Invalid input data',
        statusCode: 400,
        errors: validationResult.error.format(),
      }));
    }

    return this.verifyListOwnership(listId).pipe(
      switchMap(() => this.getDefaultCategoryId()),
      switchMap(defaultCategoryId => {
        const itemsWithListId = items.map(item => ({
          ...item,
          shopping_list_id: listId,
          is_checked: false,
          category_id: item.category_id || defaultCategoryId,
        }));

        // Verify all category IDs exist using forkJoin
        const uniqueCategoryIds = [...new Set(itemsWithListId.map(item => item.category_id))];
        const categoryVerifications = uniqueCategoryIds.map(id => this.verifyCategoryExists(id));

        return forkJoin(categoryVerifications).pipe(
          map(results => {
            const invalidCategories = results.some(exists => !exists);
            if (invalidCategories) {
              throw new Error('One or more category IDs are invalid');
            }
            return itemsWithListId;
          })
        );
      }),
      switchMap(itemsWithListId =>
        this.supabase
          .from('shopping_list_items')
          .insert(itemsWithListId)
          .select(
            'id, product_name, quantity, unit, is_checked, category_id, product_id, generation_id, source, recipe_source, created_at, updated_at'
          )
      ),
      map(result => {
        if (result.error) throw result.error;
        return result.data as ShoppingListItemResponseDto[];
      }),
      catchError(error => {
        console.error('Error adding items to shopping list:', error);
        return throwError(() => ({
          message:
            error.message === 'Shopping list not found or access denied'
              ? error.message
              : error.message === 'One or more category IDs are invalid'
                ? error.message
                : error.message === 'Default category not found'
                  ? 'System configuration error: Default category not found'
                  : 'Failed to add items to shopping list',
          statusCode:
            error.message === 'Shopping list not found or access denied'
              ? 403
              : error.message === 'One or more category IDs are invalid'
                ? 400
                : error.message === 'Default category not found'
                  ? 500
                  : error?.code === '23505'
                    ? 409
                    : 500,
          error,
        }));
      })
    );
  }

  /**
   * Add a single item to a shopping list
   */
  addShoppingListItem(item: {
    shopping_list_id: string;
    product_name: string;
    quantity: number;
    unit: string;
    category_id: string;
    source: 'auto' | 'manual' | 'modified';
    is_checked: boolean;
    product_id?: string;
    recipe_source?: string;
  }): Observable<ShoppingListItemResponseDto> {
    return this.verifyListOwnership(item.shopping_list_id).pipe(
      switchMap(() =>
        item.category_id
          ? this.verifyCategoryExists(item.category_id).pipe(
              switchMap(exists => (exists ? of(item.category_id) : this.getDefaultCategoryId()))
            )
          : this.getDefaultCategoryId()
      ),
      switchMap(categoryId => {
        const itemWithSource = {
          ...item,
          category_id: categoryId,
          source: 'manual' as const,
        };

        return this.supabase
          .from('shopping_list_items')
          .insert(itemWithSource)
          .select(
            'id, product_name, quantity, unit, is_checked, category_id, product_id, generation_id, source, recipe_source, created_at, updated_at'
          )
          .single();
      }),
      map(result => {
        if (result.error) throw result.error;
        return result.data as ShoppingListItemResponseDto;
      }),
      catchError(error => {
        console.error('Error adding item to shopping list:', error);
        return throwError(() => ({
          message:
            error.message === 'Shopping list not found or access denied'
              ? error.message
              : error.message === 'Default category not found'
                ? 'System configuration error: Default category not found'
                : 'Failed to add item to shopping list',
          statusCode:
            error.message === 'Shopping list not found or access denied'
              ? 403
              : error.message === 'Default category not found'
                ? 500
                : error?.code === '23505'
                  ? 409
                  : 500,
          error,
        }));
      })
    );
  }

  updateShoppingListItem(
    itemId: string,
    updates: UpdateShoppingListItemCommand
  ): Observable<ShoppingListItemResponseDto> {
    const validationResult = updateShoppingListItemSchema.safeParse(updates);
    if (!validationResult.success) {
      console.error('Invalid input data', validationResult.error.format());
      return throwError(() => ({
        message: 'Invalid input data',
        statusCode: 400,
        errors: validationResult.error.format(),
      }));
    }

    return from(
      this.supabase
        .from('shopping_list_items')
        .select('shopping_list_id, source')
        .eq('id', itemId)
        .single()
    ).pipe(
      switchMap(result => {
        if (result.error) throw result.error;
        if (!result.data) throw new Error('Item not found');

        const currentSource = result.data.source;
        return this.verifyListOwnership(result.data.shopping_list_id).pipe(
          map(() => currentSource)
        );
      }),
      switchMap(currentSource => {
        // If category_id is being updated, verify it exists
        if (updates.category_id) {
          return this.verifyCategoryExists(updates.category_id).pipe(
            switchMap(exists => {
              if (!exists) {
                return this.getDefaultCategoryId().pipe(
                  map(defaultId => ({ ...updates, category_id: defaultId }))
                );
              }
              return of(updates);
            }),
            map(validatedUpdates => ({ validatedUpdates, currentSource }))
          );
        }
        return of({ validatedUpdates: updates, currentSource });
      }),
      switchMap(({ validatedUpdates, currentSource }) => {
        // Set source to 'modified' if updating content fields and current source is not 'manual'
        const contentFields = ['product_name', 'quantity', 'unit', 'category_id'];
        const isContentUpdate = contentFields.some(field => field in validatedUpdates);

        const finalUpdates = {
          ...validatedUpdates,
          ...(isContentUpdate && currentSource !== 'manual' ? { source: 'modified' as const } : {}),
        };

        return this.supabase
          .from('shopping_list_items')
          .update(finalUpdates)
          .eq('id', itemId)
          .select(
            'id, product_name, quantity, unit, is_checked, category_id, product_id, generation_id, source, recipe_source, created_at, updated_at'
          )
          .single();
      }),
      map(result => {
        if (result.error) throw result.error;
        return result.data as ShoppingListItemResponseDto;
      }),
      catchError(error => {
        console.error('Error updating shopping list item:', error);
        return throwError(() => ({
          message:
            error.message === 'Shopping list not found or access denied'
              ? error.message
              : error.message === 'Item not found'
                ? 'Shopping list item not found'
                : error.message === 'Default category not found'
                  ? 'System configuration error: Default category not found'
                  : 'Failed to update shopping list item',
          statusCode:
            error.message === 'Shopping list not found or access denied'
              ? 403
              : error.message === 'Item not found'
                ? 404
                : error.message === 'Default category not found'
                  ? 500
                  : error?.code === '23505'
                    ? 409
                    : 500,
          error,
        }));
      })
    );
  }

  deleteShoppingListItem(itemId: string): Observable<void> {
    return from(
      this.supabase.from('shopping_list_items').select('shopping_list_id').eq('id', itemId).single()
    ).pipe(
      switchMap(result => {
        if (result.error) throw result.error;
        if (!result.data) throw new Error('Item not found');
        return this.verifyListOwnership(result.data.shopping_list_id);
      }),
      switchMap(() => this.supabase.from('shopping_list_items').delete().eq('id', itemId)),
      map(result => {
        if (result.error) throw result.error;
        return;
      }),
      catchError(error => {
        console.error('Error deleting shopping list item:', error);
        return throwError(() => ({
          message:
            error.message === 'Shopping list not found or access denied'
              ? error.message
              : 'Failed to delete shopping list item',
          statusCode: error.message === 'Shopping list not found or access denied' ? 403 : 500,
          error,
        }));
      })
    );
  }
}
