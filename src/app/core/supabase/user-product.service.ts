import { Injectable, Inject } from '@angular/core';
import { Observable, from, map, catchError, throwError, switchMap, shareReplay } from 'rxjs';
import { SupabaseService } from '@core/supabase/supabase.service';
import type { UserProductDto, UpdateUserProductCommand } from '@types';
import { AppEnvironment } from '@app/app.config';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UserProductService extends SupabaseService {
  private userProducts$ = this.getUserProductPreferences().pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(@Inject('APP_ENVIRONMENT') environment: AppEnvironment) {
    super(environment);
  }

  /**
   * Get user's product preferences
   */
  getUserProductPreferences(): Observable<UserProductDto[]> {
    return this.getUserId().pipe(
      switchMap(userId =>
        from(
          this.supabase
            .from('user_products')
            .select(
              'id, user_id, product_id, preferred_category_id, last_used_at, use_count, created_at'
            )
            .eq('user_id', userId)
        )
      ),
      map(result => {
        if (result.error) throw result.error;
        return result.data as UserProductDto[];
      }),
      catchError(error => this.handleError(error, 'Failed to fetch user product preferences'))
    );
  }

  /**
   * Update user's product preference
   */
  updateUserProductPreference(
    productId: string,
    command: UpdateUserProductCommand
  ): Observable<UserProductDto> {
    return this.getUserId().pipe(
      switchMap(userId =>
        from(
          this.supabase
            .from('user_products')
            .update(command)
            .eq('user_id', userId)
            .eq('product_id', productId)
            .select(
              'id, user_id, product_id, preferred_category_id, last_used_at, use_count, created_at'
            )
            .single()
        )
      ),
      map(result => {
        if (result.error) throw result.error;
        return result.data as UserProductDto;
      }),
      catchError(error => this.handleError(error, 'Failed to update user product preference'))
    );
  }

  /**
   * Get user's recently used products
   */
  getRecentlyUsedProducts(limit: number = 10): Observable<UserProductDto[]> {
    return this.getUserId().pipe(
      switchMap(userId =>
        from(
          this.supabase
            .from('user_products')
            .select(
              'id, user_id, product_id, preferred_category_id, last_used_at, use_count, created_at'
            )
            .eq('user_id', userId)
            .order('last_used_at', { ascending: false })
            .limit(limit)
        )
      ),
      map(result => {
        if (result.error) throw result.error;
        return result.data as UserProductDto[];
      }),
      catchError(error => this.handleError(error, 'Failed to fetch recently used products'))
    );
  }

  private handleError(error: HttpErrorResponse, message: string): Observable<never> {
    console.error(message, error);
    return throwError(() => ({
      message: error.message || message,
      statusCode: error.status === 409 ? 409 : 500,
      error,
    }));
  }
}
