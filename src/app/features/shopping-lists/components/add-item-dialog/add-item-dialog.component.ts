import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
  EventEmitter,
  Output,
  DestroyRef,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoryDto, ProductWithPreferencesDto, ProductDto } from '@types';
import { CategoryIconComponent } from '@app/shared/category-icon/category-icon.component';
import { DEFAULT_ITEM_VALUES, DEFAULT_CATEGORY_NAMES } from '@app/shared/mocks/defaults.mock';
import { TABS, TabValue } from '@app/shared/mocks/constants.mock';
import { NotificationService } from '@app/shared/services/notification.service';
import { LoggerService } from '@app/shared/services/logger.service';
import { ProductsStore } from '@app/core/stores/products/products.store';
import { UserProductService } from '@app/core/supabase/user-product.service';
import { CategoryOrderService } from '@app/core/services/category-order.service';
import { HttpErrorResponse } from '@angular/common/http';

export interface AddItemDialogData {
  listId: string;
  categories: CategoryDto[];
}

export interface NewShoppingListItem {
  productName: string;
  quantity: number;
  unit: string;
  category_id: string;
  product_id?: string;
}

@Component({
  selector: 'app-add-item-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    FormsModule,
    CategoryIconComponent,
  ],
  templateUrl: './add-item-dialog.component.html',
  styleUrls: ['./add-item-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddItemDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AddItemDialogComponent>);
  private readonly data = inject<AddItemDialogData>(MAT_DIALOG_DATA);
  private readonly notification = inject(NotificationService);
  private readonly logger = inject(LoggerService);
  private readonly productsStore = inject(ProductsStore);
  private readonly userProductService = inject(UserProductService);
  private readonly categoryOrderService = inject(CategoryOrderService);
  private readonly destroy$ = inject(DestroyRef);

  protected readonly TABS = TABS;

  @Output() itemAdded = new EventEmitter<NewShoppingListItem>();

  // Signals
  readonly searchTerm = signal('');
  readonly activeTab = signal<TabValue>(TABS.POPULAR);
  readonly selectedItems = signal<NewShoppingListItem[]>([]);
  readonly mostUsedItems = signal<ProductWithPreferencesDto[]>([]);
  readonly loadingHistory = signal(false);
  readonly error = signal<string | null>(null);

  // Computed signals from store
  readonly popularItems = computed(() => this.productsStore.popularProducts());
  readonly loading = computed(() => this.productsStore.loading());
  readonly storeError = computed(() => this.productsStore.error());

  constructor() {
    this.initializeProducts();
  }

  private initializeProducts(): void {
    // Check if we have an error from the store
    if (this.storeError()) {
      this.error.set('Nie udało się załadować popularnych produktów');
      this.notification.showError('Nie udało się załadować popularnych produktów');
    }
  }

  private loadMostUsedProducts(): void {
    if (this.mostUsedItems().length > 0) return; // Already loaded

    this.loadingHistory.set(true);
    this.userProductService
      .getMostUsedProducts(20)
      .pipe(takeUntilDestroyed(this.destroy$))
      .subscribe({
        next: (products: ProductWithPreferencesDto[]) => {
          this.mostUsedItems.set(products);
          this.loadingHistory.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.error.set('Nie udało się załadować historii produktów');
          this.logger.logError(error, 'Failed to load history items');
          this.notification.showError('Nie udało się załadować historii produktów');
          this.loadingHistory.set(false);
        },
      });
  }

  // Computed signal for filtered and sorted items based on search term, active tab, and category hierarchy
  readonly filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const items = this.activeTab() === TABS.POPULAR ? this.popularItems() : this.mostUsedItems();

    // Filter by search term
    const filteredItems = term
      ? items.filter(item => item.name.toLowerCase().includes(term))
      : items;

    // Sort by category using food-first hierarchy
    return filteredItems.sort((a, b) => {
      const categoryA = this.getCategoryName(this.getProductCategoryId(a));
      const categoryB = this.getCategoryName(this.getProductCategoryId(b));

      // First sort by category hierarchy
      const categoryComparison = this.categoryOrderService.compareCategoryNames(
        categoryA,
        categoryB
      );
      if (categoryComparison !== 0) {
        return categoryComparison;
      }

      // Within same category, sort alphabetically by product name
      return a.name.localeCompare(b.name);
    });
  });

  get listId(): string {
    return this.data.listId;
  }

  get categories(): CategoryDto[] {
    return this.data.categories;
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  selectTab(tab: TabValue): void {
    this.activeTab.set(tab);

    // Reset search when switching tabs
    this.searchTerm.set('');

    // Load most used products when History tab is selected
    if (tab === TABS.HISTORY) {
      this.loadMostUsedProducts();
    }
  }

  itemExists(name: string): boolean {
    if (!name || !name.trim()) return false;
    return this.popularItems().some(item => item.name.toLowerCase() === name.toLowerCase().trim());
  }

  getDefaultCategoryName(): string {
    return DEFAULT_CATEGORY_NAMES.DEFAULT_CATEGORY;
  }

  getDefaultCategoryId(): string {
    const defaultCategory = this.data.categories.find(
      category => category.name === DEFAULT_CATEGORY_NAMES.DEFAULT_CATEGORY
    );
    return defaultCategory?.id || this.data.categories[0]?.id || '';
  }

  addCustomItem(name: string): void {
    if (!name || !name.trim()) return;

    const newItem: NewShoppingListItem = {
      productName: name.trim(),
      quantity: DEFAULT_ITEM_VALUES.DEFAULT_QUANTITY,
      unit: DEFAULT_ITEM_VALUES.DEFAULT_UNIT,
      category_id: this.getDefaultCategoryId(),
    };

    this.selectedItems.update(items => [...items, newItem]);
    this.itemAdded.emit(newItem);
    this.notification.showSuccess(`Dodano ${name.trim()} do listy`);
  }

  addItem(product: ProductWithPreferencesDto): void {
    const newItem: NewShoppingListItem = {
      productName: product.name,
      quantity: DEFAULT_ITEM_VALUES.DEFAULT_QUANTITY,
      unit: DEFAULT_ITEM_VALUES.DEFAULT_UNIT,
      category_id: product.preferred_category_id || product.default_category_id,
      product_id: product.id,
    };

    this.userProductService.trackProductUsage(product.id).subscribe();

    this.selectedItems.update(items => [...items, newItem]);
    this.itemAdded.emit(newItem);
    this.notification.showSuccess(`Dodano ${product.name} do listy`);
  }

  addItemAndClose(product: ProductWithPreferencesDto): void {
    const newItem: NewShoppingListItem = {
      productName: product.name,
      quantity: DEFAULT_ITEM_VALUES.DEFAULT_QUANTITY,
      unit: DEFAULT_ITEM_VALUES.DEFAULT_UNIT,
      category_id: product.preferred_category_id || product.default_category_id,
      product_id: product.id,
    };

    this.selectedItems.update(items => [...items, newItem]);
    this.dialogRef.close(this.selectedItems());
  }

  getCategoryName(categoryId: string): string {
    return (
      this.data.categories.find(category => category.id === categoryId)?.name ||
      DEFAULT_CATEGORY_NAMES.DEFAULT_CATEGORY
    );
  }

  getProductCategoryId(product: ProductDto | ProductWithPreferencesDto): string {
    return (
      (product as ProductWithPreferencesDto).preferred_category_id || product.default_category_id
    );
  }

  close(): void {
    this.dialogRef.close();
  }
}
