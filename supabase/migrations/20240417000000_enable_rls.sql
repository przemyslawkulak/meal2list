-- Enable RLS on all tables
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_error ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for recipes
CREATE POLICY "Users can view their own recipes" ON public.recipes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recipes" ON public.recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recipes" ON public.recipes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recipes" ON public.recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for shopping_list_users
CREATE POLICY "Users can view their shopping list associations" ON public.shopping_list_users
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their shopping list associations" ON public.shopping_list_users
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their shopping list associations" ON public.shopping_list_users
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for generation
CREATE POLICY "Users can view generations for their shopping lists" ON public.generation
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM shopping_list_users
    WHERE shopping_list_id = generation.shopping_list_id
    AND user_id = auth.uid()
  ));
CREATE POLICY "Users can insert generations for their shopping lists" ON public.generation
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM shopping_list_users
    WHERE shopping_list_id = generation.shopping_list_id
    AND user_id = auth.uid()
  ));

-- Create policies for generation_error
CREATE POLICY "Users can view errors for their shopping lists" ON public.generation_error
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM shopping_list_users
    WHERE shopping_list_id = generation_error.shopping_list_id
    AND user_id = auth.uid()
  ));
CREATE POLICY "Users can insert errors for their shopping lists" ON public.generation_error
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM shopping_list_users
    WHERE shopping_list_id = generation_error.shopping_list_id
    AND user_id = auth.uid()
  ));

-- Create policy for categories (viewable by all authenticated users)
CREATE POLICY "Categories are viewable by all authenticated users" ON public.categories
  FOR SELECT USING (auth.role() = 'authenticated'); 