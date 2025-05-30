import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { tap, catchError, finalize } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { GenerationService } from '@core/supabase/generation.service';
import { CategoryService } from '@core/supabase/category.service';
import { GenerationReviewItemDto, CategoryDto } from '../../../types';
import { ReviewTableComponent } from './components/review-table/review-table.component';
@Component({
  selector: 'app-generation-review',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
    ReviewTableComponent,
  ],
  templateUrl: './generation-review.page.html',
  styleUrl: './generation-review.page.scss',
})
export class GenerationReviewPageComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly generationService = inject(GenerationService);
  private readonly categoryService = inject(CategoryService);

  // Signals for reactive state management
  reviewItems = signal<GenerationReviewItemDto[]>([]);
  categories = signal<CategoryDto[]>([]);
  isProcessing = signal<boolean>(false);
  formErrors = signal<string[]>([]);
  recipeName = signal<string>('');
  recipeSource = signal<string>('text');

  // Recipe editing states
  isEditingRecipeName = signal<boolean>(false);
  isEditingRecipeSource = signal<boolean>(false);

  // Recipe form controls
  recipeNameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(1)],
  });

  recipeSourceControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(1)],
  });

  // Navigation state
  private listId = '';
  private recipeText = '';

  // Destroy subject for subscription cleanup
  private destroy$ = new Subject<void>();

  // Computed values
  includedItemsCount = computed(() => this.reviewItems().filter(item => !item.excluded).length);

  hasValidItems = computed(() => {
    const items = this.reviewItems();
    const includedItems = items.filter(item => !item.excluded);
    return includedItems.length > 0 && this.formErrors().length === 0;
  });

  // Form for validation
  reviewForm: FormGroup = this.fb.group({
    items: this.fb.array([]),
  });

  get itemsFormArray(): FormArray {
    return this.reviewForm.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.loadNavigationState();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadNavigationState(): void {
    // Get state from window.history.state which persists after navigation
    const state = window.history.state;

    // Check if we have the required data
    if (!state || !state.items || !state.listId) {
      console.warn('No review data found in navigation state. Expected items and listId.', {
        hasState: !!state,
        hasItems: !!state?.items,
        hasListId: !!state?.listId,
        stateKeys: state ? Object.keys(state) : [],
      });

      this.snackBar.open('Brak danych do przeglądu. Przekierowanie...', 'Zamknij', {
        duration: 3000,
      });

      setTimeout(() => {
        this.router.navigate(['/generate']);
      }, 1000);
      return;
    }

    this.reviewItems.set(state.items);
    this.listId = state.listId;
    this.recipeText = state.recipeText || '';
    this.recipeName.set(state.recipeName || '');
    this.recipeSource.set(state.recipeSource || 'text');

    this.initializeForm();
  }

  private loadCategories(): void {
    this.categoryService.categories$
      .pipe(
        tap(categories => this.categories.set(categories)),
        catchError(error => {
          console.error('Error loading categories:', error);
          this.snackBar.open('Błąd podczas ładowania kategorii', 'Zamknij', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  private initializeForm(): void {
    const itemsArray = this.fb.array(
      this.reviewItems().map(item => this.createItemFormGroup(item))
    );
    this.reviewForm.setControl('items', itemsArray);
  }

  private createItemFormGroup(item: GenerationReviewItemDto): FormGroup {
    return this.fb.group({
      id: [item.id],
      product_name: [item.product_name, [Validators.required, Validators.minLength(1)]],
      quantity: [item.quantity, [Validators.required, Validators.min(0.01)]],
      unit: [item.unit, [Validators.required]],
      category_id: [item.category_id, [Validators.required]],
      excluded: [item.excluded],
      source: [item.source],
      isModified: [item.isModified || false],
    });
  }

  onItemsChange(updatedItems: GenerationReviewItemDto[]): void {
    this.reviewItems.set(updatedItems);
    this.validateForm();
  }

  onRecipeNameChange(name: string): void {
    this.recipeName.set(name);
  }

  onRecipeSourceChange(source: string): void {
    this.recipeSource.set(source);
  }

  // Recipe editing methods
  startEditRecipeName(): void {
    this.recipeNameControl.setValue(this.recipeName());
    this.isEditingRecipeName.set(true);

    setTimeout(() => {
      const element = document.querySelector('[data-field="recipe-name"] input') as HTMLElement;
      if (element) {
        element.focus();
      }
    }, 100);
  }

  startEditRecipeSource(): void {
    this.recipeSourceControl.setValue(this.recipeSource());
    this.isEditingRecipeSource.set(true);

    setTimeout(() => {
      const element = document.querySelector('[data-field="recipe-source"] input') as HTMLElement;
      if (element) {
        element.focus();
      }
    }, 100);
  }

  saveRecipeName(): void {
    if (this.recipeNameControl.valid) {
      this.recipeName.set(this.recipeNameControl.value);
      this.isEditingRecipeName.set(false);
    }
  }

  saveRecipeSource(): void {
    if (this.recipeSourceControl.valid) {
      this.recipeSource.set(this.recipeSourceControl.value);
      this.isEditingRecipeSource.set(false);
    }
  }

  cancelEditRecipeName(): void {
    this.recipeNameControl.setValue(this.recipeName());
    this.isEditingRecipeName.set(false);
  }

  cancelEditRecipeSource(): void {
    this.recipeSourceControl.setValue(this.recipeSource());
    this.isEditingRecipeSource.set(false);
  }

  // Auto-save for recipe fields
  autoSaveRecipeName(): void {
    if (this.recipeNameControl.valid) {
      this.saveRecipeName();
    }
  }

  autoSaveRecipeSource(): void {
    if (this.recipeSourceControl.valid) {
      this.saveRecipeSource();
    }
  }

  // Keyboard navigation for recipe fields
  onRecipeKeyDown(event: KeyboardEvent, field: 'name' | 'source'): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      // Check if we're in edit mode (input field) or display mode (span)
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
      // Space key only works for span elements (not input fields)
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

  private validateForm(): void {
    const errors: string[] = [];
    const items = this.reviewItems();
    const includedItems = items.filter(item => !item.excluded);

    if (includedItems.length === 0) {
      errors.push('Musisz wybrać przynajmniej jeden produkt');
    }

    // Validate individual items
    includedItems.forEach((item, index) => {
      if (!item.product_name?.trim()) {
        errors.push(`Produkt ${index + 1}: Nazwa nie może być pusta`);
      }
      if (item.quantity <= 0) {
        errors.push(`Produkt ${index + 1}: Ilość musi być większa od 0`);
      }
      if (!item.unit?.trim()) {
        errors.push(`Produkt ${index + 1}: Jednostka jest wymagana`);
      }
      if (!item.category_id) {
        errors.push(`Produkt ${index + 1}: Kategoria jest wymagana`);
      }
    });

    this.formErrors.set(errors);
  }

  goBack(): void {
    this.router.navigate(['/generate'], {
      state: {
        recipeText: this.recipeText,
        recipeName: this.recipeName(),
        recipeSource: this.recipeSource(),
      },
    });
  }

  confirmAndAdd(): void {
    if (!this.hasValidItems()) {
      this.snackBar.open('Popraw błędy przed kontynuowaniem', 'Zamknij', {
        duration: 3000,
      });
      return;
    }

    this.isProcessing.set(true);

    const itemsToConfirm = this.reviewItems().filter(item => !item.excluded);
    const currentRecipeName = this.recipeName(); // Get current recipe name from signal

    this.generationService
      .confirmReviewedItems(this.listId, itemsToConfirm, currentRecipeName)
      .pipe(
        tap(() => {
          this.snackBar.open(
            `Dodano ${itemsToConfirm.length} produktów z recepty "${currentRecipeName}" do listy zakupów`,
            'Zamknij',
            { duration: 3000 }
          );
          this.router.navigate(['/lists', this.listId]);
        }),
        catchError(error => {
          console.error('Error confirming items:', error);
          this.snackBar.open('Błąd podczas dodawania produktów do listy', 'Zamknij', {
            duration: 5000,
          });
          return of(null);
        }),
        finalize(() => this.isProcessing.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }
}
