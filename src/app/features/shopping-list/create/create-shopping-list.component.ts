import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { catchError, EMPTY } from 'rxjs';
import { ShoppingListService } from '../../../core/supabase/shopping-list.service';
import { CreateShoppingListCommand } from '../../../../types';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-shopping-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './create-shopping-list.component.html',
  styleUrls: ['./create-shopping-list.component.scss'],
})
export class CreateShoppingListComponent {
  shoppingListForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private shoppingListService: ShoppingListService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.shoppingListForm = this.fb.group({
      name: ['', [Validators.required]], // TODO: add validation uniqueness name
      recipe_id: [''],
    });
  }

  onSubmit(): void {
    if (this.shoppingListForm.valid) {
      const command: CreateShoppingListCommand = this.shoppingListForm.value;

      this.shoppingListService
        .createShoppingList(command)
        .pipe(
          catchError(error => {
            const message = error.message || 'Failed to create shopping list';
            this.snackBar.open(message, 'Close', {
              duration: 3000,
              panelClass: error.statusCode === 400 ? 'error-snackbar' : 'warning-snackbar',
            });
            console.error('Error creating shopping list:', error);
            return EMPTY;
          })
        )
        .subscribe(() => {
          this.snackBar.open('Shopping list created successfully', 'Close', {
            duration: 3000,
            panelClass: 'success-snackbar',
          });
          this.router.navigate(['/shopping-lists']);
        });
    }
  }

  onCancel(): void {
    this.router.navigate(['/shopping-lists']);
  }
}
