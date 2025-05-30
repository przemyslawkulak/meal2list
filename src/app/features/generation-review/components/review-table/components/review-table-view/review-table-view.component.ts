import { Component, Output, EventEmitter, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CategoryDto } from '../../../../../../../types';
import { EditableItem } from '../../services/review-selection.service';
import {
  EditableItemRowComponent,
  EditFieldEvent,
} from '../editable-item-row/editable-item-row.component';

@Component({
  selector: 'app-review-table-view',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCheckboxModule,
    MatIconModule,
    MatTooltipModule,
    EditableItemRowComponent,
  ],
  templateUrl: './review-table-view.component.html',
  styleUrl: './review-table-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewTableViewComponent {
  items = input<EditableItem[]>([]);
  categories = input<CategoryDto[]>([]);
  standardUnits = input<string[]>([]);
  displayedColumns = input<string[]>([]);
  allSelected = input<boolean>(false);
  someSelected = input<boolean>(false);
  getCategoryName = input.required<(categoryId: string) => string>();

  @Output() masterSelectionToggle = new EventEmitter<void>();
  @Output() itemSelectionToggle = new EventEmitter<EditableItem>();
  @Output() editStart = new EventEmitter<EditFieldEvent>();
  @Output() editSave = new EventEmitter<EditableItem>();
  @Output() editCancel = new EventEmitter<EditableItem>();

  onMasterSelectionToggle(): void {
    this.masterSelectionToggle.emit();
  }

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
