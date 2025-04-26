import { Injectable, Inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, from, map, catchError, throwError, of, delay } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { generateSchema } from '../../../schemas/generation.schema';
import {
  CreateRecipeCommand,
  GeneratedListResponseDto,
  ShoppingListItemResponseDto,
} from '../../../types';
import { AppEnvironment } from '../../app.config';
import { SupabaseService } from './supabase.service';

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
        unit: 'litre',
        is_checked: false,
        source: 'auto',
        category_id: 'd90c5734-6227-4ab8-9acf-d8796db27913',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        product_name: 'Sugar',
        quantity: 1,
        unit: 'kg',
        is_checked: false,
        source: 'manual',
        category_id: 'd90c5734-6227-4ab8-9acf-d8796db27913',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        product_name: 'Eggs',
        quantity: 1,
        unit: 'count',
        is_checked: false,
        source: 'modified',
        category_id: 'd90c5734-6227-4ab8-9acf-d8796db27913',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]).pipe(delay(2000)); // Add 2 seconds delay
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
