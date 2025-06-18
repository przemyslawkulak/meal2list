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
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>Edytuj Produkt</h2>
      <button mat-icon-button mat-dialog-close class="close-button">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <form [formGroup]="editForm" class="edit-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nazwa produktu</mat-label>
          <input matInput formControlName="product_name" placeholder="Wprowadź nazwę produktu" />
          @if (editForm.get('product_name')?.hasError('required')) {
            <mat-error>Nazwa produktu jest wymagana</mat-error>
          }
        </mat-form-field>

        <div class="quantity-unit-row">
          <mat-form-field appearance="outline" class="quantity-field">
            <mat-label>Ilość</mat-label>
            <input matInput type="number" step="0.1" formControlName="quantity" placeholder="0" />
            @if (editForm.get('quantity')?.hasError('required')) {
              <mat-error>Ilość jest wymagana</mat-error>
            }
            @if (editForm.get('quantity')?.hasError('min')) {
              <mat-error>Ilość musi być większa od 0</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="unit-field">
            <mat-label>Jednostka</mat-label>
            <mat-select formControlName="unit">
              @for (unit of standardUnits; track unit) {
                <mat-option [value]="unit">{{ unit }}</mat-option>
              }
            </mat-select>
            @if (editForm.get('unit')?.hasError('required')) {
              <mat-error>Jednostka jest wymagana</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Kategoria</mat-label>
          <mat-select formControlName="category_id">
            @for (category of data.categories; track category.id) {
              <mat-option [value]="category.id">{{ category.name }}</mat-option>
            }
          </mat-select>
          @if (editForm.get('category_id')?.hasError('required')) {
            <mat-error>Kategoria jest wymagana</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button mat-dialog-close class="cancel-button">Anuluj</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="editForm.invalid"
        (click)="onSave()"
        class="save-button"
      >
        <mat-icon>save</mat-icon>
        Zapisz
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px 0;

      h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
      }

      .close-button {
        margin-right: -8px;
      }
    }

    .dialog-content {
      padding: 16px 24px;
    }

    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .quantity-unit-row {
      display: flex;
      gap: 12px;

      .quantity-field {
        flex: 1;
      }

      .unit-field {
        flex: 1;
      }
    }

    .dialog-actions {
      padding: 8px 24px 16px;
      gap: 12px;

      .cancel-button {
        flex: 1;
      }

      .save-button {
        flex: 2;
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    @media (max-width: 480px) {
      .dialog-header,
      .dialog-content,
      .dialog-actions {
        padding-left: 16px;
        padding-right: 16px;
      }

      .quantity-unit-row {
        flex-direction: column;
        gap: 16px;
      }
    }
  `,
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
