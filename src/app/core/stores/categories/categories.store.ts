import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { tap, catchError, of } from 'rxjs';
import type { CategoryDto } from '@types';
import { CategoryService } from '@core/supabase/category.service';

export interface CategoriesState {
  categories: CategoryDto[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const CategoriesStore = signalStore(
  { providedIn: 'root' },
  withState<CategoriesState>({
    categories: [],
    loading: false,
    error: null,
    lastUpdated: null,
  }),
  withComputed(({ categories }) => ({
    categoriesMap: computed(() =>
      categories().reduce((map, cat) => map.set(cat.id, cat), new Map<string, CategoryDto>())
    ),
    categoriesByName: computed(() =>
      categories().reduce((map, cat) => map.set(cat.name, cat), new Map<string, CategoryDto>())
    ),
    categoryCount: computed(() => categories().length),
    sortedCategories: computed(() =>
      [...categories()].sort((a, b) => a.name.localeCompare(b.name))
    ),
  })),
  withMethods((store, categoryService = inject(CategoryService)) => ({
    loadCategories() {
      patchState(store, { loading: true, error: null });

      return categoryService
        .getCategories()
        .pipe(
          tap(categories => {
            patchState(store, {
              categories: categories || [],
              loading: false,
              lastUpdated: new Date(),
            });
            console.log(`✅ Categories loaded: ${categories?.length || 0} items`);
          }),
          catchError(error => {
            const errorMessage = error.message || 'Failed to load categories';
            patchState(store, {
              loading: false,
              error: errorMessage,
            });
            console.error('❌ Failed to load categories:', error);
            return of([]); // Return empty array to continue the stream
          })
        )
        .subscribe();
    },

    getCategoryById: (id: string) => computed(() => store.categoriesMap().get(id)),

    getCategoryByName: (name: string) => computed(() => store.categoriesByName().get(name)),

    reset() {
      patchState(store, {
        categories: [],
        loading: false,
        error: null,
        lastUpdated: null,
      });
    },
  }))
);
