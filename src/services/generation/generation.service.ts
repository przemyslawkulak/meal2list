import { Injectable, Inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, from, map, catchError, throwError, of } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  GeneratedListResponseDto,
  ShoppingListItemResponseDto,
  CreateRecipeCommand,
} from '../../types';
import { SupabaseService } from '../../app/core/supabase/supabase.service';
import { AppEnvironment } from '../../app/app.config';
import { generateSchema } from '../../schemas/generation.schema';

@Injectable({
  providedIn: 'root',
})
export class GenerationService extends SupabaseService {
  constructor(@Inject('APP_ENVIRONMENT') environment: AppEnvironment) {
    super(environment);
  }

  generateFromText(command: CreateRecipeCommand): Observable<GeneratedListResponseDto> {
    const validationResult = generateSchema.safeParse(command);

    if (!validationResult.success) {
      return throwError(() => ({ message: 'Invalid input data', statusCode: 400 }));
    }

    return this.processRecipeText(command.recipe_text).pipe(
      map(items => ({
        id: `temp-${uuidv4()}`,
        recipe_id: 0,
        items,
      })),
      catchError((error: HttpErrorResponse) => {
        const errorResponse = this.handleHttpError(error);
        return this.logGenerationError(error).pipe(
          map(() => {
            throw errorResponse;
          })
        );
      })
    );
  }

  private handleHttpError(error: HttpErrorResponse): { message: string; statusCode: number } {
    if (error.status === 401) {
      return { message: 'Unauthorized access', statusCode: 401 };
    }
    if (error.status === 400) {
      return { message: error.error?.message || 'Invalid input', statusCode: 400 };
    }
    return { message: 'An unexpected error occurred', statusCode: 500 };
  }

  private processRecipeText(recipeText: string): Observable<ShoppingListItemResponseDto[]> {
    console.log('Processing recipe text:', recipeText);
    // TODO: Implement AI or algorithm-based processing
    // This is a placeholder implementation
    return of([
      {
        id: uuidv4(),
        product_name: 'Flour',
        quantity: 1,
        unit: 'kg',
        is_checked: false,
        category_id: 'default-category',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
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
        throw logError;
      })
    );
  }
}
