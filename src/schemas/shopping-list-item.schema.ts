import { z } from 'zod';

export const shoppingListItemSchema = z.object({
  product_name: z.string().min(1, 'Product name is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().optional(),
  source: z.enum(['auto', 'manual', 'modified']),
  category_id: z.string().uuid('Invalid category ID'),
});

export const batchShoppingListItemsSchema = z
  .array(shoppingListItemSchema)
  .min(1, 'At least one item is required')
  .max(100, 'Maximum 100 items allowed per batch');

// Schema for updating shopping list items - partial updates allowed
export const updateShoppingListItemSchema = z
  .object({
    product_name: z
      .string()
      .min(1, 'Product name is required')
      .max(255, 'Product name too long')
      .optional(),
    quantity: z
      .number()
      .positive('Quantity must be positive')
      .max(9999, 'Quantity too large')
      .optional(),
    unit: z.string().max(50, 'Unit name too long').optional(),
    is_checked: z.boolean().optional(),
    category_id: z.string().uuid('Invalid category ID').optional(),
    recipe_source: z.string().max(255, 'Recipe source too long').nullable().optional(),
    product_id: z.string().uuid('Invalid product ID').nullable().optional(),
    generation_id: z.string().uuid('Invalid generation ID').nullable().optional(),
    source: z.enum(['auto', 'manual', 'modified']).optional(),
  })
  .refine(data => Object.keys(data).length > 0, { message: 'At least one field must be updated' });

export type ShoppingListItemValidationError = z.inferFormattedError<typeof shoppingListItemSchema>;
export type BatchShoppingListItemsValidationError = z.inferFormattedError<
  typeof batchShoppingListItemsSchema
>;
export type UpdateShoppingListItemValidationError = z.inferFormattedError<
  typeof updateShoppingListItemSchema
>;
