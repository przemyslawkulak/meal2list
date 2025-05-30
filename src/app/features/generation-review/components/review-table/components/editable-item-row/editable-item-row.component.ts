import { Component, Output, EventEmitter, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CategoryDto } from '../../../../../../../types';
import { CategoryIconComponent } from '@app/shared/category-icon/category-icon.component';
import { EditableItem } from '../../services/review-selection.service';

export interface EditFieldEvent {
  item: EditableItem;
  field?: 'product_name' | 'quantity' | 'unit' | 'category_id';
}

@Component({
  selector: 'app-editable-item-row',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    CategoryIconComponent,
  ],
  templateUrl: './editable-item-row.component.html',
  styleUrl: './editable-item-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditableItemRowComponent {
  item = input.required<EditableItem>();
  categories = input<CategoryDto[]>([]);
  standardUnits = input<string[]>([]);
  viewType = input<'table' | 'grouped'>('table');
  fieldType = input<'product_name' | 'quantity' | 'unit' | 'category_id'>();
  getCategoryName = input.required<(categoryId: string) => string>();

  @Output() selectionToggle = new EventEmitter<EditableItem>();
  @Output() editStart = new EventEmitter<EditFieldEvent>();
  @Output() editSave = new EventEmitter<EditableItem>();
  @Output() editCancel = new EventEmitter<EditableItem>();

  onSelectionToggle(): void {
    this.selectionToggle.emit(this.item());
  }

  onEditStart(field?: 'product_name' | 'quantity' | 'unit' | 'category_id'): void {
    if (this.item().excluded) return;
    this.editStart.emit({ item: this.item(), field });
  }

  onEditSave(): void {
    const item = this.item();
    if (!item.editForm) return;

    const form = item.editForm;
    if (
      form.product_name.valid &&
      form.quantity.valid &&
      form.unit.valid &&
      form.category_id.valid
    ) {
      this.editSave.emit(item);
    }
  }

  onEditCancel(): void {
    this.editCancel.emit(this.item());
  }

  onKeyDown(event: KeyboardEvent, action?: 'save' | 'cancel'): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (action === 'save') {
        this.onEditSave();
      } else if (action === 'cancel') {
        this.onEditCancel();
      } else {
        this.onEditSave();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.onEditCancel();
    }
  }

  onEditFieldKeyDown(
    event: KeyboardEvent,
    field: 'product_name' | 'quantity' | 'unit' | 'category_id'
  ): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!this.item().excluded) {
        this.onEditStart(field);
      }
    }
  }

  onBlur(): void {
    this.onEditSave();
  }

  onSelectionChange(): void {
    this.onEditSave();
  }
}
