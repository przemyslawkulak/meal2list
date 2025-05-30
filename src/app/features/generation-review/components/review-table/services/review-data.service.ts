import { Injectable } from '@angular/core';
import { CategoryDto } from '../../../../../../types';
import { DEFAULT_CATEGORY_NAMES } from '@app/shared/mocks/defaults.mock';
import { EditableItem } from './review-selection.service';

export type SortField = 'product_name' | 'quantity' | 'category';
export type SortDirection = 'asc' | 'desc';

export interface GroupedCategory {
  categoryId: string;
  categoryName: string;
  items: EditableItem[];
  expanded: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ReviewDataService {
  sortItems(
    items: EditableItem[],
    field: SortField,
    direction: SortDirection,
    categories: CategoryDto[]
  ): EditableItem[] {
    return [...items].sort((a, b) => {
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
          aValue = this.getCategoryName(a.category_id, categories).toLowerCase();
          bValue = this.getCategoryName(b.category_id, categories).toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  groupItemsByCategory(
    items: EditableItem[],
    field: SortField,
    direction: SortDirection,
    categories: CategoryDto[]
  ): GroupedCategory[] {
    const groups = new Map<string, EditableItem[]>();

    items.forEach(item => {
      const categoryId = item.category_id;
      if (!groups.has(categoryId)) {
        groups.set(categoryId, []);
      }
      groups.get(categoryId)!.push(item);
    });

    return Array.from(groups.entries()).map(([categoryId, items]) => {
      // Sort items within each category group
      const sortedCategoryItems = this.sortItems(items, field, direction, categories);

      return {
        categoryId,
        categoryName: this.getCategoryName(categoryId, categories),
        items: sortedCategoryItems,
        expanded: true, // Default to expanded
      };
    });
  }

  getCategoryName(categoryId: string, categories: CategoryDto[]): string {
    return (
      categories.find(cat => cat.id === categoryId)?.name || DEFAULT_CATEGORY_NAMES.DEFAULT_CATEGORY
    );
  }

  getValidCategoryId(categoryId: string, categories: CategoryDto[]): string {
    // Check if the category ID exists in the available categories
    const categoryExists = categories.find(cat => cat.id === categoryId);
    if (categoryExists) {
      return categoryId;
    }

    // If not found, return the default "Other" category ID
    const defaultCategory = categories.find(
      cat => cat.name === DEFAULT_CATEGORY_NAMES.DEFAULT_CATEGORY
    );
    return defaultCategory?.id || categoryId; // Fallback to original if "Other" category not found
  }

  getGroupExcludedCount(items: EditableItem[]): number {
    return items.filter(item => item.excluded).length;
  }

  getGroupIncludedCount(items: EditableItem[]): number {
    return items.filter(item => !item.excluded).length;
  }

  hasGroupExcludedItems(items: EditableItem[]): boolean {
    return items.some(item => item.excluded);
  }
}
