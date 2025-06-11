import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
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
import { NotificationService } from '@app/shared/services/notification.service';
import { LoggerService } from '@app/shared/services/logger.service';

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
  private readonly notification = inject(NotificationService);
  private readonly generationService = inject(GenerationService);
  private readonly categoryService = inject(CategoryService);
  private readonly validationService = inject(ReviewValidationService);
  private readonly stateService = inject(ReviewStateService);
  private readonly logger = inject(LoggerService);

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

      this.notification.showError('Brak danych do przeglądu. Przekierowanie...');

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
          this.logger.logError(error, 'Error loading categories');
          this.notification.showError('Błąd podczas ładowania kategorii');
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
      this.notification.showError('Popraw błędy przed kontynuowaniem');
      return;
    }

    this.isProcessing.set(true);

    const itemsToConfirm = this.reviewItems().filter(item => !item.excluded);
    const currentRecipeName = this.recipeName();

    this.generationService
      .confirmReviewedItems(this.listId, itemsToConfirm, currentRecipeName)
      .pipe(
        tap(() => {
          this.notification.showSuccess(
            `Dodano ${itemsToConfirm.length} produktów z recepty "${currentRecipeName}" do listy zakupów`
          );
          this.router.navigate(['/lists', this.listId]);
        }),
        catchError(error => {
          this.logger.logError(error, 'Error confirming items');
          this.notification.showError('Błąd podczas dodawania produktów do listy');
          return of(null);
        }),
        finalize(() => this.isProcessing.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }
}
