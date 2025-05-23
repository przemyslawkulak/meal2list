import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
  EventEmitter,
  Output,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { CategoryDto } from '@types';
import { CategoryIconComponent } from '@app/shared/category-icon/category-icon.component';
import { ButtonComponent } from '@components/button/button.component';
import { PopularItem, POPULAR_ITEMS } from '@app/shared/mocks/popular-items.mock';
import { DEFAULT_ITEM_VALUES, DEFAULT_CATEGORY_NAMES } from '@app/shared/mocks/defaults.mock';
import { TABS } from '@app/shared/mocks/constants.mock';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

export interface AddItemDialogData {
  listId: string;
  categories: CategoryDto[];
}

export interface NewShoppingListItem {
  productName: string;
  quantity: number;
  unit: string;
  category_id: string;
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
    FormsModule,
    CategoryIconComponent,
    ButtonComponent,
  ],
  templateUrl: './add-item-dialog.component.html',
  styleUrls: ['./add-item-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddItemDialogComponent {
  private dialogRef = inject(MatDialogRef<AddItemDialogComponent>);
  private data = inject<AddItemDialogData>(MAT_DIALOG_DATA);
  private snackBar = inject(MatSnackBar);

  @Output() itemAdded = new EventEmitter<NewShoppingListItem>();

  searchTerm = signal('');
  activeTab = signal(TABS.POPULAR);
  selectedItems = signal<NewShoppingListItem[]>([]);

  get listId(): string {
    return this.data.listId;
  }

  get categories(): CategoryDto[] {
    return this.data.categories;
  }

  // Using imported popular items from mocks
  popularItems: PopularItem[] = POPULAR_ITEMS;

  // Computed signal for filtered items based on search term
  filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.popularItems;

    return this.popularItems.filter(item => item.name.toLowerCase().includes(term));
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  selectTab(tab: (typeof TABS)[keyof typeof TABS]): void {
    this.activeTab.set(tab);
  }

  // Check if the item already exists in the list of popular items
  itemExists(name: string): boolean {
    if (!name || !name.trim()) return false;
    return this.popularItems.some(item => item.name.toLowerCase() === name.toLowerCase().trim());
  }

  // Get the default category name for custom items
  getDefaultCategoryName(): string {
    return DEFAULT_CATEGORY_NAMES.DEFAULT_CATEGORY;
  }

  // Get the default category ID for custom items
  getDefaultCategoryId(): string {
    const defaultCategory = this.data.categories.find(
      category => category.name === DEFAULT_CATEGORY_NAMES.DEFAULT_CATEGORY
    );
    return defaultCategory?.id || this.data.categories[0]?.id || '';
  }

  // Add a custom item with the name from the search input
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

  addItem(product: PopularItem): void {
    const newItem: NewShoppingListItem = {
      productName: product.name,
      quantity: DEFAULT_ITEM_VALUES.DEFAULT_QUANTITY,
      unit: DEFAULT_ITEM_VALUES.DEFAULT_UNIT,
      category_id: product.category_id,
    };

    this.selectedItems.update(items => [...items, newItem]);
    this.itemAdded.emit(newItem);
    this.snackBar.open(`Dodano ${product.name} do listy`, 'OK', {
      duration: 2000,
    });
  }

  addItemAndClose(product: PopularItem): void {
    const newItem: NewShoppingListItem = {
      productName: product.name,
      quantity: DEFAULT_ITEM_VALUES.DEFAULT_QUANTITY,
      unit: DEFAULT_ITEM_VALUES.DEFAULT_UNIT,
      category_id: product.category_id,
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
