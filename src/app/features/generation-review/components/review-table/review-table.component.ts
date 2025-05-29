import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { GenerationReviewItemDto, CategoryDto } from '../../../../../types';
import { DEFAULT_CATEGORY_NAMES } from '@app/shared/mocks/defaults.mock';
import { CategoryIconComponent } from '@app/shared/category-icon/category-icon.component';

interface EditableItem extends GenerationReviewItemDto {
  isEditing?: boolean;
  editForm?: {
    product_name: FormControl<string>;
    quantity: FormControl<number>;
    unit: FormControl<string>;
    category_id: FormControl<string>;
  };
}

type SortField = 'product_name' | 'quantity' | 'category';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'grouped';

@Component({
  selector: 'app-review-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatCardModule,
    MatButtonToggleModule,
    CategoryIconComponent,
  ],
  templateUrl: './review-table.component.html',
  styleUrl: './review-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewTableComponent {
  @Input() set items(value: GenerationReviewItemDto[]) {
    const processedItems = value.map(item => this.createEditableItem(item));
    this.editableItems.set(processedItems);
  }

  @Input() categories: CategoryDto[] = [];

  @Output() itemsChange = new EventEmitter<GenerationReviewItemDto[]>();

  editableItems = signal<EditableItem[]>([]);
  displayedColumns = ['exclude', 'product_name', 'quantity', 'unit', 'category'];

  // View and sorting state
  viewMode = signal<ViewMode>('table');
  sortField = signal<SortField>('product_name');
  sortDirection = signal<SortDirection>('asc');

  // Standard units for the dropdown
  standardUnits = ['szt', 'g', 'ml', 'l', 'opak', 'szczypta'];

  // Computed values
  allSelected = computed(() => {
    const items = this.editableItems();
    return items.length > 0 && items.every(item => !item.excluded);
  });

  someSelected = computed(() => {
    const items = this.editableItems();
    return items.some(item => !item.excluded) && !this.allSelected();
  });

  // Sorted and filtered items
  sortedItems = computed(() => {
    const items = [...this.editableItems()];
    const field = this.sortField();
    const direction = this.sortDirection();

    return items.sort((a, b) => {
      // First, sort by excluded status (included items first, excluded items last)
      if (a.excluded !== b.excluded) {
        return a.excluded ? 1 : -1;
      }

      // Then sort by the selected field within each group
      let aValue: string | number;
      let bValue: string | number;

      switch (field) {
        case 'product_name':
          aValue = a.product_name.toLowerCase();
          bValue = b.product_name.toLowerCase();
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'category':
          aValue = this.getCategoryName(a.category_id).toLowerCase();
          bValue = this.getCategoryName(b.category_id).toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  });

  // Grouped items by category
  groupedItems = computed(() => {
    const items = this.sortedItems();
    const groups = new Map<string, EditableItem[]>();
    const field = this.sortField();
    const direction = this.sortDirection();

    items.forEach(item => {
      const categoryId = item.category_id;
      if (!groups.has(categoryId)) {
        groups.set(categoryId, []);
      }
      groups.get(categoryId)!.push(item);
    });

    return Array.from(groups.entries()).map(([categoryId, items]) => {
      // Sort items within each category group
      const sortedCategoryItems = items.sort((a, b) => {
        // First, sort by excluded status (included items first, excluded items last)
        if (a.excluded !== b.excluded) {
          return a.excluded ? 1 : -1;
        }

        // Then sort by the selected field within each group
        let aValue: string | number;
        let bValue: string | number;

        switch (field) {
          case 'product_name':
            aValue = a.product_name.toLowerCase();
            bValue = b.product_name.toLowerCase();
            break;
          case 'quantity':
            aValue = a.quantity;
            bValue = b.quantity;
            break;
          case 'category':
            aValue = this.getCategoryName(a.category_id).toLowerCase();
            bValue = this.getCategoryName(b.category_id).toLowerCase();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      });

      return {
        categoryId,
        categoryName: this.getCategoryName(categoryId),
        items: sortedCategoryItems,
        expanded: true, // Default to expanded
      };
    });
  });

  // Display items based on view mode
  displayItems = computed(() => {
    return this.viewMode() === 'grouped' ? this.groupedItems() : this.sortedItems();
  });

  // Helper methods for template
  getGroupExcludedCount(items: EditableItem[]): number {
    return items.filter(item => item.excluded).length;
  }

  getGroupIncludedCount(items: EditableItem[]): number {
    return items.filter(item => !item.excluded).length;
  }

  hasGroupExcludedItems(items: EditableItem[]): boolean {
    return items.some(item => item.excluded);
  }

  private createEditableItem(item: GenerationReviewItemDto): EditableItem {
    // Ensure the item has a valid category ID, fallback to default category if not found
    const validCategoryId = this.getValidCategoryId(item.category_id);

    return {
      ...item,
      category_id: validCategoryId,
      isEditing: false,
      editForm: undefined,
    };
  }

  toggleMasterSelection(): void {
    const allSelected = this.allSelected();
    const updatedItems = this.editableItems().map(item => ({
      ...item,
      excluded: allSelected,
    }));
    this.editableItems.set(updatedItems);
    this.emitChanges();
  }

  toggleItemSelection(item: EditableItem): void {
    const updatedItems = this.editableItems().map(i =>
      i.id === item.id ? { ...i, excluded: !i.excluded } : i
    );
    this.editableItems.set(updatedItems);
    this.emitChanges();
  }

  startEdit(item: EditableItem): void {
    const updatedItems = this.editableItems().map(i =>
      i.id === item.id
        ? {
            ...i,
            isEditing: true,
            editForm: {
              product_name: new FormControl(i.product_name, {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(1)],
              }),
              quantity: new FormControl(i.quantity, {
                nonNullable: true,
                validators: [Validators.required, Validators.min(0.01)],
              }),
              unit: new FormControl(i.unit, {
                nonNullable: true,
                validators: [Validators.required],
              }),
              category_id: new FormControl(i.category_id, {
                nonNullable: true,
                validators: [Validators.required],
              }),
            },
          }
        : i
    );
    this.editableItems.set(updatedItems);
  }

  saveEdit(item: EditableItem): void {
    if (!item.editForm) return;

    const form = item.editForm;
    if (
      form.product_name.invalid ||
      form.quantity.invalid ||
      form.unit.invalid ||
      form.category_id.invalid
    ) {
      return;
    }

    const updatedItems = this.editableItems().map(i =>
      i.id === item.id
        ? {
            ...i,
            product_name: form.product_name.value,
            quantity: form.quantity.value,
            unit: form.unit.value,
            category_id: form.category_id.value,
            isModified: true,
            isEditing: false,
          }
        : i
    );
    this.editableItems.set(updatedItems);
    this.emitChanges();
  }

  // New method for auto-save on blur/enter
  autoSaveEdit(item: EditableItem): void {
    if (!item.editForm) return;

    const form = item.editForm;

    // Only save if form is valid
    if (
      form.product_name.valid &&
      form.quantity.valid &&
      form.unit.valid &&
      form.category_id.valid
    ) {
      this.saveEdit(item);
    }
  }

  // New method for handling keyboard navigation
  onKeyDown(event: KeyboardEvent, item: EditableItem, action?: 'save' | 'cancel'): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (action === 'save') {
        this.saveEdit(item);
      } else if (action === 'cancel') {
        this.cancelEdit(item);
      } else {
        this.autoSaveEdit(item);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEdit(item);
    }
  }

  onEditFieldKeyDown(
    event: KeyboardEvent,
    item: EditableItem,
    field: 'product_name' | 'quantity' | 'unit' | 'category_id'
  ): void {
    // Only handle Enter and Space keys for accessibility
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Don't start editing if item is excluded
      if (!item.excluded) {
        this.startEditField(item, field);
      }
    }
  }

  // Method to start editing specific field (for click-to-edit)
  startEditField(
    item: EditableItem,
    field?: 'product_name' | 'quantity' | 'unit' | 'category_id'
  ): void {
    if (item.excluded) return; // Don't allow editing excluded items

    if (!item.isEditing) {
      this.startEdit(item);

      // Focus the specific field after starting edit mode
      setTimeout(() => {
        if (field) {
          this.focusField(item.id, field);
        }
      }, 100);
    }
  }

  // Helper method to focus specific field
  private focusField(itemId: string, field: string): void {
    const selector = `[data-item-id="${itemId}"][data-field="${field}"] input, [data-item-id="${itemId}"][data-field="${field}"] mat-select`;
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  }

  cancelEdit(item: EditableItem): void {
    if (!item.editForm) return;

    // Reset form values to original
    item.editForm.product_name.setValue(item.product_name);
    item.editForm.quantity.setValue(item.quantity);
    item.editForm.unit.setValue(item.unit);
    item.editForm.category_id.setValue(item.category_id);

    const updatedItems = this.editableItems().map(i =>
      i.id === item.id ? { ...i, isEditing: false } : i
    );
    this.editableItems.set(updatedItems);
  }

  getCategoryName(categoryId: string): string {
    return (
      this.categories.find(cat => cat.id === categoryId)?.name ||
      DEFAULT_CATEGORY_NAMES.DEFAULT_CATEGORY
    );
  }

  private getValidCategoryId(categoryId: string): string {
    // Check if the category ID exists in the available categories
    const categoryExists = this.categories.find(cat => cat.id === categoryId);
    if (categoryExists) {
      return categoryId;
    }

    // If not found, return the default "Other" category ID
    const defaultCategory = this.categories.find(
      cat => cat.name === DEFAULT_CATEGORY_NAMES.DEFAULT_CATEGORY
    );
    return defaultCategory?.id || categoryId; // Fallback to original if "Other" category not found
  }

  // View mode and sorting methods
  toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'table' ? 'grouped' : 'table');
  }

  setSortField(field: SortField): void {
    if (this.sortField() === field) {
      // Toggle direction if same field
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with ascending direction
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  // Helper methods
  getSortIcon(field: SortField): string {
    if (this.sortField() !== field) return 'unfold_more';
    return this.sortDirection() === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
  }

  private emitChanges(): void {
    const items = this.editableItems().map(item => ({
      id: item.id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit: item.unit,
      category_id: item.category_id,
      excluded: item.excluded,
      source: item.source,
      isModified: item.isModified,
    }));
    this.itemsChange.emit(items);
  }
}
