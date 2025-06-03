# Task 1.5.1: NgRx SignalStore State Management for Categories and Products

## Overview

Convert the current RxJS-based state management for categories and products to NgRx SignalStore. This will provide advanced state management capabilities, improve performance, simplify reactive programming patterns, and align with modern Angular 19 best practices while leveraging NgRx's powerful ecosystem.

## Current State Analysis

### Categories Observable Usage

**Primary Source**: `CategoryService.categories$`

**Direct Usages Found**:

1. **Shell Component** (`src/app/layout/shell/shell.component.ts`)

   - Line 70: `readonly categories$ = this._categoryService.categories$;`
   - Usage: Exposes categories to shell template for navigation/UI

2. **Shopping List Detail Component** (`src/app/features/shopping-lists/pages/detail/shopping-list-detail.component.ts`)

   - Line 175: `combineLatest([shoppingList$, this.categoryService.categories$])`
   - Usage: Combines with shopping list data for display

3. **Generate List Page** (`src/app/features/lists/generate/generate-list.page.ts`)

   - Line 38: `this._categoryService.categories$.subscribe(categories => this.categories.set(categories));`
   - Usage: **Already converting to signal** - subscribes to observable and updates signal

4. **Generation Review Page** (`src/app/features/generation-review/generation-review.page.ts`)

   - Line 104: `this.categoryService.categories$`
   - Usage: Passes categories to generation service

5. **Categories Component** (`src/app/features/categories/categories.component.ts`)

   - Line 27: `readonly categories$ = this._categoryService.categories$;`
   - Usage: Displays categories list

6. **Product Service** (`src/app/core/supabase/product.service.ts`)

   - Line 52: `this.categoryService.categories$.pipe(`
   - Usage: Sorts products by category information

7. **Shopping List Items Service** (`src/app/core/supabase/shopping-list-items.service.ts`)
   - Line 33: `this.categories$ = this.categoryService.categories$;`
   - Usage: Internal caching of categories for operations

### Products Observable Usage

**Primary Source**: `ProductService.products$`

**Direct Usages Found**:

1. **Add Item Dialog Component** (`src/app/features/shopping-lists/components/add-item-dialog/add-item-dialog.component.ts`)

   - Line 86: `this.productService.products$.pipe(takeUntilDestroyed(this.destroy$)).subscribe({`
   - Usage: Loads popular products for selection

2. **User Product Service** (`src/app/core/supabase/user-product.service.ts`)

   - Line 11: Internal usage for user preferences
   - Usage: Manages user-specific product preferences

3. **Product Service Internal** (`src/app/core/supabase/product.service.ts`)
   - Lines 19, 26, 27, 30, 31: Internal observable management
   - Usage: Service implementation details

## Implementation Plan

### Phase 1: Setup NgRx SignalStore Infrastructure

#### 1.1 Install Dependencies

```bash
npm install @ngrx/signals @ngrx/operators
```

#### 1.2 Create Store Structure

```
src/app/core/stores/
├── categories/
│   ├── categories.store.ts
│   ├── categories.effects.ts
│   └── index.ts
├── products/
│   ├── products.store.ts
│   ├── products.effects.ts
│   └── index.ts
└── index.ts
```

#### 1.3 Global Store Registration

- **Location**: `src/app/app.config.ts`
- Register stores in application providers
- Configure NgRx DevTools integration

### Phase 2: Categories SignalStore Implementation

#### 2.1 Categories Store Features

**Location**: `src/app/core/stores/categories/categories.store.ts`

```typescript
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
      categories().reduce((map, cat) => map.set(cat.id, cat), new Map())
    ),
    categoriesByName: computed(() =>
      categories().reduce((map, cat) => map.set(cat.name, cat), new Map())
    ),
    categoryCount: computed(() => categories().length),
  })),
  withMethods((store, supabaseService = inject(SupabaseService)) => ({
    async loadCategories() {
      patchState(store, { loading: true, error: null });
      try {
        const categories = await supabaseService.getCategories();
        patchState(store, {
          categories,
          loading: false,
          lastUpdated: new Date(),
        });
      } catch (error) {
        patchState(store, {
          loading: false,
          error: error.message,
        });
      }
    },
    getCategoryById: (id: string) => computed(() => store.categoriesMap().get(id)),
    getCategoryByName: (name: string) => computed(() => store.categoriesByName().get(name)),
  }))
);
```

#### 2.2 Categories Effects (Optional Advanced Operations)

**Location**: `src/app/core/stores/categories/categories.effects.ts`

```typescript
export const withCategoriesEffects = () => {
  return withHooks({
    onInit: store => {
      // Auto-load categories on store initialization
      effect(() => {
        if (store.categories().length === 0 && !store.loading()) {
          store.loadCategories();
        }
      });
    },
  });
};
```

### Phase 3: Products SignalStore Implementation

#### 3.1 Products Store Features

**Location**: `src/app/core/stores/products/products.store.ts`

```typescript
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
  withComputed(({ products, filters }) => ({
    filteredProducts: computed(() => {
      let filtered = products();

      if (filters().categoryId) {
        filtered = filtered.filter(p => p.categoryId === filters().categoryId);
      }

      if (filters().searchTerm) {
        const term = filters().searchTerm.toLowerCase();
        filtered = filtered.filter(
          p => p.name.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term)
        );
      }

      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }),
    productsByCategory: computed(() =>
      products().reduce((map, product) => {
        const categoryId = product.categoryId;
        if (!map.has(categoryId)) map.set(categoryId, []);
        map.get(categoryId)!.push(product);
        return map;
      }, new Map<string, ProductDto[]>())
    ),
    popularProducts: computed(() =>
      products()
        .filter(p => p.popularity > 0.7)
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 10)
    ),
  })),
  withMethods((store, supabaseService = inject(SupabaseService)) => ({
    async loadProducts() {
      patchState(store, { loading: true, error: null });
      try {
        const products = await supabaseService.getProducts();
        patchState(store, {
          products,
          loading: false,
          lastUpdated: new Date(),
        });
      } catch (error) {
        patchState(store, {
          loading: false,
          error: error.message,
        });
      }
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
  }))
);
```

### Phase 4: Migration Strategy

#### 4.1 High Priority Components (Direct Signal Consumers)

1. **Generate List Page** - Migrate to store injection
2. **Add Item Dialog** - Use products store with filters
3. **Shell Component** - Global categories from store

#### 4.2 Medium Priority Components

4. **Categories Component** - Categories display with store
5. **Shopping List Detail** - Combined store data usage

#### 4.3 Low Priority / Service Layer

6. **Product Service** - Delegate to stores
7. **Shopping List Items Service** - Use store dependencies
8. **Generation Review Page** - Store integration

### Phase 5: Component Migration Examples

#### 5.1 Shell Component Migration

```typescript
@Component({
  selector: 'app-shell',
  template: `
    <mat-sidenav-container>
      <mat-sidenav>
        <mat-nav-list>
          @for (category of categoriesStore.categories(); track category.id) {
            <mat-list-item>{{ category.name }}</mat-list-item>
          }
        </mat-nav-list>
      </mat-sidenav>
    </mat-sidenav-container>
  `,
})
export class ShellComponent {
  readonly categoriesStore = inject(CategoriesStore);

  ngOnInit() {
    // Categories auto-load via store effects
  }
}
```

#### 5.2 Add Item Dialog Migration

```typescript
@Component({
  selector: 'app-add-item-dialog',
  template: `
    <mat-form-field>
      <mat-select (selectionChange)="onCategoryChange($event)">
        @for (category of categoriesStore.categories(); track category.id) {
          <mat-option [value]="category.id">{{ category.name }}</mat-option>
        }
      </mat-select>
    </mat-form-field>

    <mat-form-field>
      <input matInput (input)="onSearchChange($event)" placeholder="Search products..." />
    </mat-form-field>

    @for (product of productsStore.filteredProducts(); track product.id) {
      <mat-list-item (click)="selectProduct(product)">
        {{ product.name }}
      </mat-list-item>
    }
  `,
})
export class AddItemDialogComponent {
  readonly categoriesStore = inject(CategoriesStore);
  readonly productsStore = inject(ProductsStore);

  onCategoryChange(event: MatSelectChange) {
    this.productsStore.setFilters({ categoryId: event.value });
  }

  onSearchChange(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.productsStore.setFilters({ searchTerm });
  }
}
```

### Phase 6: Service Layer Updates

#### 6.1 Legacy Service Compatibility

Create adapter services to maintain backward compatibility:

```typescript
@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly store = inject(CategoriesStore);

  // Backward compatibility
  readonly categories$ = toObservable(this.store.categories);

  // Delegate to store
  loadCategories() {
    return this.store.loadCategories();
  }
}
```

#### 6.2 Enhanced Service Integration

```typescript
@Injectable({ providedIn: 'root' })
export class ShoppingListItemsService {
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly productsStore = inject(ProductsStore);

  addItem(listId: string, productId: string) {
    const product = this.productsStore.products().find(p => p.id === productId);
    const category = this.categoriesStore.categoriesMap().get(product?.categoryId);

    // Enhanced logic with store data
  }
}
```

### Phase 7: Performance Optimizations

#### 7.1 Store Features

- **Memoization**: Built-in computed signal memoization
- **Selective Updates**: Only update affected signal slices
- **Lazy Loading**: Load data on-demand with store methods
- **Caching**: Implement TTL-based cache invalidation

#### 7.2 Advanced Patterns

```typescript
export const withAsyncOperations = () => {
  return withHooks({
    onInit: store => {
      // Implement auto-refresh every 5 minutes
      effect(() => {
        const interval = setInterval(() => {
          if (Date.now() - store.lastUpdated()?.getTime() > 300000) {
            store.loadCategories();
          }
        }, 60000);

        return () => clearInterval(interval);
      });
    },
  });
};
```

### Phase 8: Testing Strategy

#### 8.1 Store Testing

```typescript
describe('CategoriesStore', () => {
  let store: InstanceType<typeof CategoriesStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CategoriesStore],
    });
    store = TestBed.inject(CategoriesStore);
  });

  it('should load categories', async () => {
    await store.loadCategories();
    expect(store.categories()).toHaveLength(3);
    expect(store.loading()).toBe(false);
  });
});
```

#### 8.2 Component Testing

```typescript
describe('ShellComponent', () => {
  let component: ShellComponent;
  let categoriesStore: jasmine.SpyObj<CategoriesStore>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('CategoriesStore', ['loadCategories']);

    TestBed.configureTestingModule({
      providers: [{ provide: CategoriesStore, useValue: spy }],
    });

    categoriesStore = TestBed.inject(CategoriesStore) as jasmine.SpyObj<CategoriesStore>;
  });
});
```

## Benefits of NgRx SignalStore

### Advanced State Management

- Built-in async operation handling
- Sophisticated state updates with `patchState`
- Enhanced developer tools integration
- Better error handling patterns

### Performance Improvements

- Optimized signal-based reactivity
- Efficient computed signal memoization
- Reduced bundle size with tree-shaking
- Better change detection optimization

### Developer Experience

- Type-safe state management
- Powerful composition with `withMethods`, `withComputed`
- Better debugging with NgRx DevTools
- Simplified testing patterns

### Scalability

- Modular store composition
- Easy feature extension
- Clear separation of concerns
- Better code organization

## Migration Timeline

- **Phase 1**: 1-2 days (Setup and infrastructure)
- **Phase 2-3**: 3-4 days (Store implementation)
- **Phase 4-5**: 4-6 days (Component migration)
- **Phase 6**: 2-3 days (Service layer updates)
- **Phase 7**: 2-3 days (Optimizations)
- **Phase 8**: 3-4 days (Testing and cleanup)

**Total**: 15-22 days

## Success Criteria

1. All category and product data managed through NgRx SignalStore
2. Enhanced state management capabilities (filtering, caching, etc.)
3. Improved performance metrics with signal-based reactivity
4. Comprehensive test coverage for stores and components
5. Better developer experience with NgRx DevTools
6. Maintained backward compatibility during transition
7. Clean, scalable store architecture

## Dependencies

- `@ngrx/signals` package
- `@ngrx/operators` package
- Angular 19 signal APIs
- Existing Supabase integration
- NgRx DevTools (optional but recommended)
- Current component architecture
