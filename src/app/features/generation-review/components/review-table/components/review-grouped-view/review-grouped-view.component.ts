import { Component, Output, EventEmitter, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { CategoryDto } from '../../../../../../../types';
import { GroupedCategory } from '../../services/review-data.service';
import { EditableItem } from '../../services/review-selection.service';
import { CategoryIconComponent } from '@app/shared/category-icon/category-icon.component';
import {
  EditableItemRowComponent,
  EditFieldEvent,
} from '../editable-item-row/editable-item-row.component';

@Component({
  selector: 'app-review-grouped-view',
  standalone: true,
  imports: [CommonModule, MatIconModule, CategoryIconComponent, EditableItemRowComponent],
  templateUrl: './review-grouped-view.component.html',
  styleUrl: './review-grouped-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewGroupedViewComponent {
  groupedItems = input<GroupedCategory[]>([]);
  categories = input<CategoryDto[]>([]);
  standardUnits = input<string[]>([]);
  getCategoryName = input.required<(categoryId: string) => string>();
  getGroupExcludedCount = input.required<(items: EditableItem[]) => number>();
  getGroupIncludedCount = input.required<(items: EditableItem[]) => number>();
  hasGroupExcludedItems = input.required<(items: EditableItem[]) => boolean>();

  @Output() itemSelectionToggle = new EventEmitter<EditableItem>();
  @Output() editStart = new EventEmitter<EditFieldEvent>();
  @Output() editSave = new EventEmitter<EditableItem>();
  @Output() editCancel = new EventEmitter<EditableItem>();

  onItemSelectionToggle(item: EditableItem): void {
    this.itemSelectionToggle.emit(item);
  }

  onEditStart(event: EditFieldEvent): void {
    this.editStart.emit(event);
  }

  onEditSave(item: EditableItem): void {
    this.editSave.emit(item);
  }

  onEditCancel(item: EditableItem): void {
    this.editCancel.emit(item);
  }
}
