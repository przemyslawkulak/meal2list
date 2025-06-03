import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of, catchError, tap, finalize, map } from 'rxjs';
import { CategoriesStore } from './categories/categories.store';
import { ProductsStore } from './products/products.store';
import { CategoryService } from '@core/supabase/category.service';
import { ProductService } from '@core/supabase/product.service';

@Injectable({
  providedIn: 'root',
})
export class AppInitializationService {
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly productsStore = inject(ProductsStore);
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);

  /**
   * Initialize application data by loading categories and products
   * Returns an observable that completes when initialization is done
   * Used directly with provideAppInitializer (supports observables natively)
   */
  initializeApp(): Observable<void> {
    console.log('🚀 Initializing application data...');

    return forkJoin({
      categories: this.categoryService.getCategories().pipe(
        tap(categories => {
          this.categoriesStore.loadCategories();
          console.log(`📁 Loaded ${categories?.length || 0} categories`);
        }),
        catchError(error => {
          console.error('❌ Failed to load categories:', error);
          return of([]); // Return empty array on error, don't fail the entire initialization
        })
      ),
      products: this.productService.getProducts().pipe(
        tap(products => {
          this.productsStore.loadProducts();
          console.log(`📦 Loaded ${products?.length || 0} products`);
        }),
        catchError(error => {
          console.error('❌ Failed to load products:', error);
          return of([]); // Return empty array on error, don't fail the entire initialization
        })
      ),
    }).pipe(
      tap(() => {
        console.log('✅ Application data initialized successfully');
      }),
      finalize(() => {
        console.log('🏁 Application initialization process completed');
      }),
      catchError(error => {
        console.error('❌ Failed to initialize application data:', error);
        // Return void observable to continue app startup even if initialization fails
        return of(void 0);
      }),
      // Convert the result to void
      map(() => void 0)
    );
  }

  /**
   * Refresh all application data
   * Returns an observable that completes when refresh is done
   * Can be used in components for manual refresh functionality
   */
  refreshAppData(): Observable<void> {
    console.log('🔄 Refreshing application data...');

    return forkJoin({
      categories: this.categoryService
        .getCategories()
        .pipe(tap(() => this.categoriesStore.loadCategories())),
      products: this.productService
        .getProducts()
        .pipe(tap(() => this.productsStore.loadProducts())),
    }).pipe(
      tap(({ categories, products }) => {
        console.log('✅ Application data refreshed');
        console.log(`📁 Refreshed ${categories?.length || 0} categories`);
        console.log(`📦 Refreshed ${products?.length || 0} products`);
      }),
      catchError(error => {
        console.error('❌ Failed to refresh application data:', error);
        throw error; // Re-throw for manual refresh so caller can handle the error
      }),
      // Convert the result to void
      map(() => void 0)
    );
  }
}
