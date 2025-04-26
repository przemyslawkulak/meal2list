import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-new-shopping-list-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './new-shopping-list-dialog.component.html',
  styleUrls: ['./new-shopping-list-dialog.component.scss'],
})
export class NewShoppingListDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<NewShoppingListDialogComponent>);

  readonly form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
  });

  readonly formValid = signal(false);

  readonly hasRequiredError = computed(
    () => this.form.get('name')?.touched && this.form.get('name')?.hasError('required')
  );

  readonly hasMaxLengthError = computed(() => this.form.get('name')?.hasError('maxlength'));

  constructor() {
    // Update formValid signal whenever form state changes
    effect(() => {
      this.form.valueChanges.subscribe(() => {
        this.formValid.set(this.form.valid);
        console.log('Form validity updated:', this.form.valid);
      });
    });
  }

  ngOnInit(): void {
    // Initial form state
    this.formValid.set(this.form.valid);
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.get('name')?.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
