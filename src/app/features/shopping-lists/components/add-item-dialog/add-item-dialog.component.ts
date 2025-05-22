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
import { CategoryDto, ProductWithPreferencesDto } from '@types';
import { CategoryIconComponent } from '@app/shared/category-icon/category-icon.component';
import { DEFAULT_ITEM_VALUES, DEFAULT_CATEGORY_NAMES } from '@app/shared/mocks/defaults.mock';
import { TABS, TabValue } from '@app/shared/mocks/constants.mock';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '@app/core/supabase/product.service';

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
    MatSnackBarModule,
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
  private readonly snackBar = inject(MatSnackBar);
  private readonly productService = inject(ProductService);
  private readonly destroy$ = inject(DestroyRef);

  protected readonly TABS = TABS;

  @Output() itemAdded = new EventEmitter<NewShoppingListItem>();

  // Signals
  readonly searchTerm = signal('');
  readonly activeTab = signal<TabValue>(TABS.POPULAR);
  readonly selectedItems = signal<NewShoppingListItem[]>([]);
  readonly popularItems = signal<ProductWithPreferencesDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.initializeProducts();
  }

  private initializeProducts(): void {
    this.productService.products$.pipe(takeUntilDestroyed(this.destroy$)).subscribe({
      next: products => {
        this.popularItems.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load popular items');
        this.loading.set(false);
      },
    });
  }

  // Computed signal for filtered items based on search term
  readonly filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const items = this.popularItems();

    if (!term) return items;
    return items.filter(item => item.name.toLowerCase().includes(term));
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
    this.snackBar.open(`Dodano ${name.trim()} do listy`, 'OK', {
      duration: 2000,
    });
  }

  addItem(product: ProductWithPreferencesDto): void {
    const newItem: NewShoppingListItem = {
      productName: product.name,
      quantity: DEFAULT_ITEM_VALUES.DEFAULT_QUANTITY,
      unit: DEFAULT_ITEM_VALUES.DEFAULT_UNIT,
      category_id: product.preferred_category_id || product.default_category_id,
      product_id: product.id,
    };

    // Track usage
    this.productService.trackProductUsage(product.id).subscribe();

    this.selectedItems.update(items => [...items, newItem]);
    this.itemAdded.emit(newItem);
    this.snackBar.open(`Dodano ${product.name} do listy`, 'OK', {
      duration: 2000,
    });
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

  close(): void {
    this.dialogRef.close();
  }
}
