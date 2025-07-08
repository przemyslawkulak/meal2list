import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-category-icon',
  standalone: true,
  imports: [],
  templateUrl: './category-icon.component.html',
  styleUrl: './category-icon.component.scss',
})
export class CategoryIconComponent {
  categoryName = input.required<string>();

  private getEmojiForCategory(categoryName: string): string {
    const emojiMap: Record<string, string> = {
      Alcohol: '🍷',
      'Ready Meals': '🍽️',
      'Canned Food': '🥫',
      Frozen: '❄️',
      'Dairy & Eggs': '🥛',
      Meat: '🥩',
      'Fish & Seafood': '🐟',
      Bread: '🥖',
      Baking: '🧁',
      'Spices & Oils': '🧂',
      'Snacks & Sweets': '🍭',
      'Dry Goods': '🍚',
      'Fruits & Vegetables': '🍎',
      Vegan: '🌱',
      Cleaning: '🧽',
      Hygiene: '🧼',
      'First Aid': '🏥',
      'Home & Garden': '🏠',
      Electronics: '📱',
      Clothing: '👕',
      Stationery: '📎',
      Child: '🍼',
      'For Pets': '🐕',
      Other: '❓',
      'Water & Beverages': '💧',
      'Coffee & Tea': '☕',
    };
    return emojiMap[categoryName] || '📦';
  }

  readonly emoji = computed(() => {
    return this.getEmojiForCategory(this.categoryName());
  });
}
