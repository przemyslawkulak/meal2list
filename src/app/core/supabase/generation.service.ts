import { Injectable, Inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, from, map, catchError, throwError } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { generateSchema } from '@schemas/generation.schema';
import {
  CreateRecipeCommand,
  GeneratedListResponseDto,
  ShoppingListItemResponseDto,
} from '../../../types';
import { AppEnvironment } from '@app/app.config';
import { SupabaseService } from '@core/supabase/supabase.service';
import { OpenrouterService } from '@core/openai/openai.service';

@Injectable({
  providedIn: 'root',
})
export class GenerationService extends SupabaseService {
  constructor(
    @Inject('APP_ENVIRONMENT') environment: AppEnvironment,
    private openrouterService: OpenrouterService
  ) {
    super(environment);
    this.setupOpenRouter();
  }

  private setupOpenRouter(): void {
    this.openrouterService.setModel('gpt-4o-mini', {
      temperature: 0.7,
      top_p: 1,
    });

    this.openrouterService.setSystemMessage(
      'You are a helpful assistant that analyzes recipe text and extracts ingredients with their quantities and units. ' +
        'Return the ingredients list in a structured JSON format with product_name, quantity, and unit for each item.'
    );

    this.openrouterService.setResponseFormat({
      type: 'json_schema',
      json_schema: {
        name: 'ShoppingListItems',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['product_name', 'quantity', 'unit'],
                properties: {
                  product_name: { type: 'string' },
                  quantity: { type: 'number' },
                  unit: { type: 'string' },
                },
              },
            },
          },
          required: ['items'],
        },
      },
    });
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

    return this.openrouterService.sendChatMessage(recipeText).pipe(
      map(response => {
        const responseData = JSON.parse(response.data as string) as {
          items: Array<{ product_name: string; quantity: number; unit: string }>;
        };
        const items = responseData.items;

        return items.map(item => ({
          id: uuidv4(),
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          is_checked: false,
          source: 'auto',
          category_id: 'd90c5734-6227-4ab8-9acf-d8796db27913',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
      }),
      catchError(error => {
        console.error('Error processing recipe:', error);
        return throwError(() => ({
          message: 'Failed to process recipe text',
          statusCode: 500,
          error,
        }));
      })
    );
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
