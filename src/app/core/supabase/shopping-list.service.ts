import { Injectable, Inject } from '@angular/core';
import { Observable, map, catchError, of, switchMap } from 'rxjs';
import {
  CreateShoppingListCommand,
  ShoppingListResponseDto,
  UpdateShoppingListCommand,
} from '@types';
import { SupabaseService } from '@core/supabase/supabase.service';
import { AppEnvironment } from '@app/app.config';

@Injectable({
  providedIn: 'root',
})
export class ShoppingListService extends SupabaseService {
  constructor(@Inject('APP_ENVIRONMENT') environment: AppEnvironment) {
    super(environment);
  }

  getShoppingLists(): Observable<ShoppingListResponseDto[]> {
    return this.getUserId().pipe(
      switchMap(userId =>
        this.supabase
          .from('shopping_lists')
          .select(
            `
            id,
            name,
            recipe_id,
            created_at,
            updated_at,
            user_id,
            items:shopping_list_items(
              id,
              product_name,
              quantity,
              unit,
              is_checked,
              category_id,
              source,
              recipe_source,
              created_at,
              updated_at
            )
          `
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
      ),
      map(result => {
        if (result.error) throw result.error;
        return result.data as ShoppingListResponseDto[];
      }),
      catchError(error => {
        this.logger.logError(error, 'Error fetching shopping lists');
        this.notification.showError('Failed to load shopping lists');
        return of([]);
      })
    );
  }

  createShoppingList(command: CreateShoppingListCommand): Observable<ShoppingListResponseDto> {
    return this.getUserId().pipe(
      switchMap(userId =>
        this.supabase
          .from('shopping_lists')
          .insert([
            {
              name: command.name,
              recipe_id: command.recipe_id || null,
              user_id: userId,
            },
          ])
          .select('id, name, recipe_id, created_at, updated_at, user_id')
          .single()
      ),
      map(result => {
        if (result.error) throw result.error;
        return result.data;
      }),
      catchError(error => this.handleServiceError(error, 'Failed to create shopping list'))
    );
  }

  deleteShoppingList(id: string): Observable<void> {
    return this.getUserId().pipe(
      switchMap(userId =>
        this.supabase.from('shopping_lists').delete().eq('id', id).eq('user_id', userId)
      ),
      map(result => {
        if (result.error) throw result.error;
        return;
      }),
      catchError(error => this.handleServiceError(error, 'Failed to delete shopping list'))
    );
  }

  updateShoppingList(
    id: string,
    updates: UpdateShoppingListCommand
  ): Observable<ShoppingListResponseDto> {
    return this.getUserId().pipe(
      switchMap(userId =>
        this.supabase
          .from('shopping_lists')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId)
          .select('id, name, recipe_id, created_at, updated_at, user_id')
          .single()
      ),
      map(result => {
        if (result.error) throw result.error;
        return result.data;
      }),
      catchError(error => this.handleServiceError(error, 'Failed to update shopping list'))
    );
  }

  getShoppingListById(listId: string): Observable<ShoppingListResponseDto | null> {
    return this.getUserId().pipe(
      switchMap(userId =>
        this.supabase
          .from('shopping_lists')
          .select(
            `
            id,
            name,
            recipe_id,
            created_at,
            updated_at,
            user_id,
            items:shopping_list_items(
              id,
              product_name,
              quantity,
              unit,
              is_checked,
              category_id,
              source,
              recipe_source,
              created_at,
              updated_at
            )
          `
          )
          .eq('id', listId)
          .eq('user_id', userId)
          .single()
      ),
      map(result => {
        if (result.error) throw result.error;
        if (!result.data) return null;
        return result.data as ShoppingListResponseDto;
      }),
      catchError(error => {
        this.logger.logError(error, 'Error fetching shopping list');
        this.notification.showError('Failed to load shopping list');
        return of(null);
      })
    );
  }
}
