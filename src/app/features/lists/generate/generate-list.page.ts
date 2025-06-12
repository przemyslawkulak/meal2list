import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { GenerationService } from '../../../core/supabase/generation.service';
import { ShoppingListService } from '../../../core/supabase/shopping-list.service';
import { ShoppingListItemsService } from '../../../core/supabase/shopping-list-items.service';
import { GenerationFormComponent } from './components/generation-form/generation-form.component';
import { ScrapingFormComponent } from './components/scraping-form/scraping-form.component';
import { GenerationStepsComponent } from './components/generation-steps/generation-steps.component';
import { OverlayComponent } from '../../../shared/ui/overlay/overlay.component';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  ShoppingListResponseDto,
  CreateShoppingListItemCommand,
  CreateRecipeCommand,
  CategoryDto,
} from '../../../../types';
import { CategoryService } from '@app/core/supabase/category.service';
import { NotificationService } from '@app/shared/services/notification.service';
import { LoggerService } from '@app/shared/services/logger.service';

@Component({
  selector: 'app-generate-list-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatRadioModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    GenerationFormComponent,
    ScrapingFormComponent,
    GenerationStepsComponent,
    OverlayComponent,
  ],
  templateUrl: './generate-list.page.html',
  styleUrls: ['./generate-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerateListPageComponent implements OnInit {
  private readonly generationService = inject(GenerationService);
  private readonly shoppingListService = inject(ShoppingListService);
  private readonly shoppingListItemsService = inject(ShoppingListItemsService);
  private readonly router = inject(Router);
  private readonly _categoryService = inject(CategoryService);
  private readonly notification = inject(NotificationService);
  private readonly logger = inject(LoggerService);

  constructor() {
    // Load shopping lists on component init
    this.loadShoppingLists();
    // Subscribe to categories
    this._categoryService.categories$.subscribe(categories => this.categories.set(categories));
  }

  ngOnInit(): void {
    // Check if we're returning from review screen with recipe text
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state;

    if (state && state['recipeText']) {
      this.initialRecipeText.set(state['recipeText']);
    }
  }

  // Signals for state management
  shoppingLists = signal<ShoppingListResponseDto[]>([]);
  selectedListId = signal<string>('');
  isGenerating = signal<boolean>(false);
  generationStatus = signal<'idle' | 'generating' | 'adding' | 'completed' | 'error'>('idle');
  generatedItems = signal<CreateShoppingListItemCommand[]>([]);
  errorMessage = signal<string | null>(null);
  categories = signal<CategoryDto[]>([]);
  initialRecipeText = signal<string>('');

  // Updated form selection signal
  selectedFormType = signal<'text' | 'scraping'>('scraping');
  activeFormType = signal<'text' | 'scraping' | null>(null);
  scrapedContent = signal<string>('');
  scrapingStatus = signal<'idle' | 'scraping' | 'success' | 'error'>('idle');
  scrapingErrorMessage = signal<string | null>(null);

  // Add content readiness tracking
  isContentReady = signal<boolean>(false);

  // Track if generation process has started
  hasGenerationStarted = signal<boolean>(false);

  private loadShoppingLists(): void {
    this.shoppingListService
      .getShoppingLists()
      .pipe(
        tap(lists => {
          this.shoppingLists.set(lists);
          // Auto-select first list if available
          if (lists.length > 0 && !this.selectedListId()) {
            this.selectedListId.set(lists[0].id);
          }
        })
      )
      .subscribe();
  }

  // New method for shopping list selection
  onListSelectionChange(listId: string): void {
    this.selectedListId.set(listId);
  }

  onGenerate(recipeText: string): void {
    const listId = this.selectedListId();
    if (!listId) return;

    this.hasGenerationStarted.set(true);
    this.generateFromContent(listId, recipeText, 'text');
  }

  // New method for radio button selection
  onFormTypeChange(formType: 'text' | 'scraping'): void {
    this.selectedFormType.set(formType);

    // Clear the inactive form when switching
    if (formType === 'text') {
      this.clearScrapingForm();
    } else {
      this.clearTextForm();
    }

    // Reset active form type to allow fresh selection
    this.activeFormType.set(null);
    this.isContentReady.set(false);
    this.hasGenerationStarted.set(false);
  }

  // Updated form coordination methods
  onTextFormChange(hasContent: boolean): void {
    if (hasContent && this.selectedFormType() === 'text') {
      this.activeFormType.set('text');
      this.isContentReady.set(true);
    } else if (!hasContent && this.activeFormType() === 'text') {
      this.activeFormType.set(null);
      this.isContentReady.set(false);
    }
  }

  onScrapingFormChange(hasContent: boolean): void {
    if (hasContent && this.selectedFormType() === 'scraping') {
      this.activeFormType.set('scraping');
    } else if (!hasContent && this.activeFormType() === 'scraping') {
      this.activeFormType.set(null);
    }
  }

  onScrapingSuccess(content: string): void {
    this.scrapedContent.set(content);
    this.scrapingStatus.set('success');
    this.scrapingErrorMessage.set(null);
    this.activeFormType.set('scraping');
    this.isContentReady.set(true);

    // Small delay to show the "content ready" step before auto-generating
    setTimeout(() => {
      this.onGenerateFromScraped();
    }, 1000);
  }

  onScrapingError(error: string): void {
    this.scrapingStatus.set('error');
    this.scrapingErrorMessage.set(error);
    this.scrapedContent.set('');
    this.isContentReady.set(false);
    this.hasGenerationStarted.set(false);
  }

  onScrapingStart(): void {
    this.scrapingStatus.set('scraping');
    this.scrapingErrorMessage.set(null);
    this.isContentReady.set(false);
    this.hasGenerationStarted.set(true);
  }

  private clearTextForm(): void {
    this.initialRecipeText.set('');
    this.isContentReady.set(false);
  }

  private clearScrapingForm(): void {
    this.scrapedContent.set('');
    this.scrapingStatus.set('idle');
    this.scrapingErrorMessage.set(null);
    this.isContentReady.set(false);
  }

  // Updated helper properties
  get isGenerationFormDisabled(): boolean {
    return this.selectedFormType() !== 'text' || this.isGenerating();
  }

  get isScrapingFormDisabled(): boolean {
    return (
      this.selectedFormType() !== 'scraping' ||
      this.isGenerating() ||
      this.scrapingStatus() === 'scraping'
    );
  }

  get hasAnyContent(): boolean {
    return this.activeFormType() !== null;
  }

  get canGenerate(): boolean {
    return (
      ((this.activeFormType() === 'text' && !!this.initialRecipeText()) ||
        (this.activeFormType() === 'scraping' &&
          this.scrapingStatus() === 'success' &&
          !!this.scrapedContent())) &&
      !this.isGenerating()
    );
  }

  // Utility methods for better UX
  clearAllForms(): void {
    this.clearTextForm();
    this.clearScrapingForm();
    this.activeFormType.set(null);
    this.selectedFormType.set('scraping');
    this.isContentReady.set(false);
    this.hasGenerationStarted.set(false);
    // Reset to first list if available
    if (this.shoppingLists().length > 0) {
      this.selectedListId.set(this.shoppingLists()[0].id);
    }
  }

  resetToIdle(): void {
    this.generationStatus.set('idle');
    this.errorMessage.set(null);
    this.generatedItems.set([]);
  }

  // New method for generating from scraped content
  onGenerateFromScraped(): void {
    const content = this.scrapedContent();
    const listId = this.selectedListId();

    if (!content || !listId) return;

    this.generateFromContent(listId, content, 'url');
  }

  private generateFromContent(listId: string, recipeText: string, source: 'text' | 'url'): void {
    this.isGenerating.set(true);
    this.generationStatus.set('generating');
    this.errorMessage.set(null);

    const command: CreateRecipeCommand = {
      title: 'Generated Recipe',
      recipe_text: recipeText,
    };

    this.generationService
      .generateForReview(command, this.categories(), 'pl')
      .pipe(
        tap(result => {
          console.log('Generated items for review:', result);
          this.generationStatus.set('completed');

          const navigationState = {
            items: result.items,
            listId: listId,
            recipeText: recipeText,
            recipeName: result.recipeName,
            recipeSource: source, // Dynamic source based on form type
          };

          console.log('Navigating to review with state:', {
            itemsCount: navigationState.items.length,
            listId: navigationState.listId,
            hasRecipeText: !!navigationState.recipeText,
            recipeName: navigationState.recipeName,
            source: navigationState.recipeSource,
          });

          // Navigate to review screen with data
          this.router.navigate(['/app/generate/review'], {
            state: navigationState,
          });
        }),
        catchError(error => {
          this.logger.logError(error, 'Generation error');
          const msg = error instanceof Error ? error.message : 'Generation failed';
          this.errorMessage.set(msg);
          this.notification.showError(msg);
          this.generationStatus.set('error');
          return of(null);
        }),
        finalize(() => {
          this.isGenerating.set(false);
        })
      )
      .subscribe();
  }

  // Helper computed properties for templates
  get hasContent(): boolean {
    return this.activeFormType() === 'text'
      ? !!this.initialRecipeText()
      : this.activeFormType() === 'scraping'
        ? !!this.scrapedContent()
        : false;
  }
}
