import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CategoryOrderService {
  /**
   * Exact order of categories - index determines priority (lower index = higher priority)
   * Food categories first, then non-food, then others
   */
  private readonly categoryOrder: string[] = [
    // Core Food
    'Fruits & Vegetables',
    'Meat',
    'Dairy & Eggs',
    'Bread',

    // Other Food
    'Fish & Seafood',
    'Ready Meals',
    'Canned Food',
    'Frozen',
    'Baking',
    'Spices & Oils',
    'Snacks & Sweets',
    'Dry Goods',
    'Vegan',
    'Water & Beverages',
    'Coffee & Tea',

    // Beverages
    'Alcohol',

    // Non-Food
    'Cleaning',
    'Hygiene',
    'First Aid',
    'Home & Garden',
    'Electronics',
    'Clothing',
    'Stationery',
    'Child',
    'For Pets',

    // Others (always last)
    'Other',
    'Others',
  ];

  /**
   * Gets the priority for a category name
   * Lower numbers = higher priority (shown first)
   */
  getCategoryPriority(categoryName: string): number {
    const index = this.categoryOrder.indexOf(categoryName);
    return index >= 0 ? index : this.categoryOrder.length; // Unknown categories go to end
  }

  /**
   * Compares two categories for sorting
   * Returns negative if categoryA should come before categoryB
   */
  compareCategoryNames(categoryNameA: string, categoryNameB: string): number {
    const priorityA = this.getCategoryPriority(categoryNameA);
    const priorityB = this.getCategoryPriority(categoryNameB);

    // Sort by priority
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // If both unknown, sort alphabetically
    return categoryNameA.localeCompare(categoryNameB);
  }
}
