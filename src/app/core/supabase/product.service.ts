import { Injectable, Inject } from '@angular/core';
import { Observable, from, map, catchError, throwError, switchMap } from 'rxjs';
import { SupabaseService } from '@core/supabase/supabase.service';
import type {
  ProductDto,
  CreateProductCommand,
  UpdateProductCommand,
  ProductWithPreferencesDto,
  CategoryDto,
} from '@types';
import { AppEnvironment } from '@app/app.config';
import { CategoryService } from '@core/supabase/category.service';
import { DEFAULT_CATEGORY_NAMES } from '@app/shared/mocks/defaults.mock';

@Injectable({
  providedIn: 'root',
})
export class ProductService extends SupabaseService {
  // private _products$: Observable<ProductDto[]>;

  constructor(
    @Inject('APP_ENVIRONMENT') environment: AppEnvironment,
    private categoryService: CategoryService
  ) {
    super(environment);
  }

  /**
   * Get all products (common + user-specific)
   */
  getProducts(): Observable<ProductDto[]> {
    return this.getUserId().pipe(
      switchMap(userId => {
        if (!userId) {
          return throwError(() => new Error('User ID not available'));
        }
        return from(
          this.supabase
            .from('products')
            .select('id, name, default_category_id, is_common, created_by, created_at')
            .or(`is_common.eq.true,created_by.eq.${userId}`)
            .limit(2000)
        );
      }),
      map(result => {
        if (result.error) throw result.error;
        return result.data as ProductDto[];
      }),
      switchMap(products =>
        this.categoryService.categories$.pipe(
          map(categories => this.sortProductsByCategory(products, categories))
        )
      ),
      catchError(error => this.handleServiceError(error, 'Failed to fetch products'))
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
      catchError(error => this.handleServiceError(error, 'Failed to fetch common products'))
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
      catchError(error => this.handleServiceError(error, 'Failed to fetch user products'))
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
      catchError(error => this.handleServiceError(error, 'Failed to create product'))
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
      catchError(error => this.handleServiceError(error, 'Failed to update product'))
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
      catchError(error => this.handleServiceError(error, 'Failed to delete product'))
    );
  }

  /**
   * Sort products by category, with "Others" category at the end
   */
  private sortProductsByCategory<T extends ProductDto>(
    products: T[],
    categories: CategoryDto[]
  ): T[] {
    return [...products].sort((a, b) => {
      const getCategoryName = (categoryId: string) =>
        categories.find(category => category.id === categoryId)?.name ||
        DEFAULT_CATEGORY_NAMES.DEFAULT_CATEGORY;

      const categoryA = getCategoryName(
        'preferred_category_id' in a
          ? (a as ProductWithPreferencesDto).preferred_category_id || a.default_category_id
          : a.default_category_id
      );
      const categoryB = getCategoryName(
        'preferred_category_id' in b
          ? (b as ProductWithPreferencesDto).preferred_category_id || b.default_category_id
          : b.default_category_id
      );

      // Handle 'Others' case to sort it last
      if (
        categoryA === DEFAULT_CATEGORY_NAMES.DEFAULT_CATEGORY &&
        categoryB !== DEFAULT_CATEGORY_NAMES.DEFAULT_CATEGORY
      )
        return 1;
      if (
        categoryA !== DEFAULT_CATEGORY_NAMES.DEFAULT_CATEGORY &&
        categoryB === DEFAULT_CATEGORY_NAMES.DEFAULT_CATEGORY
      )
        return -1;

      return categoryA.localeCompare(categoryB);
    });
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
      catchError(error => this.handleServiceError(error, 'Failed to fetch recently used products'))
    );
  }
}
