import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { GenerationService } from '../../../core/supabase/generation.service';
import { ShoppingListService } from '../../../core/supabase/shopping-list.service';
import { ShoppingListItemsService } from '../../../core/supabase/shopping-list-items.service';
import { GenerationFormComponent } from './components/generation-form/generation-form.component';
import { GenerationStatusComponent } from './components/generation-status/generation-status.component';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  ShoppingListResponseDto,
  CreateShoppingListItemCommand,
  CreateRecipeCommand,
  CategoryDto,
} from '../../../../types';
import { CategoryService } from '@app/core/supabase/category.service';

@Component({
  selector: 'app-generate-list-page',
  standalone: true,
  imports: [CommonModule, GenerationFormComponent, GenerationStatusComponent],
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
  isGenerating = signal<boolean>(false);
  generationStatus = signal<'idle' | 'generating' | 'adding' | 'completed' | 'error'>('idle');
  generatedItems = signal<CreateShoppingListItemCommand[]>([]);
  errorMessage = signal<string | null>(null);
  categories = signal<CategoryDto[]>([]);
  initialRecipeText = signal<string>('');

  private loadShoppingLists(): void {
    this.shoppingListService
      .getShoppingLists()
      .pipe(tap(lists => this.shoppingLists.set(lists)))
      .subscribe();
  }

  onGenerate(data: { listId: string; recipeText: string }): void {
    this.isGenerating.set(true);
    this.generationStatus.set('generating');
    this.errorMessage.set(null);

    const command: CreateRecipeCommand = {
      title: 'Generated Recipe',
      recipe_text: data.recipeText,
    };

    this.generationService
      .generateForReview(command, this.categories(), 'pl')
      .pipe(
        tap(result => {
          console.log('Generated items for review:', result);
          this.generationStatus.set('completed');

          const navigationState = {
            items: result.items,
            listId: data.listId,
            recipeText: data.recipeText,
            recipeName: result.recipeName,
            recipeSource: 'text', // Default source
          };

          console.log('Navigating to review with state:', {
            itemsCount: navigationState.items.length,
            listId: navigationState.listId,
            hasRecipeText: !!navigationState.recipeText,
            recipeName: navigationState.recipeName,
          });

          // Navigate to review screen with data
          this.router.navigate(['/generate/review'], {
            state: navigationState,
          });
        }),
        catchError(error => {
          console.error('Generation error:', error);
          this.errorMessage.set(error instanceof Error ? error.message : 'Generation failed');
          this.generationStatus.set('error');
          return of(null);
        }),
        finalize(() => {
          this.isGenerating.set(false);
        })
      )
      .subscribe();
  }
}
