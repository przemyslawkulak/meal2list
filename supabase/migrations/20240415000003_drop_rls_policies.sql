-- Drop all RLS policies
DROP POLICY IF EXISTS "Categories are viewable by all authenticated users" ON categories;

-- Drop Recipes policies
DROP POLICY IF EXISTS "Users can view their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can insert their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete their own recipes" ON recipes;

-- Drop Shopping Lists policies
DROP POLICY IF EXISTS "Users can view shopping lists they have access to" ON shopping_lists;
DROP POLICY IF EXISTS "Users can insert shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can update shopping lists they have access to" ON shopping_lists;
DROP POLICY IF EXISTS "Users can delete shopping lists they have access to" ON shopping_lists;

-- Drop Shopping List Users policies
DROP POLICY IF EXISTS "Users can view their shopping list associations" ON shopping_list_users;
DROP POLICY IF EXISTS "Users can insert their shopping list associations" ON shopping_list_users;
DROP POLICY IF EXISTS "Users can delete their shopping list associations" ON shopping_list_users;

-- Drop Shopping List Items policies
DROP POLICY IF EXISTS "Users can view items from their shopping lists" ON shopping_list_items;
DROP POLICY IF EXISTS "Users can insert items to their shopping lists" ON shopping_list_items;
DROP POLICY IF EXISTS "Users can update items in their shopping lists" ON shopping_list_items;
DROP POLICY IF EXISTS "Users can delete items from their shopping lists" ON shopping_list_items;

-- Drop Generation policies
DROP POLICY IF EXISTS "Users can view generations for their shopping lists" ON generation;
DROP POLICY IF EXISTS "Users can insert generations for their shopping lists" ON generation;

-- Drop Generation Error policies
DROP POLICY IF EXISTS "Users can view errors for their shopping lists" ON generation_error;
DROP POLICY IF EXISTS "Users can insert errors for their shopping lists" ON generation_error;

-- Disable RLS on all tables
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY; 