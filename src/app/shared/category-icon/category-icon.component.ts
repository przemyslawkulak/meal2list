import { Component, computed, input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CATEGORY_EMOJIS } from '@app/shared/constants/category.constants';
import { CATEGORY_LABELS_PL } from '@app/shared/constants/category-labels.constants';

@Component({
  selector: 'app-category-icon',
  standalone: true,
  imports: [MatTooltipModule],
  templateUrl: './category-icon.component.html',
  styleUrl: './category-icon.component.scss',
})
export class CategoryIconComponent {
  categoryName = input.required<string>();
  showLabel = input<boolean>();

  private getEmojiForCategory(categoryName: string): string {
    return CATEGORY_EMOJIS[categoryName] || '📦';
  }

  readonly emoji = computed(() => {
    return this.getEmojiForCategory(this.categoryName());
  });
  readonly label = computed(() => CATEGORY_LABELS_PL[this.categoryName()] ?? this.categoryName());
}
