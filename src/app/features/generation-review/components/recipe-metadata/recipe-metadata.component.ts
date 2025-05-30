import { Component, input, output, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-recipe-metadata',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './recipe-metadata.component.html',
  styleUrl: './recipe-metadata.component.scss',
})
export class RecipeMetadataComponent implements OnInit, OnDestroy {
  // Inputs using new Angular 19 syntax
  recipeName = input.required<string>();
  recipeSource = input.required<string>();
  disabled = input<boolean>(false);

  // Outputs using new Angular 19 syntax
  recipeNameChange = output<string>();
  recipeSourceChange = output<string>();
  validationChange = output<boolean>(); // New output for validation state

  // Internal state signals
  isEditingRecipeName = signal<boolean>(false);
  isEditingRecipeSource = signal<boolean>(false);

  // Form controls
  recipeNameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(1)],
  });

  recipeSourceControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(1)],
  });

  // Subscription management
  private destroy$ = new Subject<void>();

  constructor() {
    // Effect to update form controls when inputs change
    effect(() => {
      if (!this.isEditingRecipeName()) {
        this.recipeNameControl.setValue(this.recipeName());
      }
      if (!this.isEditingRecipeSource()) {
        this.recipeSourceControl.setValue(this.recipeSource());
      }
      this.emitValidationState();
    });
  }

  ngOnInit(): void {
    // Initialize form controls with input values
    this.recipeNameControl.setValue(this.recipeName());
    this.recipeSourceControl.setValue(this.recipeSource());

    // Listen to form control changes to emit validation state
    this.recipeNameControl.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.emitValidationState());

    this.recipeSourceControl.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.emitValidationState());

    // Initial validation state
    this.emitValidationState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private emitValidationState(): void {
    const isValid = this.recipeNameControl.valid && this.recipeSourceControl.valid;
    this.validationChange.emit(isValid);
  }

  // Recipe name editing methods
  startEditRecipeName(): void {
    if (this.disabled()) return;

    this.recipeNameControl.setValue(this.recipeName());
    this.isEditingRecipeName.set(true);

    setTimeout(() => {
      const element = document.querySelector('[data-field="recipe-name"] input') as HTMLElement;
      if (element) {
        element.focus();
      }
    }, 100);
  }

  saveRecipeName(): void {
    if (this.recipeNameControl.valid) {
      this.recipeNameChange.emit(this.recipeNameControl.value);
      this.isEditingRecipeName.set(false);
    }
  }

  cancelEditRecipeName(): void {
    this.recipeNameControl.setValue(this.recipeName());
    this.isEditingRecipeName.set(false);
  }

  autoSaveRecipeName(): void {
    if (this.recipeNameControl.valid) {
      this.saveRecipeName();
    }
  }

  // Recipe source editing methods
  startEditRecipeSource(): void {
    if (this.disabled()) return;

    this.recipeSourceControl.setValue(this.recipeSource());
    this.isEditingRecipeSource.set(true);

    setTimeout(() => {
      const element = document.querySelector('[data-field="recipe-source"] input') as HTMLElement;
      if (element) {
        element.focus();
      }
    }, 100);
  }

  saveRecipeSource(): void {
    if (this.recipeSourceControl.valid) {
      this.recipeSourceChange.emit(this.recipeSourceControl.value);
      this.isEditingRecipeSource.set(false);
    }
  }

  cancelEditRecipeSource(): void {
    this.recipeSourceControl.setValue(this.recipeSource());
    this.isEditingRecipeSource.set(false);
  }

  autoSaveRecipeSource(): void {
    if (this.recipeSourceControl.valid) {
      this.saveRecipeSource();
    }
  }

  // Keyboard navigation
  onRecipeKeyDown(event: KeyboardEvent, field: 'name' | 'source'): void {
    if (this.disabled()) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      if (field === 'name') {
        if (this.isEditingRecipeName()) {
          this.autoSaveRecipeName();
        } else {
          this.startEditRecipeName();
        }
      } else {
        if (this.isEditingRecipeSource()) {
          this.autoSaveRecipeSource();
        } else {
          this.startEditRecipeSource();
        }
      }
    } else if (event.key === ' ' && (event.target as HTMLElement).tagName === 'SPAN') {
      event.preventDefault();
      if (field === 'name') {
        this.startEditRecipeName();
      } else {
        this.startEditRecipeSource();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (field === 'name') {
        this.cancelEditRecipeName();
      } else {
        this.cancelEditRecipeSource();
      }
    }
  }
}
