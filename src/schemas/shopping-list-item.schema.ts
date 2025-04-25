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

export type ShoppingListItemValidationError = z.inferFormattedError<typeof shoppingListItemSchema>;
export type BatchShoppingListItemsValidationError = z.inferFormattedError<
  typeof batchShoppingListItemsSchema
>;
