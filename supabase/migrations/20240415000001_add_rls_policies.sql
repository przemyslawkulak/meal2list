-- Enable RLS on all tables
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error ENABLE ROW LEVEL SECURITY;

-- Categories table is readable by all authenticated users
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by all authenticated users"
    ON categories FOR SELECT
    TO authenticated
    USING (true);

-- Recipes policies
CREATE POLICY "Users can view their own recipes"
    ON recipes FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes"
    ON recipes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes"
    ON recipes FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
    ON recipes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Shopping Lists policies
CREATE POLICY "Users can view shopping lists they have access to"
    ON shopping_lists FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM shopping_list_users
        WHERE shopping_list_users.shopping_list_id = id
        AND shopping_list_users.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert shopping lists"
    ON shopping_lists FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update shopping lists they have access to"
    ON shopping_lists FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM shopping_list_users
        WHERE shopping_list_users.shopping_list_id = id
        AND shopping_list_users.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete shopping lists they have access to"
    ON shopping_lists FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM shopping_list_users
        WHERE shopping_list_users.shopping_list_id = id
        AND shopping_list_users.user_id = auth.uid()
    ));

-- Shopping List Users policies
CREATE POLICY "Users can view their shopping list associations"
    ON shopping_list_users FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their shopping list associations"
    ON shopping_list_users FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their shopping list associations"
    ON shopping_list_users FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Shopping List Items policies
CREATE POLICY "Users can view items from their shopping lists"
    ON shopping_list_items FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM shopping_list_users
        WHERE shopping_list_users.shopping_list_id = shopping_list_id
        AND shopping_list_users.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert items to their shopping lists"
    ON shopping_list_items FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM shopping_list_users
        WHERE shopping_list_users.shopping_list_id = shopping_list_id
        AND shopping_list_users.user_id = auth.uid()
    ));

CREATE POLICY "Users can update items in their shopping lists"
    ON shopping_list_items FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM shopping_list_users
        WHERE shopping_list_users.shopping_list_id = shopping_list_id
        AND shopping_list_users.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete items from their shopping lists"
    ON shopping_list_items FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM shopping_list_users
        WHERE shopping_list_users.shopping_list_id = shopping_list_id
        AND shopping_list_users.user_id = auth.uid()
    ));

-- Generation policies
CREATE POLICY "Users can view generations for their shopping lists"
    ON generation FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM shopping_list_users
        WHERE shopping_list_users.shopping_list_id = shopping_list_id
        AND shopping_list_users.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert generations for their shopping lists"
    ON generation FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM shopping_list_users
        WHERE shopping_list_users.shopping_list_id = shopping_list_id
        AND shopping_list_users.user_id = auth.uid()
    ));

-- Generation Error policies
CREATE POLICY "Users can view errors for their shopping lists"
    ON generation_error FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM shopping_list_users
        WHERE shopping_list_users.shopping_list_id = shopping_list_id
        AND shopping_list_users.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert errors for their shopping lists"
    ON generation_error FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM shopping_list_users
        WHERE shopping_list_users.shopping_list_id = shopping_list_id
        AND shopping_list_users.user_id = auth.uid()
    )); 