import { Injectable, Inject } from '@angular/core';
import { Observable, from, map, catchError, switchMap, shareReplay } from 'rxjs';
import { SupabaseService } from '@core/supabase/supabase.service';
import type { UserProductDto, ProductWithPreferencesDto, ProductDto } from '@types';
import { AppEnvironment } from '@app/app.config';

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
      catchError(error =>
        this.handleServiceError(error, 'Failed to fetch user product preferences')
      )
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
      catchError(error => this.handleServiceError(error, 'Failed to fetch recently used products'))
    );
  }

  /**
   * Track product usage - increment use_count for existing entries or create new with use_count 1
   */
  trackProductUsage(productId: string): Observable<void> {
    return this.getUserId().pipe(
      switchMap(userId =>
        // First check if record exists
        from(
          this.supabase
            .from('user_products')
            .select('use_count')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .maybeSingle()
        ).pipe(
          switchMap(result => {
            if (result.error) throw result.error;

            const existingRecord = result.data;
            const currentUseCount = existingRecord?.use_count || 0;

            return from(
              this.supabase.from('user_products').upsert(
                {
                  user_id: userId,
                  product_id: productId,
                  use_count: currentUseCount + 1,
                  last_used_at: new Date().toISOString(),
                },
                {
                  onConflict: 'user_id,product_id',
                  ignoreDuplicates: false,
                }
              )
            );
          })
        )
      ),
      map(result => {
        if (result.error) throw result.error;
        console.log(`Product usage tracked for ${productId}`);
      }),
      catchError(error => this.handleServiceError(error, 'Failed to track product usage'))
    );
  }

  /**
   * Get most used products based on use_count
   */
  getMostUsedProducts(limit: number = 20): Observable<ProductWithPreferencesDto[]> {
    return this.getUserId().pipe(
      switchMap(userId =>
        from(
          this.supabase
            .from('user_products')
            .select(
              `
              product_id,
              preferred_category_id,
              last_used_at,
              use_count,
              products (
                id,
                name,
                default_category_id,
                is_common,
                created_by,
                created_at
              )
            `
            )
            .eq('user_id', userId)
            .gt('use_count', 0)
            .order('use_count', { ascending: false })
            .order('last_used_at', { ascending: false })
            .limit(limit)
        )
      ),
      map(result => {
        if (result.error) throw result.error;
        return result.data.map(row => ({
          ...(row.products as ProductDto),
          preferred_category_id: row.preferred_category_id,
          last_used_at: row.last_used_at,
          use_count: row.use_count,
        }));
      }),
      catchError(error => this.handleServiceError(error, 'Failed to fetch most used products'))
    );
  }
}
