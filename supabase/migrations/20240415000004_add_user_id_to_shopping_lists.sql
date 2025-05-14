-- Add user_id column to shopping_lists
ALTER TABLE shopping_lists 
ADD COLUMN user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index on user_id for better query performance
CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);

-- Enable Row Level Security
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

-- Create policies for shopping_lists
CREATE POLICY "Users can view their own shopping lists" 
    ON shopping_lists FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shopping lists" 
    ON shopping_lists FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping lists" 
    ON shopping_lists FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping lists" 
    ON shopping_lists FOR DELETE 
    USING (auth.uid() = user_id);

-- Enable RLS on shopping_list_items
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Create policies for shopping_list_items based on parent shopping list ownership
CREATE POLICY "Users can view items in their shopping lists"
    ON shopping_list_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM shopping_lists
        WHERE shopping_lists.id = shopping_list_items.shopping_list_id
        AND shopping_lists.user_id = auth.uid()
    ));

CREATE POLICY "Users can create items in their shopping lists"
    ON shopping_list_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM shopping_lists
        WHERE shopping_lists.id = shopping_list_items.shopping_list_id
        AND shopping_lists.user_id = auth.uid()
    ));

CREATE POLICY "Users can update items in their shopping lists"
    ON shopping_list_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM shopping_lists
        WHERE shopping_lists.id = shopping_list_items.shopping_list_id
        AND shopping_lists.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete items in their shopping lists"
    ON shopping_list_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM shopping_lists
        WHERE shopping_lists.id = shopping_list_items.shopping_list_id
        AND shopping_lists.user_id = auth.uid()
    ));

-- Add a rollback function in case we need to revert
CREATE OR REPLACE FUNCTION revert_20240415000004() RETURNS void AS $$
BEGIN
    -- Drop policies for shopping_list_items
    DROP POLICY IF EXISTS "Users can view items in their shopping lists" ON shopping_list_items;
    DROP POLICY IF EXISTS "Users can create items in their shopping lists" ON shopping_list_items;
    DROP POLICY IF EXISTS "Users can update items in their shopping lists" ON shopping_list_items;
    DROP POLICY IF EXISTS "Users can delete items in their shopping lists" ON shopping_list_items;
    
    -- Drop policies for shopping_lists
    DROP POLICY IF EXISTS "Users can view their own shopping lists" ON shopping_lists;
    DROP POLICY IF EXISTS "Users can create their own shopping lists" ON shopping_lists;
    DROP POLICY IF EXISTS "Users can update their own shopping lists" ON shopping_lists;
    DROP POLICY IF EXISTS "Users can delete their own shopping lists" ON shopping_lists;
    
    -- Disable RLS
    ALTER TABLE shopping_lists DISABLE ROW LEVEL SECURITY;
    ALTER TABLE shopping_list_items DISABLE ROW LEVEL SECURITY;
    
    -- Drop index
    DROP INDEX IF EXISTS idx_shopping_lists_user_id;
    
    -- Drop user_id column
    ALTER TABLE shopping_lists DROP COLUMN IF EXISTS user_id;
END;
$$ LANGUAGE plpgsql; 