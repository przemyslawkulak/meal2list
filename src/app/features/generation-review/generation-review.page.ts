import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { tap, catchError, finalize } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { GenerationService } from '@core/supabase/generation.service';
import { CategoryService } from '@core/supabase/category.service';
import { GenerationReviewItemDto, CategoryDto } from '../../../types';
import {
  ReviewTableComponent,
  ReviewHeaderComponent,
  RecipeMetadataComponent,
  ReviewActionsComponent,
} from './components';
import { ReviewValidationService, ReviewStateService } from './services';

@Component({
  selector: 'app-generation-review',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    ReviewHeaderComponent,
    RecipeMetadataComponent,
    ReviewTableComponent,
    ReviewActionsComponent,
  ],
  templateUrl: './generation-review.page.html',
  styleUrl: './generation-review.page.scss',
})
export class GenerationReviewPageComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly generationService = inject(GenerationService);
  private readonly categoryService = inject(CategoryService);
  private readonly validationService = inject(ReviewValidationService);
  private readonly stateService = inject(ReviewStateService);

  // Signals for reactive state management
  reviewItems = signal<GenerationReviewItemDto[]>([]);
  categories = signal<CategoryDto[]>([]);
  isProcessing = signal<boolean>(false);
  formErrors = signal<string[]>([]);
  recipeName = signal<string>('');
  recipeSource = signal<string>('text');
  isRecipeMetadataValid = signal<boolean>(true);

  // Navigation state
  private listId = '';
  private recipeText = '';

  // Destroy subject for subscription cleanup
  private destroy$ = new Subject<void>();

  // Computed values
  includedItemsCount = computed(() => this.reviewItems().filter(item => !item.excluded).length);

  hasValidItems = computed(() => {
    const items = this.reviewItems();
    const errors = this.formErrors();
    const metadataValid = this.isRecipeMetadataValid();

    return this.validationService.hasValidItems(items, errors) && metadataValid;
  });

  ngOnInit(): void {
    this.loadNavigationState();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadNavigationState(): void {
    const navigationState = this.stateService.loadNavigationState();

    if (!navigationState) {
      console.warn('No review data found in navigation state. Expected items and listId.');

      this.snackBar.open('Brak danych do przeglądu. Przekierowanie...', 'Zamknij', {
        duration: 3000,
      });

      setTimeout(() => {
        this.router.navigate(['/generate']);
      }, 1000);
      return;
    }

    this.reviewItems.set(navigationState.items);
    this.listId = navigationState.listId;
    this.recipeText = navigationState.recipeText || '';
    this.recipeName.set(navigationState.recipeName || '');
    this.recipeSource.set(navigationState.recipeSource || 'text');

    this.validateForm();
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

  onItemsChange(updatedItems: GenerationReviewItemDto[]): void {
    this.reviewItems.set(updatedItems);
    this.validateForm();
  }

  onRecipeNameChange(name: string): void {
    this.recipeName.set(name);
    this.validateForm();
  }

  onRecipeSourceChange(source: string): void {
    this.recipeSource.set(source);
    this.validateForm();
  }

  onRecipeMetadataValidationChange(isValid: boolean): void {
    this.isRecipeMetadataValid.set(isValid);
  }

  private validateForm(): void {
    const itemErrors = this.validationService.validateItems(this.reviewItems());
    this.formErrors.set(itemErrors);
  }

  goBack(): void {
    const navigationState = this.stateService.createNavigationState({
      items: [],
      listId: this.listId,
      recipeText: this.recipeText,
      recipeName: this.recipeName(),
      recipeSource: this.recipeSource(),
    });

    this.router.navigate(['/generate'], {
      state: navigationState,
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
    const currentRecipeName = this.recipeName();

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
