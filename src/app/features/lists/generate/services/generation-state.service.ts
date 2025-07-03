import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { GenerationService } from '@app/core/supabase/generation.service';
import { ShoppingListService } from '@app/core/supabase/shopping-list.service';
import { CategoryService } from '@app/core/supabase/category.service';
import { NotificationService } from '@app/shared/services/notification.service';
import { LoggerService } from '@app/shared/services/logger.service';
import { CreateRecipeCommand, ShoppingListResponseDto, CategoryDto } from '../../../../../types';

export type GenerationStatus = 'idle' | 'generating' | 'adding' | 'completed' | 'error';

@Injectable({
  providedIn: 'root',
})
export class GenerationStateService {
  private readonly generationService = inject(GenerationService);
  private readonly shoppingListService = inject(ShoppingListService);
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  private readonly logger = inject(LoggerService);

  // State signals
  private readonly _shoppingLists = signal<ShoppingListResponseDto[]>([]);
  private readonly _selectedListId = signal<string>('');
  private readonly _isGenerating = signal<boolean>(false);
  private readonly _generationStatus = signal<GenerationStatus>('idle');
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _categories = signal<CategoryDto[]>([]);
  private readonly _hasGenerationStarted = signal<boolean>(false);

  // Public readonly signals
  readonly shoppingLists = this._shoppingLists.asReadonly();
  readonly selectedListId = this._selectedListId.asReadonly();
  readonly isGenerating = this._isGenerating.asReadonly();
  readonly generationStatus = this._generationStatus.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly categories = this._categories.asReadonly();
  readonly hasGenerationStarted = this._hasGenerationStarted.asReadonly();

  // Computed properties
  readonly canGenerate = computed(() => {
    const listId = this._selectedListId();
    const isGenerating = this._isGenerating();
    return !!listId && !isGenerating;
  });

  constructor() {
    this.initializeService();
  }

  private initializeService(): void {
    this.loadShoppingLists();
    this.subscribeToCategories();
  }

  // Shopping list management
  loadShoppingLists(): void {
    this.shoppingListService
      .getShoppingLists()
      .pipe(
        tap(lists => {
          this._shoppingLists.set(lists);
          // Auto-select first list if available and none selected
          if (lists.length > 0 && !this._selectedListId()) {
            this._selectedListId.set(lists[0].id);
          }
        }),
        catchError(error => {
          this.logger.logError(error, 'Failed to load shopping lists');
          this.notification.showError('Nie udało się załadować list zakupów');
          return of([]);
        })
      )
      .subscribe();
  }

  setSelectedListId(listId: string): void {
    this._selectedListId.set(listId);
  }

  // Categories management
  private subscribeToCategories(): void {
    this.categoryService.categories$.subscribe(categories => {
      this._categories.set(categories);
    });
  }

  // Generation management
  generateFromContent(recipeText: string, source: 'text' | 'url', sourceLabel: string): void {
    const listId = this._selectedListId();
    if (!listId || !recipeText.trim()) {
      this.notification.showError('Brak wybranej listy lub treści przepisu');
      return;
    }

    this._startGeneration();

    const command: CreateRecipeCommand = {
      title: 'Generated Recipe',
      recipe_text: recipeText,
    };

    this.generationService
      .generateForReview(command, this._categories(), 'pl')
      .pipe(
        tap(result => {
          this._completeGeneration();
          this._navigateToReview(result, listId, recipeText, sourceLabel);
        }),
        catchError(error => {
          this._handleGenerationError(error);
          return of(null);
        }),
        finalize(() => {
          this._isGenerating.set(false);
        })
      )
      .subscribe();
  }

  // Generation flow control
  startGenerationProcess(): void {
    this._hasGenerationStarted.set(true);
  }

  resetGenerationState(): void {
    this._generationStatus.set('idle');
    this._errorMessage.set(null);
    this._hasGenerationStarted.set(false);
  }

  resetToIdle(): void {
    this._generationStatus.set('idle');
    this._errorMessage.set(null);
    this._hasGenerationStarted.set(false);
  }

  // Check for navigation state on init
  checkNavigationState(): string | null {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state;
    return state?.['recipeText'] || null;
  }

  // Private helper methods
  private _startGeneration(): void {
    this._isGenerating.set(true);
    this._generationStatus.set('generating');
    this._errorMessage.set(null);
    this._hasGenerationStarted.set(true);
  }

  private _completeGeneration(): void {
    this._generationStatus.set('completed');
  }

  private _handleGenerationError(error: Error): void {
    this.logger.logError(error, 'Generation error');
    const message =
      error instanceof Error ? error.message : 'Nie udało się wygenerować listy zakupów';
    this._errorMessage.set(message);
    this._generationStatus.set('error');
    this.notification.showError(message);
  }

  private _navigateToReview(
    result: { items: unknown[]; recipeName: string },
    listId: string,
    recipeText: string,
    sourceLabel: string
  ): void {
    const navigationState = {
      items: result.items,
      listId: listId,
      recipeText: recipeText,
      recipeName: result.recipeName,
      recipeSource: sourceLabel,
    };

    this.logger.logInfo(
      'Navigating to review',
      JSON.stringify({
        itemsCount: navigationState.items.length,
        listId: navigationState.listId,
        hasRecipeText: !!navigationState.recipeText,
        recipeName: navigationState.recipeName,
        source: navigationState.recipeSource,
      })
    );

    this.router.navigate(['/app/generate/review'], {
      state: navigationState,
    });
  }
}
