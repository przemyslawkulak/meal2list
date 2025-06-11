import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { tap } from 'rxjs';
import type { CategoryDto } from '@types';
import { CategoryService } from '@core/supabase/category.service';
import { LoggerService } from '@app/shared/services/logger.service';
import { NotificationService } from '@app/shared/services/notification.service';

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
  withMethods((store, categoryService = inject(CategoryService)) => {
    const logger = inject(LoggerService);
    const notification = inject(NotificationService);

    return {
      loadCategories() {
        // If categories are already loaded, skip loading
        if (store.categories().length > 0) {
          logger.logInfo('✅ Categories already loaded, skipping fetch');
          return;
        }

        patchState(store, { loading: true, error: null });

        return categoryService
          .getCategories()
          .pipe(
            tap({
              next: categories => {
                patchState(store, {
                  categories: categories || [],
                  loading: false,
                  lastUpdated: new Date(),
                });
                logger.logInfo(`✅ Categories loaded: ${categories?.length || 0} items`);
              },
              error: error => {
                // Only show error notification if it's not an auth-related error
                if (!error.message?.includes('User ID not available')) {
                  const errorMessage = error.message || 'Failed to load categories';
                  patchState(store, {
                    loading: false,
                    error: errorMessage,
                  });
                  logger.logError(error, 'Failed to load categories');
                  notification.showError(errorMessage);
                } else {
                  // Just reset loading state for auth errors
                  patchState(store, { loading: false });
                  logger.logInfo('⏳ Categories fetch skipped - user not authenticated');
                }
              },
            })
          )
          .subscribe();
      },

      checkAndLoadCategories() {
        if (store.categories().length === 0) {
          logger.logInfo('🔄 No categories in store, loading after login');
          this.loadCategories();
        } else {
          logger.logInfo('✅ Categories already in store after login');
        }
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
    };
  })
);
