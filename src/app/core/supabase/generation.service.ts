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
  language: string,
  currentItems: ShoppingListItemResponseDto[] = []
) => `You are an intelligent assistant specializing in recipe analysis and ingredient extraction. Your task is to analyze recipe text and extract ingredients along with their quantities and standardized units. You will then structure this information into a JSON format.

Here is the list of predefined categories for ingredients:
<category_list>
${categoryList.map(category => `<category id="${category.id}">${category.name}</category>`).join('\n')}
</category_list>

${
  currentItems.length > 0
    ? `
CURRENT SHOPPING LIST ITEMS:
<current_items>
${currentItems
  .map(
    item => `<item>
  Product: ${item.product_name}
  Quantity: ${item.quantity}
  Unit: ${item.unit}
  Category: ${item.category_id}
</item>`
  )
  .join('\n')}
</current_items>

IMPORTANT: If you find ingredients that are similar or identical to items already in the shopping list, DO NOT create new items. Instead, ADD the quantities together and use the existing item. Consider these as similar products:
- Same product name (exact match)
- Very similar products (e.g., "Mąka" and "Mąka pszenna", "Cebula" and "Cebula żółta")
- Products that serve the same purpose in cooking

When merging similar items:
1. Use the more specific product name if available
2. Add quantities together (convert units if necessary to match)
3. Keep the same category and unit as the existing item
4. Only create a new item if the product is truly different

`
    : ''
}

STANDARDIZED UNITS - Use ONLY these standardized units based on Polish cooking practices:

PRIMARY UNITS (use these first):
1. szt (piece) - MOST IMPORTANT - use for ALL countable items as the main unit
   - Vegetables, fruits, eggs, meat portions, dairy products, bread, etc.
   - Examples: 2 szt jajka, 3 szt pomidory, 1 szt chleb, 1 szt kurczak

2. ml (milliliter) - for ALL liquid measurements
   - Examples: 150 ml ciepłej wody, 250 ml bulionu, 15 ml oliwy, 5 ml ekstraktu waniliowego

3. g (gram) - for ingredients that cannot be counted as pieces
   - Flour, sugar, spices, salt, small ingredients
   - Examples: 500 g mąki, 2 g soli, 100 g cukru

SECONDARY UNITS (use when appropriate):
7. opak (package) - for processed products only
   - Examples: 1 opak śmietan-fix, 1 opak sosu sałatkowego

8. l (liter) - for large liquid quantities (soups, big portions)
   - Examples: 1,5 l bulionu, 2 l wody

9. szczypta (pinch) - for minimal spice amounts
   - Convert to: 1 g for calculation purposes

CONVERSION RULES - Convert these terms to standardized units:
- "szczypta" → 1 g
- "garść" (handful) → 50 g  
- "szklanka" → 250 ml
- "łyżka" → 15 ml
- "łyżeczka" → 5 ml
- "filiżanka" → 200 ml
- "kubek" → 250 ml
- "puszka mała" → 400 ml
- "puszka duża" → 800 ml
- "butelka" → 500 ml
- "kostka masła" → 200 g
- "tabliczka czekolady" → 100 g

Please provide your response in the following language:
<language>
${language}
</language>

When analyzing the recipe, follow these steps:

1. Carefully read through the entire recipe text.
2. Identify all ingredients mentioned in the recipe.
3. For each ingredient, determine:
   a. Product name (clear, standardized name)
   b. Quantity (must be a positive number)
   c. Standardized unit (from the approved list above)
   d. Category (assign each ingredient to one of the predefined categories)

4. Structure the extracted information into a JSON format.

Before providing the final output, perform your analysis inside <ingredient_analysis> tags. In this section:
- List all ingredients found in the recipe text.
- For each ingredient, write out your reasoning for determining the product name, quantity, standardized unit, and category.
- Show any unit conversions you made from ambiguous terms to standardized units.
- Double-check that all ingredients have been accounted for and properly categorized.

CRITICAL REQUIREMENTS:
- PRIORITIZE pieces (szt) as the MAIN UNIT - use for ALL countable items (vegetables, fruits, meat portions, dairy, bread, etc.)
- Convert ALL liquid measurements to ml (including szklanka, łyżka, łyżeczka)
- Use grams (g) ONLY for ingredients that cannot be counted as pieces (flour, sugar, spices, salt)
- Convert ambiguous terms using the conversion rules above
- Default to "szt" for countable items when no unit is specified
- Ensure quantities are realistic and practical for Polish cooking
- Standardize product names to Polish cooking terms
- ALL product names MUST start with a capital letter (e.g., "Mąka pszenna", "Jajka", "Mleko")

The final output should be a JSON array of objects, where each object represents an ingredient and contains the following fields:
- product_name: string (standardized name)
- quantity: positive number
- category_id: string (from the predefined list)
- unit: string (standardized unit from approved list)

Example of the expected JSON structure following Polish cooking standards:

<response>
[
  {
    "product_name": "Jajka",
    "quantity": 2,
    "category_id": "a746a400-7bb3-49a7-83cb-2b807da2cc1a",
    "unit": "szt"
  },
  {
    "product_name": "Pomidory",
    "quantity": 3,
    "category_id": "a746a400-7bb3-49a7-83cb-2b807da2cc1a",
    "unit": "szt"
  },
  {
    "product_name": "Mleko",
    "quantity": 250,
    "category_id": "a746a400-7bb3-49a7-83cb-2b807da2cc1a",
    "unit": "ml"
  },
  {
    "product_name": "Oliwa z oliwek",
    "quantity": 30,
    "category_id": "a746a400-7bb3-49a7-83cb-2b807da2cc1a",
    "unit": "ml"
  },
  {
    "product_name": "Mąka pszenna",
    "quantity": 500,
    "category_id": "a746a400-7bb3-49a7-83cb-2b807da2cc1a",
    "unit": "g"
  }
]
</response>

Now, please analyze the given recipe text and provide the structured JSON output of ingredients with standardized units.`;

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
    language: string,
    currentItems: ShoppingListItemResponseDto[] = []
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
    this.openrouterService.setSystemMessage(SYSTEM_MESSAGE(category_list, language, currentItems));

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
