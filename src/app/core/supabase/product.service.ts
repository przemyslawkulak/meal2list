import { Injectable, Inject } from '@angular/core';
import { Observable, from, map, catchError, throwError, shareReplay, switchMap } from 'rxjs';
import { SupabaseService } from '@core/supabase/supabase.service';
import type {
  ProductDto,
  CreateProductCommand,
  UpdateProductCommand,
  ProductWithPreferencesDto,
} from '@types';
import { AppEnvironment } from '@app/app.config';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ProductService extends SupabaseService {
  private _products$: Observable<ProductDto[]>;

  constructor(@Inject('APP_ENVIRONMENT') environment: AppEnvironment) {
    super(environment);
    this._products$ = this.getProducts().pipe(shareReplay({ bufferSize: 1, refCount: true }));
    this.products$.subscribe();
  }

  get products$() {
    return this._products$;
  }
  /**
   * Get all products (common + user-specific)
   */
  getProducts(): Observable<ProductDto[]> {
    return this.getUserId().pipe(
      switchMap(userId =>
        from(
          this.supabase
            .from('products')
            .select('id, name, default_category_id, is_common, created_by, created_at')
            .or(`is_common.eq.true,created_by.eq.${userId}`)
        )
      ),
      map(result => {
        if (result.error) throw result.error;
        return result.data as ProductDto[];
      }),
      catchError(error => this.handleError(error, 'Failed to fetch products'))
    );
  }

  /**
   * Get common products only
   */
  getCommonProducts(): Observable<ProductDto[]> {
    return from(
      this.supabase
        .from('products')
        .select('id, name, default_category_id, is_common, created_by, created_at')
        .eq('is_common', true)
    ).pipe(
      map(result => {
        if (result.error) throw result.error;
        return result.data as ProductDto[];
      }),
      catchError(error => this.handleError(error, 'Failed to fetch common products'))
    );
  }

  /**
   * Get user-specific products
   */
  getUserProducts(): Observable<ProductDto[]> {
    return this.getUserId().pipe(
      switchMap(userId =>
        from(
          this.supabase
            .from('products')
            .select('id, name, default_category_id, is_common, created_by, created_at')
            .eq('created_by', userId)
        )
      ),
      map(result => {
        if (result.error) throw result.error;
        return result.data as ProductDto[];
      }),
      catchError(error => this.handleError(error, 'Failed to fetch user products'))
    );
  }

  /**
   * Create new user-specific product
   */
  createProduct(command: CreateProductCommand): Observable<ProductDto> {
    return this.getUserId().pipe(
      switchMap(userId =>
        from(
          this.supabase
            .from('products')
            .insert({
              ...command,
              created_by: userId,
              is_common: false,
            })
            .select('id, name, default_category_id, is_common, created_by, created_at')
            .single()
        )
      ),
      map(result => {
        if (result.error) throw result.error;
        return result.data as ProductDto;
      }),
      catchError(error => this.handleError(error, 'Failed to create product'))
    );
  }

  /**
   * Update user-specific product
   */
  updateProduct(id: string, command: UpdateProductCommand): Observable<ProductDto> {
    return this.getUserId().pipe(
      switchMap(userId =>
        from(
          this.supabase
            .from('products')
            .update(command)
            .eq('id', id)
            .eq('created_by', userId)
            .select('id, name, default_category_id, is_common, created_by, created_at')
            .single()
        )
      ),
      map(result => {
        if (result.error) throw result.error;
        return result.data as ProductDto;
      }),
      catchError(error => this.handleError(error, 'Failed to update product'))
    );
  }

  /**
   * Delete user-specific product
   */
  deleteProduct(id: string): Observable<void> {
    return this.getUserId().pipe(
      switchMap(userId =>
        from(this.supabase.from('products').delete().eq('id', id).eq('created_by', userId))
      ),
      map(result => {
        if (result.error) throw result.error;
      }),
      catchError(error => this.handleError(error, 'Failed to delete product'))
    );
  }

  /**
   * Track product usage
   */
  trackProductUsage(productId: string): Observable<void> {
    return this.getUserId().pipe(
      switchMap(userId =>
        from(
          this.supabase.from('user_products').upsert(
            {
              user_id: userId,
              product_id: productId,
              use_count: 1,
              last_used_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,product_id',
              ignoreDuplicates: false,
            }
          )
        )
      ),
      map(result => {
        if (result.error) throw result.error;
      }),
      catchError(error => this.handleError(error, 'Failed to track product usage'))
    );
  }

  /**
   * Get recently used products with preferences
   */
  getRecentlyUsedProducts(limit: number = 10): Observable<ProductWithPreferencesDto[]> {
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
            .order('last_used_at', { ascending: false })
            .order('use_count', { ascending: false })
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
