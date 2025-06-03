import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { tap, catchError, of } from 'rxjs';
import type { ProductDto, CreateProductCommand, UpdateProductCommand, CategoryDto } from '@types';
import { CategoriesStore } from '../categories/categories.store';
import { ProductService } from '@core/supabase/product.service';
import { DEFAULT_CATEGORY_NAMES } from '@app/shared/mocks/defaults.mock';

export interface ProductFilters {
  categoryId: string | null;
  searchTerm: string;
  sortBy: 'name' | 'category' | 'recent';
}

export interface ProductsState {
  products: ProductDto[];
  loading: boolean;
  error: string | null;
  filters: ProductFilters;
  lastUpdated: Date | null;
}

// Helper function for sorting products by category
function sortProductsByCategory<T extends ProductDto>(
  a: T,
  b: T,
  categories: CategoryDto[]
): number {
  const getCategoryName = (categoryId: string) =>
    categories.find(category => category.id === categoryId)?.name ||
    DEFAULT_CATEGORY_NAMES.DEFAULT_CATEGORY;

  const categoryA = getCategoryName(a.default_category_id);
  const categoryB = getCategoryName(b.default_category_id);

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
}

export const ProductsStore = signalStore(
  { providedIn: 'root' },
  withState<ProductsState>({
    products: [],
    loading: false,
    error: null,
    filters: {
      categoryId: null,
      searchTerm: '',
      sortBy: 'name',
    },
    lastUpdated: null,
  }),
  withComputed(({ products, filters }, categoriesStore = inject(CategoriesStore)) => ({
    filteredProducts: computed(() => {
      let filtered = products();

      if (filters().categoryId) {
        filtered = filtered.filter(p => p.default_category_id === filters().categoryId);
      }

      if (filters().searchTerm) {
        const term = filters().searchTerm.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(term));
      }

      // Sort products
      const categories = categoriesStore.categories();
      return filtered.sort((a, b) => {
        switch (filters().sortBy) {
          case 'category':
            return sortProductsByCategory(a, b, categories);
          case 'recent':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          default:
            return a.name.localeCompare(b.name);
        }
      });
    }),

    productsByCategory: computed(() => {
      const categoryMap = new Map<string, ProductDto[]>();

      products().forEach(product => {
        const categoryId = product.default_category_id;
        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, []);
        }
        categoryMap.get(categoryId)!.push(product);
      });

      return categoryMap;
    }),

    popularProducts: computed(() =>
      products()
        .filter(p => p.is_common) // Common products are typically more popular
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 10)
    ),

    productCount: computed(() => products().length),

    commonProducts: computed(() => products().filter(p => p.is_common)),

    userProducts: computed(() => products().filter(p => !p.is_common)),
  })),
  withMethods((store, productService = inject(ProductService)) => ({
    loadProducts() {
      patchState(store, { loading: true, error: null });

      return productService
        .getProducts()
        .pipe(
          tap(products => {
            patchState(store, {
              products: products || [],
              loading: false,
              lastUpdated: new Date(),
            });
            console.log(`✅ Products loaded: ${products?.length || 0} items`);
          }),
          catchError(error => {
            const errorMessage = error.message || 'Failed to load products';
            patchState(store, {
              loading: false,
              error: errorMessage,
            });
            console.error('❌ Failed to load products:', error);
            return of([]); // Return empty array to continue the stream
          })
        )
        .subscribe();
    },

    loadCommonProducts() {
      patchState(store, { loading: true, error: null });

      return productService
        .getCommonProducts()
        .pipe(
          tap(products => {
            patchState(store, {
              products: products || [],
              loading: false,
              lastUpdated: new Date(),
            });
            console.log(`✅ Common products loaded: ${products?.length || 0} items`);
          }),
          catchError(error => {
            const errorMessage = error.message || 'Failed to load common products';
            patchState(store, {
              loading: false,
              error: errorMessage,
            });
            console.error('❌ Failed to load common products:', error);
            return of([]); // Return empty array to continue the stream
          })
        )
        .subscribe();
    },

    /**
     * Create a new user product and add it to the store
     */
    createProduct(command: CreateProductCommand) {
      patchState(store, { loading: true, error: null });

      return productService.createProduct(command).pipe(
        tap(newProduct => {
          if (newProduct) {
            // Add the new product to the current products array
            const currentProducts = store.products();
            patchState(store, {
              products: [...currentProducts, newProduct],
              loading: false,
              lastUpdated: new Date(),
            });

            console.log('✅ Product created and added to store:', newProduct.name);
          } else {
            patchState(store, { loading: false });
          }
        }),
        catchError(error => {
          const errorMessage = error.message || 'Failed to create product';
          patchState(store, {
            loading: false,
            error: errorMessage,
          });
          console.error('❌ Failed to create product:', error);
          return of(null); // Return null to indicate failure
        })
      );
    },

    /**
     * Update an existing product and refresh the store
     */
    updateProduct(id: string, command: UpdateProductCommand) {
      patchState(store, { loading: true, error: null });

      return productService.updateProduct(id, command).pipe(
        tap(updatedProduct => {
          if (updatedProduct) {
            // Update the product in the current products array
            const currentProducts = store.products();
            const updatedProducts = currentProducts.map(product =>
              product.id === id ? updatedProduct : product
            );

            patchState(store, {
              products: updatedProducts,
              loading: false,
              lastUpdated: new Date(),
            });

            console.log('✅ Product updated in store:', updatedProduct.name);
          } else {
            patchState(store, { loading: false });
          }
        }),
        catchError(error => {
          const errorMessage = error.message || 'Failed to update product';
          patchState(store, {
            loading: false,
            error: errorMessage,
          });
          console.error('❌ Failed to update product:', error);
          return of(null); // Return null to indicate failure
        })
      );
    },

    /**
     * Delete a product and remove it from the store
     */
    deleteProduct(id: string) {
      patchState(store, { loading: true, error: null });

      return productService.deleteProduct(id).pipe(
        tap(() => {
          // Remove the product from the current products array
          const currentProducts = store.products();
          const filteredProducts = currentProducts.filter(product => product.id !== id);

          patchState(store, {
            products: filteredProducts,
            loading: false,
            lastUpdated: new Date(),
          });

          console.log('✅ Product deleted from store');
        }),
        catchError(error => {
          const errorMessage = error.message || 'Failed to delete product';
          patchState(store, {
            loading: false,
            error: errorMessage,
          });
          console.error('❌ Failed to delete product:', error);
          return of(false); // Return false to indicate failure
        })
      );
    },

    /**
     * Add a product to the store without making an API call
     * Useful for optimistic updates or when you know a product was created elsewhere
     */
    addProductToStore(product: ProductDto): void {
      const currentProducts = store.products();
      // Check if product already exists to avoid duplicates
      const existingProduct = currentProducts.find(p => p.id === product.id);

      if (!existingProduct) {
        patchState(store, {
          products: [...currentProducts, product],
          lastUpdated: new Date(),
        });
        console.log('✅ Product added to store (optimistic):', product.name);
      }
    },

    /**
     * Remove a product from the store without making an API call
     */
    removeProductFromStore(productId: string): void {
      const currentProducts = store.products();
      const filteredProducts = currentProducts.filter(product => product.id !== productId);

      patchState(store, {
        products: filteredProducts,
        lastUpdated: new Date(),
      });
      console.log('✅ Product removed from store (optimistic)');
    },

    /**
     * Update a product in the store without making an API call
     */
    updateProductInStore(updatedProduct: ProductDto): void {
      const currentProducts = store.products();
      const updatedProducts = currentProducts.map(product =>
        product.id === updatedProduct.id ? updatedProduct : product
      );

      patchState(store, {
        products: updatedProducts,
        lastUpdated: new Date(),
      });
      console.log('✅ Product updated in store (optimistic):', updatedProduct.name);
    },

    setFilters: (filters: Partial<ProductFilters>) => {
      patchState(store, {
        filters: { ...store.filters(), ...filters },
      });
    },

    clearFilters: () => {
      patchState(store, {
        filters: { categoryId: null, searchTerm: '', sortBy: 'name' },
      });
    },

    getProductsByCategory: (categoryId: string) =>
      computed(() => store.productsByCategory().get(categoryId) || []),

    getProductById: (id: string) => computed(() => store.products().find(p => p.id === id)),

    reset(): void {
      patchState(store, {
        products: [],
        loading: false,
        error: null,
        filters: {
          categoryId: null,
          searchTerm: '',
          sortBy: 'name',
        },
        lastUpdated: null,
      });
    },
  }))
);
