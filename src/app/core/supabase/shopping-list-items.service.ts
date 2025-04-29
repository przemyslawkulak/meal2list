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
}
