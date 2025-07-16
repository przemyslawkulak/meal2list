-- Migration: Add recipe_source column to shopping_list_items
-- Description: Add a column to track the name of the recipe from which an item was generated
-- This is separate from the 'source' field which tracks generation method ('auto', 'manual', 'modified')
-- Date: 2024-12-20

-- Add recipe_source column to shopping_list_items table
ALTER TABLE shopping_list_items 
ADD COLUMN recipe_source TEXT;

-- Add comment to explain the purpose of the column
COMMENT ON COLUMN shopping_list_items.recipe_source IS 'Name of the recipe from which this item was generated. Null for manually added items.';

-- Create index for faster queries when filtering by recipe source
CREATE INDEX idx_shopping_list_items_recipe_source ON shopping_list_items(recipe_source);

-- Add a rollback function in case we need to revert
CREATE OR REPLACE FUNCTION revert_20241220000000() RETURNS void AS $$
BEGIN
    -- Drop index
    DROP INDEX IF EXISTS idx_shopping_list_items_recipe_source;
    
    -- Drop column
    ALTER TABLE shopping_list_items DROP COLUMN IF EXISTS recipe_source;
END;
$$ LANGUAGE plpgsql; 