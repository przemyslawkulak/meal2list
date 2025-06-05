import { z } from 'zod';

export const generateSchema = z.object({
  recipe_text: z
    .string()
    .min(1, 'Recipe text is required')
    .max(10000, 'Recipe text cannot exceed 10000 characters')
    .trim(),
});
