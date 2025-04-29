import { Component, ChangeDetectionStrategy, inject, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators, FormGroup } from '@angular/forms';

// Material Modules
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list'; // Needed for static list items
import { MatIconModule } from '@angular/material/icon'; // For card/list icons
import { MatButtonModule } from '@angular/material/button'; // For raw mat-button example
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field'; // Needed for mat-error

// Custom Components
import { ButtonComponent } from '@components/button/button.component';
import { InputComponent } from '@components/input/input.component';
import { CardComponent } from '@components/card/card.component';
import { ListComponent } from '@components/list/list.component';

interface ListItem {
  id: number;
  name: string;
  value: number;
}

@Component({
  selector: 'app-kitchen-sink-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Material
    MatDividerModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatToolbarModule,
    MatCheckboxModule,
    MatFormFieldModule,
    // Custom Components
    ButtonComponent,
    InputComponent,
    CardComponent,
    ListComponent,
  ],
  templateUrl: './kitchen-sink.page.html',
  styleUrls: ['./kitchen-sink.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenSinkPageComponent {
  // Inject services
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // --- Input Controls ---
  nameControl = new FormControl('', [Validators.required]);
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  disabledControl = new FormControl({ value: 'Cannot change', disabled: true });

  // --- Simple Form Group ---
  demoForm = new FormGroup({
    address: new FormControl(''),
    city: new FormControl('', Validators.required),
    termsAccepted: new FormControl(false, Validators.requiredTrue),
  });

  // --- List Data ---
  listItems: ListItem[] = [
    { id: 1, name: 'Item Alpha', value: 100 },
    { id: 2, name: 'Item Beta', value: 250 },
    { id: 3, name: 'Item Gamma', value: 50 },
  ];

  onButtonClick(message: string): void {
    console.log(`Button clicked: ${message}`);
    // In a real app, you might show a snackbar or perform an action
  }

  // --- Dialog --- Method to open a simple dialog
  openDialog(templateRef: TemplateRef<unknown>): void {
    this.dialog.open(templateRef);
  }

  // --- Snackbar --- Method to show a snackbar
  showSnackbar(): void {
    this.snackBar.open('This is a Material Snackbar!', 'Close', {
      duration: 3000, // Duration in milliseconds
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  // --- Form Submit --- Example submit handler
  onFormSubmit(): void {
    if (this.demoForm.valid) {
      console.log('Form Submitted:', this.demoForm.value);
      this.snackBar.open('Form Submitted Successfully!', 'OK', { duration: 2000 });
    } else {
      console.error('Form is invalid');
      // Mark fields as touched to show errors
      this.demoForm.markAllAsTouched();
    }
  }
}
