import { Injectable, Inject } from '@angular/core';
import { Observable, from, map, catchError, throwError, mergeMap, of } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { GeneratedListResponseDto, ShoppingListItemResponseDto } from '../types';
import { SupabaseService } from '../app/core/supabase/supabase.service';
import { AppEnvironment } from '../app/app.config';

@Injectable({
  providedIn: 'root',
})
export class GenerationService extends SupabaseService {
  constructor(@Inject('APP_ENVIRONMENT') environment: AppEnvironment) {
    super(environment);
  }

  generateFromText(recipeText: string): Observable<GeneratedListResponseDto> {
    return from(this.processRecipeText(recipeText)).pipe(
      map(items => ({
        id: `temp-${uuidv4()}`,
        recipe_id: 0, // Temporary ID since we're not saving the recipe
        items,
      })),
      catchError(error => {
        return this.logGenerationError(error).pipe(mergeMap(() => throwError(() => error)));
      })
    );
  }

  private async processRecipeText(recipeText: string): Promise<ShoppingListItemResponseDto[]> {
    console.log('Processing recipe text:', recipeText);
    // TODO: Implement AI or algorithm-based processing
    // This is a placeholder implementation
    const mockItems: ShoppingListItemResponseDto[] = [
      {
        id: uuidv4(),
        product_name: 'Flour',
        quantity: 1,
        unit: 'kg',
        is_checked: false,
        category_id: 'default-category', // You'll need to get real category IDs
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    return mockItems;
  }

  private logGenerationError(error: unknown): Observable<void> {
    return from(
      this.supabase.from('generation_error').insert([
        {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          error_code: error instanceof Error ? error.name : 'UNKNOWN',
          recipe_id: '00000000-0000-0000-0000-000000000000',
          shopping_list_id: '00000000-0000-0000-0000-000000000000',
        },
      ])
    ).pipe(
      map(() => void 0),
      catchError(logError => {
        console.error('Failed to log generation error:', logError);
        return of(void 0);
      })
    );
  }
}
