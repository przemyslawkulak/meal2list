# Database Schema Specification

## 1. Tables

### 1.1. Users

This table is managed by Supabase Auth.

- **id**: UUID, Primary Key, default: `gen_random_uuid()`
- **email**: TEXT, UNIQUE, NOT NULL
- **password_hash**: TEXT, NOT NULL
- **created_at**: TIMESTAMPTZ, NOT NULL, default: `NOW()`
- **updated_at**: TIMESTAMPTZ, NOT NULL, default: `NOW()`

### 1.2. Recipes

- **id**: UUID, Primary Key, default: `gen_random_uuid()`
- **user_id**: UUID, NOT NULL, Foreign Key references `users(id)` ON DELETE CASCADE
- **title**: TEXT, NOT NULL
- **recipe_text**: TEXT, NOT NULL _(max 5000 characters enforced on frontend)_
- **source**: TEXT
- **created_at**: TIMESTAMPTZ, NOT NULL, default: `NOW()`
- **updated_at**: TIMESTAMPTZ, NOT NULL, default: `NOW()`

**Indexes:**

- Index on **user_id**

### 1.3. ShoppingLists

- **id**: UUID, Primary Key, default: `gen_random_uuid()`
- **recipe_id**: UUID, NULL, Foreign Key references `recipes(id)` ON DELETE SET NULL
- **name**: TEXT, NOT NULL
- **created_at**: TIMESTAMPTZ, NOT NULL, default: `NOW()`
- **updated_at**: TIMESTAMPTZ, NOT NULL, default: `NOW()`

_Note: ShoppingLists are linked to users via a many-to-many relationship (see table ShoppingListUsers)._

**Indexes:**

- Index on **recipe_id**

### 1.4. ShoppingListItems

- **id**: UUID, Primary Key, default: `gen_random_uuid()`
- **shopping_list_id**: UUID, NOT NULL, Foreign Key references `shopping_lists(id)` ON DELETE CASCADE
- **generation_id**: UUID, NULL, Foreign Key references `generation(id)` ON DELETE SET NULL
- **category_id**: UUID, NOT NULL, Foreign Key references `categories(id)` ON DELETE RESTRICT
- **product_name**: TEXT, NOT NULL
- **quantity**: NUMERIC, NOT NULL
- **unit**: VARCHAR(50)
- **source**: TEXT, NOT NULL _(e.g., 'auto-generated', 'manual', 'modified')_
- **is_checked**: BOOLEAN, NOT NULL, DEFAULT `false`
- **created_at**: TIMESTAMPTZ, NOT NULL, default: `NOW()`
- **updated_at**: TIMESTAMPTZ, NOT NULL, default: `NOW()`

**Indexes:**

- Index on **shopping_list_id**
- Index on **category_id**
- Index on **generation_id**

### 1.5. Categories

- **id**: UUID, Primary Key, default: `gen_random_uuid()`
- **name**: TEXT, UNIQUE, NOT NULL _(default category: 'Inne' for unassigned products)_
- **created_at**: TIMESTAMPTZ, NOT NULL, default: `NOW()`
- **updated_at**: TIMESTAMPTZ, NOT NULL, default: `NOW()`

### 1.6. ShoppingListUsers (Join Table)

- **user_id**: UUID, NOT NULL, Foreign Key references `users(id)` ON DELETE CASCADE
- **shopping_list_id**: UUID, NOT NULL, Foreign Key references `shopping_lists(id)` ON DELETE CASCADE
- **created_at**: TIMESTAMPTZ, NOT NULL, default: `NOW()`
- **updated_at**: TIMESTAMPTZ, NOT NULL, default: `NOW()`

**Primary Key:** Composite (`user_id`, `shopping_list_id`)

### 1.7. Generation

- **id**: UUID, Primary Key, default: `gen_random_uuid()`
- **recipe_id**: UUID, NOT NULL, Foreign Key references `recipes(id)` ON DELETE CASCADE
- **shopping_list_id**: UUID, NOT NULL, Foreign Key references `shopping_lists(id)` ON DELETE CASCADE
- **generation_time**: NUMERIC, NOT NULL _(represents the processing duration of the generation)_
- **created_at**: TIMESTAMPTZ, NOT NULL, default: `NOW()`
- **updated_at**: TIMESTAMPTZ, NOT NULL, default: `NOW()`

**Indexes:**

- Index on **recipe_id**
- Index on **shopping_list_id**

### 1.8. Generation_Error

- **id**: UUID, Primary Key, default: `gen_random_uuid()`
- **recipe_id**: UUID, NOT NULL, Foreign Key references `recipes(id)` ON DELETE CASCADE
- **shopping_list_id**: UUID, NOT NULL, Foreign Key references `shopping_lists(id)` ON DELETE CASCADE
- **error_message**: TEXT, NOT NULL
- **error_code**: TEXT
- **created_at**: TIMESTAMPTZ, NOT NULL, default: `NOW()`
- **updated_at**: TIMESTAMPTZ, NOT NULL, default: `NOW()`

**Indexes:**

- Index on **recipe_id**
- Index on **shopping_list_id**

## 2. Relationships

- **Users** (1) — (many) **Recipes**
- **Users** (many) — (many) **ShoppingLists** via **ShoppingListUsers**
- **Recipes** (1) — (many) **Generation**
- **ShoppingLists** (1) — (many) **Generation**
- **Generation** (1) — (many) **ShoppingListItems**
- **ShoppingLists** (1) — (many) **ShoppingListItems**
- **Categories** (1) — (many) **ShoppingListItems**
- **Generation_Error** links one **Recipe** and one **ShoppingList**

## 3. Indexes Summary

Indexes are created on foreign key columns in all tables to optimize JOIN operations.

## 4. PostgreSQL RLS Policies

- Row-Level Security (RLS) is enabled on tables containing user-specific data (e.g., **Recipes**, **ShoppingListItems**, **Generation_Error**).
- **ShoppingLists** are accessed through the join table **ShoppingListUsers**.
- The **Categories** table is readable by all users.

## 5. Additional Notes

- All timestamp fields use TIMESTAMPTZ with a default of `NOW()` for automatic tracking.
- UUIDs are utilized as primary keys for scalability.
- The schema adheres to Third Normal Form (3NF).
- The many-to-many relationship for ShoppingLists and Users is handled via the **ShoppingListUsers** join table.
- The **Generation** table links one Recipe and one ShoppingList (representing the auto-generation process) and is associated with multiple ShoppingListItems via the **generation_id** foreign key.
