import { Injectable, Inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CreateShoppingListCommand, ShoppingListResponseDto } from '../../../types';
import { SupabaseService } from './supabase.service';
import { AppEnvironment } from '../../app.config';

@Injectable({
  providedIn: 'root',
})
export class ShoppingListService extends SupabaseService {
  constructor(@Inject('APP_ENVIRONMENT') environment: AppEnvironment) {
    super(environment);
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
}
