export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type Database = {
  graphql_public: {
    Tables: { [_ in never]: never };
    Views: { [_ in never]: never };
    Functions: {
      graphql: {
        Args: { operationName?: string; query?: string; variables?: Json; extensions?: Json };
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
  public: {
    Tables: {
      categories: {
        Row: { created_at: string; id: string; name: string; updated_at: string };
        Insert: { created_at?: string; id?: string; name: string; updated_at?: string };
        Update: { created_at?: string; id?: string; name?: string; updated_at?: string };
        Relationships: [];
      };
      generation: {
        Row: {
          created_at: string;
          generation_time: number;
          id: string;
          recipe_id: string;
          shopping_list_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          generation_time: number;
          id?: string;
          recipe_id: string;
          shopping_list_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          generation_time?: number;
          id?: string;
          recipe_id?: string;
          shopping_list_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'generation_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'generation_shopping_list_id_fkey';
            columns: ['shopping_list_id'];
            isOneToOne: false;
            referencedRelation: 'shopping_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      generation_error: {
        Row: {
          created_at: string;
          error_code: string | null;
          error_message: string;
          id: string;
          recipe_id: string;
          shopping_list_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          error_code?: string | null;
          error_message: string;
          id?: string;
          recipe_id: string;
          shopping_list_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          error_code?: string | null;
          error_message?: string;
          id?: string;
          recipe_id?: string;
          shopping_list_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'generation_error_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'generation_error_shopping_list_id_fkey';
            columns: ['shopping_list_id'];
            isOneToOne: false;
            referencedRelation: 'shopping_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          created_at: string;
          created_by: string | null;
          default_category_id: string;
          id: string;
          is_common: boolean;
          name: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          default_category_id: string;
          id?: string;
          is_common?: boolean;
          name: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          default_category_id?: string;
          id?: string;
          is_common?: boolean;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_default_category_id_fkey';
            columns: ['default_category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          updated_at: string | null;
          username: string | null;
          website: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          updated_at?: string | null;
          username?: string | null;
          website?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          updated_at?: string | null;
          username?: string | null;
          website?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      recipes: {
        Row: {
          created_at: string;
          id: string;
          recipe_text: string;
          source: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          recipe_text: string;
          source?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          recipe_text?: string;
          source?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      shopping_list_items: {
        Row: {
          category_id: string;
          created_at: string;
          generation_id: string | null;
          id: string;
          is_checked: boolean;
          product_id: string | null;
          product_name: string;
          quantity: number;
          shopping_list_id: string;
          source: string;
          unit: string | null;
          updated_at: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          generation_id?: string | null;
          id?: string;
          is_checked?: boolean;
          product_id?: string | null;
          product_name: string;
          quantity: number;
          shopping_list_id: string;
          source: string;
          unit?: string | null;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          generation_id?: string | null;
          id?: string;
          is_checked?: boolean;
          product_id?: string | null;
          product_name?: string;
          quantity?: number;
          shopping_list_id?: string;
          source?: string;
          unit?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shopping_list_items_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shopping_list_items_generation_id_fkey';
            columns: ['generation_id'];
            isOneToOne: false;
            referencedRelation: 'generation';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shopping_list_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shopping_list_items_shopping_list_id_fkey';
            columns: ['shopping_list_id'];
            isOneToOne: false;
            referencedRelation: 'shopping_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      shopping_list_users: {
        Row: { created_at: string; shopping_list_id: string; updated_at: string; user_id: string };
        Insert: {
          created_at?: string;
          shopping_list_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          shopping_list_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shopping_list_users_shopping_list_id_fkey';
            columns: ['shopping_list_id'];
            isOneToOne: false;
            referencedRelation: 'shopping_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      shopping_lists: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          recipe_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          recipe_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          recipe_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shopping_lists_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
        ];
      };
      user_products: {
        Row: {
          created_at: string;
          id: string;
          last_used_at: string | null;
          preferred_category_id: string | null;
          product_id: string;
          use_count: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_used_at?: string | null;
          preferred_category_id?: string | null;
          product_id: string;
          use_count?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_used_at?: string | null;
          preferred_category_id?: string | null;
          product_id?: string;
          use_count?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_products_preferred_category_id_fkey';
            columns: ['preferred_category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      gtrgm_compress: { Args: { '': unknown }; Returns: unknown };
      gtrgm_decompress: { Args: { '': unknown }; Returns: unknown };
      gtrgm_in: { Args: { '': unknown }; Returns: unknown };
      gtrgm_options: { Args: { '': unknown }; Returns: undefined };
      gtrgm_out: { Args: { '': unknown }; Returns: unknown };
      revert_20240415000004: { Args: Record<PropertyKey, never>; Returns: undefined };
      set_limit: { Args: { '': number }; Returns: number };
      show_limit: { Args: Record<PropertyKey, never>; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
      unaccent: { Args: { '': string }; Returns: string };
      unaccent_init: { Args: { '': unknown }; Returns: unknown };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
type DefaultSchema = Database[Extract<keyof Database, 'public'>];
export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;
export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends { Insert: infer I }
      ? I
      : never
    : never;
export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends { Update: infer U }
      ? U
      : never
    : never;
export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;
export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;
export const Constants = { graphql_public: { Enums: {} }, public: { Enums: {} } } as const;
