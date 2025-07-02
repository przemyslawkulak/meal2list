import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

import { GenerationReviewItemDto, CategoryDto } from '../../../../../../../types';

export interface EditItemDialogData {
  item: GenerationReviewItemDto;
  categories: CategoryDto[];
}

export interface EditItemDialogResult {
  item: GenerationReviewItemDto;
}

@Component({
  selector: 'app-edit-item-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './edit-item-modal.component.html',
  styleUrls: ['./edit-item-modal.component.scss'],
})
export class EditItemModalComponent {
  private dialogRef = inject(MatDialogRef<EditItemModalComponent>);
  data = inject<EditItemDialogData>(MAT_DIALOG_DATA);

  standardUnits = ['szt', 'g', 'ml', 'l', 'opak', 'szczypta'];

  editForm = new FormGroup({
    product_name: new FormControl(this.data.item.product_name, {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(1)],
    }),
    quantity: new FormControl(this.data.item.quantity, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    unit: new FormControl(this.data.item.unit, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    category_id: new FormControl(this.data.item.category_id, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  onSave(): void {
    if (this.editForm.valid) {
      const result: EditItemDialogResult = {
        item: {
          ...this.data.item,
          product_name: this.editForm.value.product_name!,
          quantity: this.editForm.value.quantity!,
          unit: this.editForm.value.unit!,
          category_id: this.editForm.value.category_id!,
          isModified: true,
        },
      };
      this.dialogRef.close(result);
    }
  }
}
