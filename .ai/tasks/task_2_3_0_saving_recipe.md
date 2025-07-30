# Task 2.3.0: Recipe Saving & Quick-Add Implementation Plan

## Overview

Implementacja funkcjonalności zapisywania przepisów i szybkiego dodawania ich do list zakupów.

**Note:** This implementation extends the existing `recipes` table instead of creating a new `saved_recipes` table, adding new columns for enhanced recipe metadata and functionality.

**Key Features:**

- Recipe metadata (portions, nutrition, difficulty, prep time)
- Recipe tagging with icons
- Recipe relations (main course + salad, dessert combinations)
- Quick-add functionality with related recipes
- Visual grouping in shopping lists

## Database Schema Changes

### Task 2.3.1: Database Schema Implementation

**Priority:** High | **Estimated:** 5h

#### Subtasks:

- **2.3.1.1** Create `recipe_tags` table migration

  ```sql
  CREATE TABLE recipe_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#6366f1',
    icon TEXT, -- Material Design icon name or emoji
    is_predefined BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

- **2.3.1.2** Update existing `recipes` table migration

  ```sql
  -- Add new columns to existing recipes table
  ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS generation_id UUID REFERENCES generation(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS instructions TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_description TEXT,
  ADD COLUMN IF NOT EXISTS difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_saved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS portions INTEGER CHECK (portions > 0),
  ADD COLUMN IF NOT EXISTS kcal_per_100g DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS carbohydrates_per_100g DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS fats_per_100g DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS proteins_per_100g DECIMAL(5,2);

  -- Update source column to be source_url if it's a URL, otherwise source_description
  -- This migration can be done in a separate script if needed
  ```

- **2.3.1.3** Create `recipe_ingredients` table migration

  ```sql
  CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity  NUMERIC NOT NULL,
    unit TEXT,
    is_essential BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0
  );
  ```

- **2.3.1.4** Create `recipe_tags_mapping` junction table migration

  ```sql
  CREATE TABLE recipe_tags_mapping (
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES recipe_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, tag_id)
  );
  ```

- **2.3.1.5** Create `recipe_relations` table for related recipes

  ```sql
  CREATE TABLE recipe_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    related_recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    relation_type TEXT DEFAULT 'accompaniment', -- accompaniment, side, dessert, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT no_self_reference CHECK (primary_recipe_id != related_recipe_id),
    UNIQUE(primary_recipe_id, related_recipe_id)
  );
  ```

- **2.3.1.6** Add RLS policies for all new tables
- **2.3.1.7** Create indexes for performance optimization
- **2.3.1.8** Seed predefined tags with icons (breakfast 🌅, lunch 🌞, dinner 🌙, dessert 🍰, etc.)

### Task 2.3.2: TypeScript Types & Schemas

**Priority:** High | **Estimated:** 3h

#### Subtasks:

- **2.3.2.1** Update `database.types.ts` with new table types and updated recipes table
- **2.3.2.2** Update existing `Recipe` interface with new fields (nutrition, portions)
- **2.3.2.3** Create `RecipeTag` interface in types (with icon field)
- **2.3.2.4** Create `RecipeIngredient` interface in types
- **2.3.2.5** Create `RecipeRelation` interface in types
- **2.3.2.6** Create `NutritionInfo` and `NutritionFilters` interfaces
- **2.3.2.7** Create Zod schemas for validation in `schemas/recipe.schema.ts`
  - Nutrition value validation (positive numbers, reasonable ranges)
  - Portions validation (minimum 1, maximum reasonable limit)
  - Optional nutrition fields with proper decimal precision
  - Recipe relations validation (prevent self-reference, valid relation types)

## Backend Services

### Task 2.3.3: Supabase Services Implementation

**Priority:** High | **Estimated:** 8h

#### Subtasks:

- **2.3.3.1** Extend existing `RecipeService` in `core/supabase/`

  - `saveRecipe(recipe: CreateRecipeDto): Observable<Recipe>`
  - `getSavedRecipesByUser(userId: string, filters?: NutritionFilters): Observable<Recipe[]>`
  - `getRecipeWithIngredients(id: string): Observable<Recipe>`
  - `getRecipeWithRelations(id: string): Observable<Recipe>`
  - `updateRecipe(id: string, updates: UpdateRecipeDto): Observable<Recipe>`
  - `deleteRecipe(id: string): Observable<void>`
  - `markRecipeAsSaved(id: string): Observable<Recipe>`
  - `calculateNutritionPerServing(recipeId: string): Observable<NutritionInfo>`
  - `addRecipeRelation(primaryId: string, relatedId: string, type: string): Observable<RecipeRelation>`
  - `removeRecipeRelation(primaryId: string, relatedId: string): Observable<void>`
  - `getRelatedRecipes(recipeId: string): Observable<Recipe[]>`

- **2.3.3.2** Create `RecipeTagService` in `core/supabase/`

  - `getAllTags(): Observable<RecipeTag[]>`
  - `createCustomTag(name: string, icon: string, userId: string): Observable<RecipeTag>`
  - `getTagsForRecipe(recipeId: string): Observable<RecipeTag[]>`

- **2.3.3.3** Create `RecipeImageService` for Supabase Storage

  - `uploadRecipeImage(file: File, recipeId: string): Observable<string>`
  - `deleteRecipeImage(imageUrl: string): Observable<void>`

- **2.3.3.4** Add error handling and type safety to all services

## UI Components

### Task 2.3.4: Generation Review Enhancement

**Priority:** High | **Estimated:** 10h

#### Subtasks:

- **2.3.4.1** Add recipe metadata form to `generation-review.page.html`

  - Recipe name input
  - Instructions textarea
  - Source URL/description inputs
  - Difficulty selector (1-5 stars)
  - Prep time input
  - Portions number input
  - Nutrition information inputs (kcal, carbs, fats, proteins per 100g)
  - Image upload component

- **2.3.4.2** Create `RecipeMetadataFormComponent`

  - Form validation (including nutrition value ranges)
  - Image preview
  - Tag selector with autocomplete
  - Related recipes selector
  - Nutrition calculator helper (optional)
  - Reactive forms integration

- **2.3.4.3** Create `TagSelectorComponent`

  - Multi-select with predefined tags
  - Ability to create custom tags with icon selection
  - Chip display for selected tags with icons
  - Search/filter functionality

- **2.3.4.6** Create `RelatedRecipesSelectorComponent`

  - Search and select from user's saved recipes
  - Relation type selector (side, dessert, accompaniment, etc.)
  - Visual display of selected relations
  - Prevent circular dependencies

- **2.3.4.4** Update `ReviewActionsComponent`

  - Add "Save Recipe" checkbox
  - Add "Save Recipe Without Adding to List" button
  - Handle recipe saving logic

- **2.3.4.5** Update `generation-review.page.ts`
  - Integrate recipe saving with existing flow
  - Handle form submission
  - Add recipe metadata to component state

### Task 2.3.5: Recipe Management Page

**Priority:** Medium | **Estimated:** 15h

#### Subtasks:

- **2.3.5.1** Create `SavedRecipesPageComponent` in `features/saved-recipes/`

  - Grid/list view toggle
  - Search functionality
  - Tag filters
  - Sort options (name, date, difficulty, kcal, prep time)
  - Nutrition filters (calorie ranges, macro filters)

- **2.3.5.2** Create `RecipeCardComponent`

  - Recipe image display
  - Basic recipe info (portions, prep time, difficulty)
  - Nutrition summary (kcal, macros per 100g)
  - Related recipes count indicator
  - Quick actions (edit, delete, quick-add)
  - Tag display with icons

- **2.3.5.3** Create `RecipeDetailModalComponent`

  - Full recipe view
  - Related recipes section with cards
  - Edit mode toggle
  - Delete confirmation
  - Quick-add to shopping list (with option to include related recipes)

- **2.3.5.4** Create `RecipeEditFormComponent`

  - Reusable form for recipe editing
  - Image upload/replace
  - Ingredient management
  - Tag management
  - Related recipes management
  - Nutrition information editing

- **2.3.5.5** Create `NutritionDisplayComponent`

  - Reusable nutrition facts display
  - Macros breakdown visualization
  - Per serving calculation
  - Responsive design for cards and detail views

- **2.3.5.6** Add routing for saved recipes page

### Task 2.3.6: Quick-Add Implementation

**Priority:** High | **Estimated:** 6h

#### Subtasks:

- **2.3.6.1** Create `QuickAddRecipeModalComponent`

  - Recipe selection list with nutrition info
  - Search/filter recipes (including nutrition filters)
  - Recipe preview with nutrition facts
  - Show related recipes option
  - Bulk add recipes and their relations

- **2.3.6.2** Create `QuickAddSlideOverComponent`

  - Toggle for "Skip Review"
  - Essential ingredients only option
  - Quantity adjustment (if review enabled)
  - Add to existing list vs create new list

- **2.3.6.3** Add Quick-Add button to shopping lists page
- **2.3.6.4** Integrate with existing shopping list creation flow

## State Management

### Task 2.3.7: Recipe Store Implementation

**Priority:** Medium | **Estimated:** 4h

#### Subtasks:

- **2.3.7.1** Create `RecipesStore` in `core/stores/` (or extend existing)

  - State for loaded recipes
  - Loading states
  - Error handling
  - CRUD operations

- **2.3.7.2** Create `RecipeTagsStore`

  - Available tags cache
  - Custom tags management

- **2.3.7.3** Integrate stores with components

## Integration & Enhancement

### Task 2.3.8: Shopping List Integration

**Priority:** High | **Estimated:** 5h

#### Subtasks:

- **2.3.8.1** Update `ShoppingListService` to handle recipe-based additions

  - `addRecipeToList(listId: string, recipeId: string, options: AddRecipeOptions)`
  - `addRecipeWithRelations(listId: string, recipeId: string, includeRelated: boolean)`
  - Track recipe source in shopping list items

- **2.3.8.2** Update shopping list item model to include recipe reference
- **2.3.8.3** Implement visual grouping in shopping list UI

  - Group products by recipe name
  - Visual separators/headers

- **2.3.8.4** Update `ProductQuantityComponent` for recipe grouping display

### Task 2.3.9: Generation Flow Integration

**Priority:** Medium | **Estimated:** 3h

#### Subtasks:

- **2.3.9.1** Update `GenerationService` to support recipe metadata
- **2.3.9.2** Handle duplicate recipe name detection
- **2.3.9.3** Add recipe saving to generation completion flow

## Testing

### Task 2.3.10: Unit Testing

**Priority:** Medium | **Estimated:** 7h

#### Subtasks:

- **2.3.10.1** Test enhanced `RecipeService` methods (including relations)
- **2.3.10.2** Test `RecipeTagService` methods
- **2.3.10.3** Test recipe form components (including relations selector)
- **2.3.10.4** Test recipe store operations
- **2.3.10.5** Test integration with shopping lists (including related recipes)
- **2.3.10.6** Test recipe relations CRUD operations

### Task 2.3.11: E2E Testing

**Priority:** Medium | **Estimated:** 5h

#### Subtasks:

- **2.3.11.1** Test complete recipe saving flow (including relations)
- **2.3.11.2** Test recipe management operations
- **2.3.11.3** Test quick-add functionality (including related recipes)
- **2.3.11.4** Test recipe-based shopping list creation
- **2.3.11.5** Test meal planning with related recipes

## Polish & Optimization

### Task 2.3.12: UI/UX Polish

**Priority:** Low | **Estimated:** 6h

#### Subtasks:

- **2.3.12.1** Add loading states and skeleton screens
- **2.3.12.2** Implement proper error messages
- **2.3.12.3** Add animations and transitions
- **2.3.12.4** Mobile responsiveness optimization
- **2.3.12.5** Accessibility improvements
- **2.3.12.6** Implement icon picker for custom tags (Material Icons or emoji selection)
- **2.3.12.7** Nutrition visualization enhancements
  - Macros pie chart or bar chart
  - Calorie badge styling
  - Nutrition comparison between recipes
  - Color coding for nutrition ranges (low/medium/high calories)

### Task 2.3.13: Performance Optimization

**Priority:** Low | **Estimated:** 3h

#### Subtasks:

- **2.3.13.1** Implement recipe list pagination
- **2.3.13.2** Add lazy loading for recipe images
- **2.3.13.3** Optimize database queries
- **2.3.13.4** Add caching for frequently accessed recipes

## Implementation Order

1. **Phase 1: Foundation** (Tasks 2.3.1 - 2.3.3)

   - Database schema
   - Types and services
   - Core backend functionality

2. **Phase 2: Recipe Saving** (Tasks 2.3.4, 2.3.7, 2.3.9)

   - Generation review enhancement
   - Basic recipe saving functionality

3. **Phase 3: Recipe Management** (Task 2.3.5)

   - Recipe listing and management UI

4. **Phase 4: Quick-Add** (Tasks 2.3.6, 2.3.8)

   - Quick-add functionality
   - Shopping list integration

5. **Phase 5: Testing & Polish** (Tasks 2.3.10 - 2.3.13)
   - Testing and optimization

## Total Estimated Time: ~89 hours

## Dependencies

- Existing generation review system
- Shopping list functionality
- Supabase Storage setup
- Angular Material components

## Risks & Considerations

- Image storage size limits in Supabase
- Performance with large recipe collections
- Complex UI for recipe ingredient management
- Integration complexity with existing generation flow
- Icon standardization: decide between Material Design icons vs emojis vs custom icon set
- Icon accessibility: ensure proper alt text and fallbacks for icons
- Nutrition data accuracy: manual input may be inaccurate, consider validation ranges
- Nutrition calculations: per-serving vs per-100g conversions need clear UX
- Data completeness: optional nutrition fields may result in inconsistent data quality
- Recipe relations complexity: prevent circular dependencies, manage orphaned relations
- UI complexity: displaying and managing related recipes without overwhelming users
- Performance impact: recursive queries for deeply nested recipe relations
