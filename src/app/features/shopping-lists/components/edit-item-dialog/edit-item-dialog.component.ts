import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type {
  ShoppingListItemResponseDto,
  CategoryDto,
  UpdateShoppingListItemCommand,
} from '../../../../../types';
import { CategoryIconComponent } from '@app/shared/category-icon/category-icon.component';

export interface EditItemDialogData {
  item: ShoppingListItemResponseDto;
  categories: CategoryDto[];
  listId: string;
}

export interface UpdatedShoppingListItem {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  category_id: string;
  product_id?: string;
}

@Component({
  selector: 'app-edit-item-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    CategoryIconComponent,
  ],
  templateUrl: './edit-item-dialog.component.html',
  styleUrl: './edit-item-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditItemDialogComponent implements OnInit {
  editForm: FormGroup;

  readonly units = [
    'szt',
    'kg',
    'g',
    'l',
    'ml',
    'opak',
    'puszka',
    'butelka',
    'słoik',
    'saszetka',
    'kostka',
    'łyżka',
    'łyżeczka',
    'szklanka',
    'garść',
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditItemDialogData
  ) {
    this.editForm = this.createForm();
  }

  ngOnInit(): void {
    this.populateForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      product_name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
      quantity: [1, [Validators.required, Validators.min(0.01), Validators.max(9999)]],
      unit: ['', [Validators.maxLength(50)]],
      category_id: ['', [Validators.required]],
    });
  }

  private populateForm(): void {
    const { item } = this.data;
    this.editForm.patchValue({
      product_name: item.product_name,
      quantity: item.quantity,
      unit: item.unit || '',
      category_id: item.category_id,
    });
  }

  getCategoryName(categoryId: string): string {
    const category = this.data.categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  }

  incrementQuantity(): void {
    const quantityControl = this.editForm.get('quantity');
    if (quantityControl) {
      const currentValue = quantityControl.value || 0;
      const newValue = Math.min(currentValue + 1, 9999);
      quantityControl.setValue(newValue);
    }
  }

  decrementQuantity(): void {
    const quantityControl = this.editForm.get('quantity');
    if (quantityControl) {
      const currentValue = quantityControl.value || 0;
      const newValue = Math.max(currentValue - 1, 0.01);
      quantityControl.setValue(newValue);
    }
  }

  onSave(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const formValue = this.editForm.value;
    const originalItem = this.data.item;

    // Check if any values have actually changed
    const hasChanges =
      formValue.product_name !== originalItem.product_name ||
      formValue.quantity !== originalItem.quantity ||
      formValue.unit !== (originalItem.unit || '') ||
      formValue.category_id !== originalItem.category_id;

    if (!hasChanges) {
      this.dialogRef.close();
      return;
    }

    const updates: UpdateShoppingListItemCommand = {};

    if (formValue.product_name !== originalItem.product_name) {
      updates.product_name = formValue.product_name;
    }

    if (formValue.quantity !== originalItem.quantity) {
      updates.quantity = formValue.quantity;
    }

    if (formValue.unit !== (originalItem.unit || '')) {
      updates.unit = formValue.unit || undefined;
    }

    if (formValue.category_id !== originalItem.category_id) {
      updates.category_id = formValue.category_id;
    }

    const result: UpdatedShoppingListItem = {
      id: originalItem.id,
      product_name: formValue.product_name,
      quantity: formValue.quantity,
      unit: formValue.unit,
      category_id: formValue.category_id,
    };

    this.dialogRef.close({ updates, result });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getErrorMessage(fieldName: string): string {
    const control = this.editForm.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    if (errors['required']) {
      return `${
        fieldName === 'product_name'
          ? 'Nazwa produktu'
          : fieldName === 'category_id'
            ? 'Kategoria'
            : fieldName === 'quantity'
              ? 'Ilość'
              : fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
      } jest wymagana`;
    }

    if (errors['minlength']) {
      return `${fieldName === 'product_name' ? 'Nazwa produktu' : fieldName} jest za krótka`;
    }

    if (errors['maxlength']) {
      return `${fieldName === 'product_name' ? 'Nazwa produktu' : fieldName} jest za długa`;
    }

    if (errors['min']) {
      return 'Ilość musi być większa od 0';
    }

    if (errors['max']) {
      return 'Wartość jest za duża';
    }

    return 'Nieprawidłowa wartość';
  }
}
