import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GeneratedListResponseDto } from '../../../types';
import { GenerationService } from '../../core/supabase/generation.service';

@Component({
  selector: 'app-generation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './generation.component.html',
  styleUrls: ['./generation.component.scss'],
})
export class ShoppingListGenerationComponent {
  generationForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private generationService: GenerationService,
    private snackBar: MatSnackBar
  ) {
    this.generationForm = this.fb.group({
      recipe_text: ['', [Validators.required, Validators.maxLength(5000)]],
    });
  }

  onSubmit(): void {
    if (this.generationForm.invalid) return;

    this.isLoading = true;
    const command = this.generationForm.value;

    this.generationService.generateFromText(command).subscribe({
      next: (response: GeneratedListResponseDto) => {
        this.isLoading = false;
        this.snackBar.open('Shopping list generated successfully!', 'Close', {
          duration: 3000,
        });
        // TODO: Handle the generated list (e.g., navigate to it or display it)
        console.log('Generated list:', response);
      },
      error: (error: { message: string }) => {
        this.isLoading = false;
        this.snackBar.open(error.message || 'Failed to generate shopping list', 'Close', {
          duration: 5000,
        });
      },
    });
  }
}
