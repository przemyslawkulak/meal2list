/*
  DTO and Command Model Types
  This file defines the TypeScript types for the API based on the database models and API plan.
*/

import type { Database } from './db/database.types';

// ----------------------------
// Authentication DTOs and Commands
// ----------------------------

export interface SignupRequestDto {
  email: string;
  password: string;
}

export interface SignupResponseDto {
  message: string;
  user: UserDto;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  token: string;
  user: UserDto;
}

export interface UserDto {
  id: string;
  email: string;
  created_at: string;
}

// ----------------------------
// Profile DTOs and Commands
// ----------------------------

export type ProfileDto = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'username' | 'website' | 'avatar_url' | 'updated_at'
>;

export interface UpdateProfileCommand {
  username?: string;
  website?: string;
  avatar_url?: string;
}

// ----------------------------
// Product DTOs and Commands
// ----------------------------

export type ProductDto = Pick<
  Database['public']['Tables']['products']['Row'],
  'id' | 'name' | 'default_category_id' | 'is_common' | 'created_by' | 'created_at'
>;

export interface CreateProductCommand {
  name: string;
  default_category_id: string;
  is_common?: boolean;
}

export interface UpdateProductCommand {
  name?: string;
  default_category_id?: string;
}

// ----------------------------
// UserProduct DTOs and Commands
// ----------------------------

export type UserProductDto = Pick<
  Database['public']['Tables']['user_products']['Row'],
  | 'id'
  | 'user_id'
  | 'product_id'
  | 'preferred_category_id'
  | 'last_used_at'
  | 'use_count'
  | 'created_at'
>;

export interface UpdateUserProductCommand {
  preferred_category_id?: string;
}

export interface ProductWithPreferencesDto extends ProductDto {
  preferred_category_id?: string | null;
  last_used_at?: string | null;
  use_count?: number;
}

// ----------------------------
// Recipe DTOs and Command Models
// ----------------------------

// Response type derived from the recipes table, omitting user_id as not exposed in API responses
export type RecipeResponseDto = Pick<
  Database['public']['Tables']['recipes']['Row'],
  'id' | 'title' | 'recipe_text' | 'source' | 'created_at' | 'updated_at'
>;

export interface CreateRecipeCommand {
  title: string;
  recipe_text: string;
  source?: string;
}

export interface UpdateRecipeCommand {
  title?: string;
  recipe_text?: string;
  source?: string;
}

// ----------------------------
// Shopping List DTOs and Command Models
// ----------------------------

export type ShoppingListResponseDto = Pick<
  Database['public']['Tables']['shopping_lists']['Row'],
  'id' | 'name' | 'recipe_id' | 'created_at' | 'updated_at' | 'user_id'
> & {
  items?: ShoppingListItemResponseDto[];
  users?: ShoppingListUserDto[];
};

export interface CreateShoppingListCommand {
  name: string;
  recipe_id?: string;
  // user_id is automatically set by the backend
}

export interface UpdateShoppingListCommand {
  name?: string;
  // user_id is automatically set by the backend
}

// ----------------------------
// Shopping List Users DTOs and Commands
// ----------------------------

export type ShoppingListUserDto = Pick<
  Database['public']['Tables']['shopping_list_users']['Row'],
  'shopping_list_id' | 'user_id' | 'created_at' | 'updated_at'
>;

export interface AddUserToShoppingListCommand {
  user_id: string;
}

export interface RemoveUserFromShoppingListCommand {
  user_id: string;
}

// ----------------------------
// Shopping List Item DTOs and Command Models
// ----------------------------

export type ShoppingListItemResponseDto = Pick<
  Database['public']['Tables']['shopping_list_items']['Row'],
  | 'id'
  | 'product_name'
  | 'quantity'
  | 'unit'
  | 'is_checked'
  | 'category_id'
  | 'product_id'
  | 'generation_id'
  | 'created_at'
  | 'updated_at'
  | 'source'
  | 'recipe_source'
>;

export interface CreateShoppingListItemCommand {
  product_name: string;
  quantity: number;
  unit?: string;
  source: 'auto' | 'manual' | 'modified';
  category_id: string;
  recipe_source?: string; // Name of the recipe from which this item was generated
  product_id?: string; // Link to products table
  generation_id?: string; // Link to generation table
}

export interface UpdateShoppingListItemCommand {
  product_name?: string;
  quantity?: number;
  unit?: string;
  is_checked?: boolean;
  category_id?: string;
  recipe_source?: string | null;
  product_id?: string | null;
  generation_id?: string | null;
}

export type CreateBatchShoppingListItemsCommand = CreateShoppingListItemCommand[];

// ----------------------------
// Category DTO
// ----------------------------

export type CategoryDto = Pick<
  Database['public']['Tables']['categories']['Row'],
  'id' | 'name' | 'created_at' | 'updated_at'
>;

export interface CreateCategoryCommand {
  name: string;
}

export interface UpdateCategoryCommand {
  name?: string;
}

// ----------------------------
// Generation DTOs
// ----------------------------

export type GenerationDto = Pick<
  Database['public']['Tables']['generation']['Row'],
  'id' | 'recipe_id' | 'shopping_list_id' | 'generation_time' | 'created_at' | 'updated_at'
>;

// ----------------------------
// Generation Error DTO
// ----------------------------

export type GenerationErrorDto = Pick<
  Database['public']['Tables']['generation_error']['Row'],
  | 'id'
  | 'recipe_id'
  | 'shopping_list_id'
  | 'error_code'
  | 'error_message'
  | 'created_at'
  | 'updated_at'
>;

// ----------------------------
// Additional DTOs
// ----------------------------

export interface GenerationStatusDto {
  status: string; // e.g., 'completed', 'pending', etc.
  processing_time: number;
  errors: string[];
}

// Define response type for generated shopping list
export interface GeneratedListResponseDto {
  id: string;
  recipe_id: string;
  items: ShoppingListItemResponseDto[];
}

export interface GenerateShoppingListFromRecipeCommand {
  recipe_text: string;
}

// ----------------------------
// Generation Review DTOs
// ----------------------------

export interface GenerationReviewItemDto {
  id: string; // temporary ID for tracking
  product_name: string;
  quantity: number;
  unit: string;
  category_id: string;
  excluded: boolean;
  source: 'auto';
  isModified?: boolean; // track if user edited the item
  recipe_source?: string; // Name of the recipe from which this item was generated
}

export interface ReviewSessionDto {
  sessionId: string;
  items: GenerationReviewItemDto[];
  originalRecipeText: string;
  targetListId: string;
  recipeName?: string; // AI-generated recipe name
  recipeSource?: string; // User-editable source (text, URL, book name, etc.)
}

export interface ConfirmReviewCommand {
  sessionId: string;
  items: GenerationReviewItemDto[]; // only non-excluded items
}

export interface NavLink {
  label: string;
  path: string;
  icon?: string;
}

export interface SupabaseError {
  message: string;
  status?: number;
  name?: string;
}

// ----------------------------
// Web Scraping DTOs and Command Models
// ----------------------------

export interface ScrapingRequestDto {
  url: string;
  options?: ScrapingOptionsDto;
}

export interface ScrapingOptionsDto {
  maxTokens?: number;
  extractMetadata?: boolean;
  cleanContent?: boolean;
  respectRateLimit?: boolean;
  userAgent?: string;
  contentSelector?: string; // CSS selector for specific content area (e.g., "#block-system-main")
  excludeSelectors?: string[]; // CSS selectors to exclude (e.g., [".ads", ".navigation", ".footer"])
  includeSelectors?: string[]; // CSS selectors to specifically include
  preserveFormatting?: boolean; // Whether to preserve HTML formatting for structured content
}

export interface ScrapedContentDto {
  url: string;
  title?: string;
  content: string;
  metadata?: ContentMetadataDto;
  tokenCount?: number;
  scrapedAt: string;
  success: boolean;
  error?: string;
}

export interface ContentMetadataDto {
  title?: string;
  description?: string;
  author?: string;
  publishDate?: string;
  keywords?: string[];
  contentType?: string;
  language?: string;
}

export interface OptimizedContentDto {
  originalContent: string;
  cleanedContent: string;
  metadata: ContentMetadataDto;
  tokenReduction: number;
  estimatedTokens: number;
}

export interface ScrapingErrorDto {
  url: string;
  errorType: 'NETWORK_ERROR' | 'PARSING_ERROR' | 'RATE_LIMIT' | 'BLOCKED' | 'TIMEOUT';
  message: string;
  statusCode?: number;
  timestamp: string;
}

export interface FallbackStrategy {
  name: 'cheerio' | 'jsdom' | 'browser_service';
  priority: number;
  enabled: boolean;
}
