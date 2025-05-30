import { Injectable, computed, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { GenerationReviewItemDto } from '../../../../../../types';

export interface EditableItem extends GenerationReviewItemDto {
  isEditing?: boolean;
  editForm?: {
    product_name: FormControl<string>;
    quantity: FormControl<number>;
    unit: FormControl<string>;
    category_id: FormControl<string>;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ReviewSelectionService {
  private items = signal<EditableItem[]>([]);

  allSelected = computed(() => {
    const currentItems = this.items();
    return currentItems.length > 0 && currentItems.every(item => !item.excluded);
  });

  someSelected = computed(() => {
    const currentItems = this.items();
    return currentItems.some(item => !item.excluded) && !this.allSelected();
  });

  setItems(items: EditableItem[]): void {
    this.items.set(items);
  }

  toggleMasterSelection(): EditableItem[] {
    const allSelected = this.allSelected();
    const updatedItems = this.items().map(item => ({
      ...item,
      excluded: allSelected,
    }));
    this.items.set(updatedItems);
    return updatedItems;
  }

  toggleItemSelection(itemToToggle: EditableItem): EditableItem[] {
    const updatedItems = this.items().map(item =>
      item.id === itemToToggle.id ? { ...item, excluded: !item.excluded } : item
    );
    this.items.set(updatedItems);
    return updatedItems;
  }
}
