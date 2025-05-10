import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { GenerationService } from '../../../core/supabase/generation.service';
import { ShoppingListService } from '../../../core/supabase/shopping-list.service';
import { ShoppingListItemsService } from '../../../core/supabase/shopping-list-items.service';
import { GenerationFormComponent } from './components/generation-form/generation-form.component';
import { GenerationStatusComponent } from './components/generation-status/generation-status.component';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
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
export class GenerateListPageComponent {
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

  // Signals for state management
  shoppingLists = signal<ShoppingListResponseDto[]>([]);
  isGenerating = signal<boolean>(false);
  generationStatus = signal<'idle' | 'generating' | 'adding' | 'completed' | 'error'>('idle');
  generatedItems = signal<CreateShoppingListItemCommand[]>([]);
  errorMessage = signal<string | null>(null);
  categories = signal<CategoryDto[]>([]);

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
      .generateFromText(command, this.categories(), 'pl')
      .pipe(
        map(result => ({
          ...result,
          items: result.items.map(item => ({
            ...item,
            source: 'auto' as const,
            unit: item.unit ?? undefined,
          })),
        })),
        tap(result => {
          console.log('result', result);
          this.generatedItems.set(result.items);
          this.generationStatus.set('adding');
        }),
        switchMap(result => this.addItemsToList(data.listId, result.items)),
        tap(() => {
          this.generationStatus.set('completed');
          // Navigate to the shopping list detail page
          this.router.navigate(['/shopping-lists', data.listId]);
        }),
        catchError(error => {
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

  private addItemsToList(listId: string, items: CreateShoppingListItemCommand[]): Observable<void> {
    return this.shoppingListItemsService.addItemsToShoppingList(listId, items).pipe(
      map(() => void 0),
      catchError(error => {
        throw new Error(error.message || 'Failed to add items to shopping list');
      })
    );
  }
}
