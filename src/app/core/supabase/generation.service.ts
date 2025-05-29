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
  GenerationReviewItemDto,
  CreateShoppingListItemCommand,
} from '../../../types';
import { AppEnvironment } from '@app/app.config';
import { SupabaseService } from '@core/supabase/supabase.service';
import { OpenrouterService } from '@core/openai/openai.service';

const SYSTEM_MESSAGE = (
  categoryList: CategoryDto[],
  language: string,
  currentItems: ShoppingListItemResponseDto[] = []
) => `You are an intelligent assistant specializing in recipe analysis and ingredient extraction. Your task is to analyze recipe text and extract ingredients along with their quantities and standardized units. You will also generate a concise, descriptive name for the recipe. You will then structure this information into a JSON format.

AVAILABLE CATEGORIES:
${categoryList.map(cat => `- ${cat.name} (ID: ${cat.id})`).join('\n')}

${
  currentItems.length > 0
    ? `
CURRENT SHOPPING LIST ITEMS (avoid duplicates):
${currentItems.map(item => `- ${item.product_name} (${item.quantity} ${item.unit})`).join('\n')}
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

AUTOMATIC EXCLUSION RULES:
Automatically set "excluded": true for small amount items that users typically already have at home:
- Spices and seasonings (salt, pepper, herbs, spices, etc.)
- Cooking oils and vinegars (olive oil, vegetable oil, vinegar, etc.)
- Basic baking ingredients in small amounts (baking powder, baking soda, vanilla extract, etc.)
- Condiments and flavor enhancers (bouillon cubes, stock cubes, etc.)
- Small quantities of common pantry items (garlic, onion when used as seasoning, etc.)

Set "excluded": false for main ingredients that users need to purchase:
- Main proteins (meat, fish, eggs in larger quantities)
- Fresh vegetables and fruits (when used as main ingredients)
- Dairy products (milk, cheese, yogurt, etc.)
- Grains and starches (rice, pasta, bread, potatoes)
- Fresh herbs in larger quantities

RECIPE NAME GENERATION:
Generate a concise, descriptive name for the recipe based on the main ingredients and cooking method. The name should be:
- In Polish language
- 2-5 words maximum
- Descriptive of the main dish/ingredients
- Professional and appetizing
- Examples: "Spaghetti Bolognese", "Zupa Pomidorowa", "Kurczak w Sosie Curry", "Sałatka Grecka"

Please provide your response in the following language:
<language>
${language}
</language>

When analyzing the recipe, follow these steps:

1. Carefully read through the entire recipe text.
2. Generate a concise, descriptive name for the recipe.
3. Identify all ingredients mentioned in the recipe.
4. For each ingredient, determine:
   a. Product name (clear, standardized name)
   b. Quantity (must be a positive number)
   c. Standardized unit (from the approved list above)
   d. Category (assign each ingredient to one of the predefined categories)
   e. Excluded status (true for small amount items, false for main ingredients)

5. Structure the extracted information into a JSON format.

Before providing the final output, perform your analysis inside <ingredient_analysis> tags. In this section:
- Generate and explain the recipe name choice.
- List all ingredients found in the recipe text.
- For each ingredient, write out your reasoning for determining the product name, quantity, standardized unit, category, and exclusion status.
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
- Apply automatic exclusion rules for small amount items

The final output should be a JSON object containing:
1. "recipe_name": string (generated recipe name)
2. "items": array of ingredient objects

Each ingredient object should contain the following fields:
- product_name: string (standardized name)
- quantity: positive number
- category_id: string (from the predefined list)
- unit: string (standardized unit from approved list)
- excluded: boolean (true for small amount items, false for main ingredients)

Example of the expected JSON structure following Polish cooking standards:

<response>
{
  "recipe_name": "Spaghetti Bolognese",
  "items": [
    {
      "product_name": "Jajka",
      "quantity": 2,
      "category_id": "a746a400-7bb3-49a7-83cb-2b807da2cc1a",
      "unit": "szt",
      "excluded": false
    },
    {
      "product_name": "Pomidory",
      "quantity": 3,
      "category_id": "a746a400-7bb3-49a7-83cb-2b807da2cc1a",
      "unit": "szt",
      "excluded": false
    },
    {
      "product_name": "Mleko",
      "quantity": 250,
      "category_id": "a746a400-7bb3-49a7-83cb-2b807da2cc1a",
      "unit": "ml",
      "excluded": false
    },
    {
      "product_name": "Oliwa z oliwek",
      "quantity": 30,
      "category_id": "a746a400-7bb3-49a7-83cb-2b807da2cc1a",
      "unit": "ml",
      "excluded": true
    },
    {
      "product_name": "Sól",
      "quantity": 2,
      "category_id": "a746a400-7bb3-49a7-83cb-2b807da2cc1a",
      "unit": "g",
      "excluded": true
    }
  ]
}
</response>

Now, please analyze the given recipe text and provide the structured JSON output with recipe name and ingredients with standardized units and exclusion status.`;

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
        name: 'RecipeAnalysis',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            recipe_name: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['product_name', 'quantity', 'unit', 'category_id', 'excluded'],
                properties: {
                  product_name: { type: 'string' },
                  quantity: { type: 'number' },
                  unit: { type: 'string' },
                  category_id: { type: 'string' },
                  excluded: { type: 'boolean' },
                },
              },
            },
          },
          required: ['recipe_name', 'items'],
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
          recipe_name: string;
          items: Array<{
            product_name: string;
            quantity: number;
            unit: string;
            category_id: string;
            excluded: boolean;
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

  generateForReview(
    command: CreateRecipeCommand,
    categories: CategoryDto[],
    language: string
  ): Observable<{ recipeName: string; items: GenerationReviewItemDto[] }> {
    const validationResult = generateSchema.safeParse(command);

    if (!validationResult.success) {
      console.error('Invalid input data', validationResult.error.format());
      return throwError(() => ({
        message: 'Invalid input data',
        statusCode: 400,
        errors: validationResult.error.format(),
      }));
    }

    this.openrouterService.setSystemMessage(SYSTEM_MESSAGE(categories, language));

    return this.openrouterService.sendChatMessage(command.recipe_text).pipe(
      map(response => {
        const responseData = JSON.parse(response.data as string) as {
          recipe_name: string;
          items: Array<{
            product_name: string;
            quantity: number;
            unit: string;
            category_id: string;
            excluded: boolean;
          }>;
        };

        const items = responseData.items.map(item => ({
          id: uuidv4(),
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit || 'szt',
          category_id: item.category_id,
          excluded: item.excluded,
          source: 'auto' as const,
          isModified: false,
        }));

        return {
          recipeName: responseData.recipe_name,
          items,
        };
      }),
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

  confirmReviewedItems(
    listId: string,
    items: GenerationReviewItemDto[],
    recipeName?: string
  ): Observable<void> {
    if (!listId || items.length === 0) {
      return throwError(() => ({
        message: 'Invalid list ID or no items to add',
        statusCode: 400,
      }));
    }

    const itemsToAdd: CreateShoppingListItemCommand[] = items
      .filter(item => !item.excluded)
      .map(item => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        category_id: item.category_id,
        source: item.isModified ? ('modified' as const) : ('auto' as const),
        recipe_source: recipeName || item.recipe_source,
      }));

    if (itemsToAdd.length === 0) {
      return throwError(() => ({
        message: 'No items selected for addition',
        statusCode: 400,
      }));
    }

    return from(
      this.supabase
        .from('shopping_list_items')
        .insert(
          itemsToAdd.map(item => ({
            ...item,
            shopping_list_id: listId,
            is_checked: false,
          }))
        )
        .select()
    ).pipe(
      map(result => {
        if (result.error) throw result.error;
        return void 0;
      }),
      catchError(error => {
        console.error('Error adding items to shopping list:', error);
        return throwError(() => ({
          message: 'Failed to add items to shopping list',
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
