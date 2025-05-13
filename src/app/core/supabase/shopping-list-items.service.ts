import { Injectable, Inject } from '@angular/core';
import { from, Observable, map, catchError, throwError } from 'rxjs';
import { SupabaseService } from '@core/supabase/supabase.service';
import type {
  CreateBatchShoppingListItemsCommand,
  ShoppingListItemResponseDto,
} from '../../../types';
import { AppEnvironment } from '@app/app.config';
import { batchShoppingListItemsSchema } from '@schemas/shopping-list-item.schema';

@Injectable({
  providedIn: 'root',
})
export class ShoppingListItemsService extends SupabaseService {
  constructor(@Inject('APP_ENVIRONMENT') environment: AppEnvironment) {
    super(environment);
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

    const itemsWithListId = items.map(item => ({
      ...item,
      shopping_list_id: listId,
      is_checked: false,
    }));

    return from(
      this.supabase
        .from('shopping_list_items')
        .insert(itemsWithListId)
        .select('id, product_name, quantity, unit, is_checked, category_id, created_at, updated_at')
    ).pipe(
      map(result => {
        if (result.error) throw result.error;
        return result.data as ShoppingListItemResponseDto[];
      }),
      catchError(error => {
        console.error('Error adding items to shopping list:', error);
        return throwError(() => ({
          message: 'Failed to add items to shopping list',
          statusCode: error?.code === '23505' ? 409 : 500,
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
    is_checked: boolean;
  }): Observable<ShoppingListItemResponseDto> {
    const itemWithSource = {
      ...item,
      source: 'manual' as const,
    };

    return from(
      this.supabase
        .from('shopping_list_items')
        .insert(itemWithSource)
        .select('id, product_name, quantity, unit, is_checked, category_id, created_at, updated_at')
        .single()
    ).pipe(
      map(result => {
        if (result.error) throw result.error;
        return result.data as ShoppingListItemResponseDto;
      }),
      catchError(error => {
        console.error('Error adding item to shopping list:', error);
        return throwError(() => ({
          message: 'Failed to add item to shopping list',
          statusCode: error?.code === '23505' ? 409 : 500,
          error,
        }));
      })
    );
  }

  updateShoppingListItem(
    itemId: string,
    updates: Partial<ShoppingListItemResponseDto>
  ): Observable<ShoppingListItemResponseDto> {
    return from(
      this.supabase
        .from('shopping_list_items')
        .update(updates)
        .eq('id', itemId)
        .select('id, product_name, quantity, unit, is_checked, category_id, created_at, updated_at')
        .single()
    ).pipe(
      map(result => {
        if (result.error) throw result.error;
        return result.data as ShoppingListItemResponseDto;
      }),
      catchError(error => {
        console.error('Error updating shopping list item:', error);
        return throwError(() => ({
          message: 'Failed to update shopping list item',
          statusCode: 500,
          error,
        }));
      })
    );
  }

  deleteShoppingListItem(itemId: string): Observable<void> {
    return from(this.supabase.from('shopping_list_items').delete().eq('id', itemId)).pipe(
      map(result => {
        if (result.error) throw result.error;
        return;
      }),
      catchError(error => {
        console.error('Error deleting shopping list item:', error);
        return throwError(() => new Error('Failed to delete shopping list item'));
      })
    );
  }
}
