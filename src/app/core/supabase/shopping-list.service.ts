import { Injectable, Inject } from '@angular/core';
import { Observable, from, map, catchError, throwError, of } from 'rxjs';
import { CreateShoppingListCommand, ShoppingListResponseDto } from '@types';
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
    return from(
      this.supabase
        .from('shopping_lists')
        .select('id, name, recipe_id, created_at, updated_at')
        .order('created_at', { ascending: false })
    ).pipe(
      map(result => {
        if (result.error) throw result.error;
        return result.data as ShoppingListResponseDto[];
      }),
      catchError(error => {
        console.error('Error fetching shopping lists:', error);
        return of([]);
      })
    );
  }

  createShoppingList(command: CreateShoppingListCommand): Observable<ShoppingListResponseDto> {
    return from(
      this.supabase
        .from('shopping_lists')
        .insert([
          {
            name: command.name,
            recipe_id: command.recipe_id || null,
          },
        ])
        .select('id, name, recipe_id, created_at, updated_at')
        .single()
    ).pipe(
      map(result => {
        if (result.error) throw result.error;
        return result.data;
      }),
      catchError(error => {
        console.error('Error creating shopping list:', error);
        return throwError(() => new Error('Failed to create shopping list'));
      })
    );
  }

  deleteShoppingList(id: string): Observable<void> {
    return from(this.supabase.from('shopping_lists').delete().eq('id', id)).pipe(
      map(result => {
        if (result.error) throw result.error;
        return;
      }),
      catchError(error => {
        console.error('Error deleting shopping list:', error);
        return throwError(() => new Error('Failed to delete shopping list'));
      })
    );
  }

  getShoppingListById(listId: string): Observable<ShoppingListResponseDto | null> {
    return from(
      this.supabase
        .from('shopping_lists')
        .select(
          `
          id,
          name,
          recipe_id,
          created_at,
          updated_at,
          items:shopping_list_items(
            id,
            product_name,
            quantity,
            unit,
            is_checked,
            category_id,
            created_at,
            updated_at
          )
        `
        )
        .eq('id', listId)
        .single()
    ).pipe(
      map(result => {
        if (result.error) throw result.error;
        if (!result.data) return null;
        return result.data as ShoppingListResponseDto;
      }),
      catchError(error => {
        console.error('Error fetching shopping list:', error);
        return of(null);
      })
    );
  }
}
