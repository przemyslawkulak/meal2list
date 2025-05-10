import { Injectable, Inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, from, map, catchError, throwError } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { generateSchema } from '@schemas/generation.schema';
import {
  CategoryDto,
  CreateRecipeCommand,
  GeneratedListResponseDto,
  ShoppingListItemResponseDto,
} from '../../../types';
import { AppEnvironment } from '@app/app.config';
import { SupabaseService } from '@core/supabase/supabase.service';
import { OpenrouterService } from '@core/openai/openai.service';

const SYSTEM_MESSAGE = (
  categoryList: CategoryDto[],
  language: string
) => `You are an intelligent assistant specializing in recipe analysis and ingredient extraction. Your task is to analyze recipe text and extract ingredients along with their quantities and units. You will then structure this information into a JSON format.

Here is the list of predefined categories for ingredients:
<category_list>
${categoryList.map(category => `<category id="${category.id}">${category.name}</category>`).join('\n')}
</category_list>

Please provide your response in the following language:
<language>
${language}
</language>

When analyzing the recipe, follow these steps:

1. Carefully read through the entire recipe text.
2. Identify all ingredients mentioned in the recipe.
3. For each ingredient, determine:
   a. Product name
   b. Quantity (must be a positive number)
   c. Unit of measurement (use "sztuka" as the default if not specified)
   d. Category (assign each ingredient to one of the predefined categories)

4. Structure the extracted information into a JSON format.

Before providing the final output, perform your analysis inside <ingredient_analysis> tags. In this section:
- List all ingredients found in the recipe text.
- For each ingredient, write out your reasoning for determining the product name, quantity, unit, and category.
- Double-check that all ingredients have been accounted for and properly categorized.

It's okay for this section to be quite long, as we want thorough reasoning for each ingredient.

Ensure that:
- All units and products are assigned to appropriate categories
- Each product has a positive quantity
- Each product is assigned a category
- The default unit "sztuka" is used when no unit is specified

The final output should be a JSON array of objects, where each object represents an ingredient and contains the following fields:
- product_name: string
- quantity: positive number
- category: string (from the predefined list)
- unit: string (default to "sztuka" if not specified)

Example of the expected JSON structure (use generic placeholders):

<response >
[
  {
    "product_name": "Example Product 1",
    "quantity": 1,
    "category_id": "a746a400-7bb3-49a7-83cb-2b807da2cc1a",
    "unit": "sztuka"
  },
  {
    "product_name": "Example Product 2",
    "quantity": 2.5,
    "category_id": "a746a400-7bb3-49a7-83cb-2b807da2cc1a",
    "unit": "Example Unit"
  }
]
</response>

Now, please analyze the given recipe text and provide the structured JSON output of ingredients.`;

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
      temperature: 0.5,
      top_p: 1,
    });

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
                required: ['product_name', 'quantity', 'unit', 'category_id'],
                properties: {
                  product_name: { type: 'string' },
                  quantity: { type: 'number' },
                  unit: { type: 'string' },
                  category_id: { type: 'string' },
                },
              },
            },
          },
          required: ['items'],
        },
      },
    });
  }

  generateFromText(
    command: CreateRecipeCommand,
    category_list: CategoryDto[],
    language: string
  ): Observable<GeneratedListResponseDto> {
    const validationResult = generateSchema.safeParse(command);

    if (!validationResult.success) {
      console.error('Invalid input data', validationResult.error.format());

      return throwError(() => ({
        message: `Invalid input data `,
        statusCode: 400,
        errors: validationResult.error.format(),
      }));
    }
    this.openrouterService.setSystemMessage(SYSTEM_MESSAGE(category_list, language));

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
    return this.openrouterService.sendChatMessage(recipeText).pipe(
      map(response => {
        const responseData = JSON.parse(response.data as string) as {
          items: Array<{
            product_name: string;
            quantity: number;
            unit: string;
            category_id: string;
          }>;
        };
        const items = responseData.items;

        return items.map(item => ({
          id: uuidv4(),
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          is_checked: false,
          source: 'auto',
          category_id: item.category_id,
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
