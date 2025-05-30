import {
  Component,
  input,
  Output,
  EventEmitter,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';

import { GenerationReviewItemDto, CategoryDto } from '../../../../../types';
import { ReviewSelectionService, EditableItem } from './services/review-selection.service';
import { ReviewDataService, SortField, SortDirection } from './services/review-data.service';
import {
  ReviewToolbarComponent,
  ViewMode,
} from './components/review-toolbar/review-toolbar.component';
import { ReviewTableViewComponent } from './components/review-table-view/review-table-view.component';
import { ReviewGroupedViewComponent } from './components/review-grouped-view/review-grouped-view.component';
import { EditFieldEvent } from './components/editable-item-row/editable-item-row.component';

@Component({
  selector: 'app-review-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatTooltipModule,
    ReviewToolbarComponent,
    ReviewTableViewComponent,
    ReviewGroupedViewComponent,
  ],
  templateUrl: './review-table.component.html',
  styleUrl: './review-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewTableComponent {
  private selectionService = inject(ReviewSelectionService);
  private dataService = inject(ReviewDataService);

  itemsInput = input<GenerationReviewItemDto[]>([]);
  categories = input<CategoryDto[]>([]);

  @Output() itemsChange = new EventEmitter<GenerationReviewItemDto[]>();

  editableItems = signal<EditableItem[]>([]);
  displayedColumns = ['exclude', 'product_name', 'quantity', 'unit', 'category'];

  // View and sorting state
  viewMode = signal<ViewMode>('table');
  sortField = signal<SortField>('product_name');
  sortDirection = signal<SortDirection>('asc');

  // Standard units for the dropdown
  standardUnits = ['szt', 'g', 'ml', 'l', 'opak', 'szczypta'];

  // Computed values from selection service
  allSelected = this.selectionService.allSelected;
  someSelected = this.selectionService.someSelected;

  // Process items when input changes
  constructor() {
    // Use effect to watch for input changes and update state
    effect(() => {
      const items = this.itemsInput();
      const processed = items.map(item => this.createEditableItem(item));

      this.editableItems.set(processed);
      this.selectionService.setItems(processed);
    });
  }

  // Sorted and filtered items
  sortedItems = computed(() => {
    const items = this.editableItems();
    const field = this.sortField();
    const direction = this.sortDirection();
    return this.dataService.sortItems(items, field, direction, this.categories());
  });

  // Grouped items by category
  groupedItems = computed(() => {
    const items = this.sortedItems();
    const field = this.sortField();
    const direction = this.sortDirection();
    return this.dataService.groupItemsByCategory(items, field, direction, this.categories());
  });

  private createEditableItem(item: GenerationReviewItemDto): EditableItem {
    const validCategoryId = this.dataService.getValidCategoryId(
      item.category_id,
      this.categories()
    );

    return {
      ...item,
      category_id: validCategoryId,
      isEditing: false,
      editForm: undefined,
    };
  }

  // View mode and sorting handlers
  onViewModeChange(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  onSortFieldChange(field: SortField): void {
    if (this.sortField() === field) {
      // Toggle direction if same field
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with ascending direction
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  // Selection handlers
  onMasterSelectionToggle(): void {
    const updatedItems = this.selectionService.toggleMasterSelection();
    this.editableItems.set(updatedItems);
    this.emitChanges();
  }

  onItemSelectionToggle(item: EditableItem): void {
    const updatedItems = this.selectionService.toggleItemSelection(item);
    this.editableItems.set(updatedItems);
    this.emitChanges();
  }

  // Edit handlers
  onEditStart(event: EditFieldEvent): void {
    const { item, field } = event;

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

    // Focus the specific field after starting edit mode
    if (field) {
      setTimeout(() => {
        this.focusField(item.id, field);
      }, 100);
    }
  }

  onEditSave(item: EditableItem): void {
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
    this.selectionService.setItems(updatedItems);
    this.emitChanges();
  }

  onEditCancel(item: EditableItem): void {
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

  // Helper methods
  getCategoryName = (categoryId: string): string => {
    return this.dataService.getCategoryName(categoryId, this.categories());
  };

  getGroupExcludedCount = (items: EditableItem[]): number => {
    return this.dataService.getGroupExcludedCount(items);
  };

  getGroupIncludedCount = (items: EditableItem[]): number => {
    return this.dataService.getGroupIncludedCount(items);
  };

  hasGroupExcludedItems = (items: EditableItem[]): boolean => {
    return this.dataService.hasGroupExcludedItems(items);
  };

  private focusField(itemId: string, field: string): void {
    const selector = `[data-item-id="${itemId}"][data-field="${field}"] input, [data-item-id="${itemId}"][data-field="${field}"] mat-select`;
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
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
