# REST API Plan

## 1. Resources

This API supports the following primary resources, each mapped to a corresponding database table:

- **Users**: Represents application users and leverages Supabase Auth for registration and authentication. (Table: `Users`)
- **Recipes**: Holds recipe submissions including textual information. (Table: `Recipes`)
- **ShoppingLists**: Represents grocery lists, which may be auto-generated from recipes or created manually. User association is managed via the join table `ShoppingListUsers`. (Table: `ShoppingLists`)
- **ShoppingListItems**: Contains individual items within a shopping list, including details such as product name, quantity, and source. (Table: `ShoppingListItems`)
- **Categories**: Provides static categories (e.g., dairy, vegetables, fruits, bread) for grouping shopping list items. (Table: `Categories`)
- **Generation**: Logs the auto-generation process linking recipes to shopping lists. (Table: `Generation`)
- **Generation_Error**: Captures errors that occur during the auto-generation process. (Table: `Generation_Error`)

## 2. Endpoints

### Authentication (Managed by Supabase)

- **POST /auth/signup**

  - Description: Register a new user.
  - Request Payload: `{ "email": "string", "password": "string" }`
  - Request Example:
    ```json
    { "email": "user@example.com", "password": "Password123" }
    ```
  - Successful Response Example:
    ```json
    {
      "message": "User registered successfully",
      "user": { "id": "uuid", "email": "user@example.com", "created_at": "2023-01-01T00:00:00Z" }
    }
    ```
  - Error Responses:
    - 400 Bad Request:
      ```json
      { "error": "Invalid input: email and password are required" }
      ```
    - 409 Conflict:
      ```json
      { "error": "Email already registered" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error. Please try again later." }
      ```

- **POST /auth/login**
  - Description: Sign in an existing user.
  - Request Payload: `{ "email": "string", "password": "string" }`
  - Request Example:
    ```json
    { "email": "user@example.com", "password": "Password123" }
    ```
  - Successful Response Example:
    ```json
    { "token": "jwt-token", "user": { "id": "uuid", "email": "user@example.com" } }
    ```
  - Error Responses:
    - 400 Bad Request:
      ```json
      { "error": "Invalid input: email and password are required" }
      ```
    - 401 Unauthorized:
      ```json
      { "error": "Invalid email or password" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error. Please try again later." }
      ```

### Recipes

- **POST /recipes**

  - Description: Create a new recipe.
  - Request Payload: `{ "title": "string", "recipe_text": "string", "source": "string (optional)" }`
  - Request Example:
    ```json
    { "title": "Chocolate Cake", "recipe_text": "Mix flour, sugar, cocoa...", "source": "user" }
    ```
  - Successful Response Example:
    ```json
    {
      "id": "uuid",
      "title": "Chocolate Cake",
      "recipe_text": "Mix flour, sugar, cocoa...",
      "source": "user",
      "created_at": "2023-01-01T00:00:00Z"
    }
    ```
  - Error Responses:
    - 400 Bad Request:
      ```json
      { "error": "Missing required fields: title and recipe_text" }
      ```
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

- **GET /recipes**

  - Description: Retrieve a list of recipes for the authenticated user.
  - Query Parameters: Supports pagination (e.g., `page`, `limit`).
  - Successful Response Example:
    ```json
    [
      {
        "id": "uuid",
        "title": "Chocolate Cake",
        "recipe_text": "Mix ingredients...",
        "source": "user",
        "created_at": "2023-01-01T00:00:00Z"
      },
      {
        "id": "uuid",
        "title": "Pasta",
        "recipe_text": "Boil water...",
        "source": "user",
        "created_at": "2023-01-02T00:00:00Z"
      }
    ]
    ```
  - Error Responses:
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

- **GET /recipes/{recipeId}**

  - Description: Retrieve details for a specific recipe.
  - Successful Response Example:
    ```json
    {
      "id": "uuid",
      "title": "Chocolate Cake",
      "recipe_text": "Mix ingredients...",
      "source": "user",
      "created_at": "2023-01-01T00:00:00Z"
    }
    ```
  - Error Responses:
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 404 Not Found:
      ```json
      { "error": "Recipe not found" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

- **PUT /recipes/{recipeId}**

  - Description: Update an existing recipe.
  - Request Payload: `{ "title": "string", "recipe_text": "string", "source": "string (optional)" }`
  - Request Example:
    ```json
    { "title": "Updated Cake", "recipe_text": "Updated recipe text", "source": "user" }
    ```
  - Successful Response Example:
    ```json
    {
      "id": "uuid",
      "title": "Updated Cake",
      "recipe_text": "Updated recipe text",
      "source": "user",
      "updated_at": "2023-01-02T00:00:00Z"
    }
    ```
  - Error Responses:
    - 400 Bad Request:
      ```json
      { "error": "Invalid input: title and recipe_text required" }
      ```
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 404 Not Found:
      ```json
      { "error": "Recipe not found" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

- **DELETE /recipes/{recipeId}**
  - Description: Delete a recipe.
  - Successful Response Example:
    ```json
    { "message": "Recipe deleted successfully" }
    ```
  - Error Responses:
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 404 Not Found:
      ```json
      { "error": "Recipe not found" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

### Shopping Lists

- **POST /shopping-lists**

  - Description: Create a new shopping list, either manually or based on a recipe.
  - Request Payload: `{ "name": "string", "recipe_id": "UUID (optional)" }`
  - Request Example:
    ```json
    { "name": "Weekly Groceries", "recipe_id": "uuid" }
    ```
  - Successful Response Example:
    ```json
    {
      "id": "uuid",
      "name": "Weekly Groceries",
      "recipe_id": "uuid",
      "created_at": "2023-01-01T00:00:00Z"
    }
    ```
  - Error Responses:
    - 400 Bad Request:
      ```json
      { "error": "Name is required" }
      ```
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

- **GET /shopping-lists**

  - Description: Retrieve all shopping lists for the authenticated user.
  - Query Parameters: Supports pagination, filtering, and sorting.
  - Successful Response Example:
    ```json
    [
      {
        "id": "uuid",
        "name": "Weekly Groceries",
        "recipe_id": "uuid",
        "created_at": "2023-01-01T00:00:00Z"
      },
      {
        "id": "uuid",
        "name": "Party Supplies",
        "recipe_id": null,
        "created_at": "2023-01-05T00:00:00Z"
      }
    ]
    ```
  - Error Responses:
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

- **GET /shopping-lists/{listId}**

  - Description: Retrieve the details of a specific shopping list, including its items.
  - Successful Response Example:
    ```json
    {
      "id": "uuid",
      "name": "Weekly Groceries",
      "items": [{ "id": "uuid", "product_name": "Milk", "quantity": 2, "unit": "liters" }],
      "created_at": "2023-01-01T00:00:00Z"
    }
    ```
  - Error Responses:
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 404 Not Found:
      ```json
      { "error": "Shopping list not found" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

- **PUT /shopping-lists/{listId}**

  - Description: Update shopping list details.
  - Request Payload: `{ "name": "string" }`
  - Request Example:
    ```json
    { "name": "Updated Groceries" }
    ```
  - Successful Response Example:
    ```json
    { "id": "uuid", "name": "Updated Groceries", "updated_at": "2023-01-02T00:00:00Z" }
    ```
  - Error Responses:
    - 400 Bad Request:
      ```json
      { "error": "Name is required" }
      ```
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 404 Not Found:
      ```json
      { "error": "Shopping list not found" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

- **DELETE /shopping-lists/{listId}**
  - Description: Delete a shopping list. Client-side confirmation is required before calling this endpoint.
  - Successful Response Example:
    ```json
    { "message": "Shopping list deleted successfully" }
    ```
  - Error Responses:
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 404 Not Found:
      ```json
      { "error": "Shopping list not found" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

### Shopping List Items

- **POST /shopping-lists/{listId}/items**

  - Description: Add an item to a shopping list.
  - Request Payload: `{ "product_name": "string", "quantity": number, "unit": "string (optional)", "source": "string (auto, manual, modified)", "category_id": "UUID" }`
  - Request Example:
    ```json
    {
      "product_name": "Eggs",
      "quantity": 12,
      "unit": "pcs",
      "source": "manual",
      "category_id": "uuid"
    }
    ```
  - Successful Response Example:
    ```json
    {
      "id": "uuid",
      "product_name": "Eggs",
      "quantity": 12,
      "unit": "pcs",
      "source": "manual",
      "category_id": "uuid",
      "created_at": "2023-01-01T00:00:00Z"
    }
    ```
  - Error Responses:
    - 400 Bad Request:
      ```json
      { "error": "Missing required fields: product_name, quantity, and category_id" }
      ```
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

- **GET /shopping-lists/{listId}/items**

  - Description: Retrieve all items within a shopping list.
  - Query Parameters: Optionally filter by `is_checked` status.
  - Successful Response Example:
    ```json
    [
      {
        "id": "uuid",
        "product_name": "Eggs",
        "quantity": 12,
        "unit": "pcs",
        "is_checked": false,
        "category_id": "uuid"
      },
      {
        "id": "uuid",
        "product_name": "Milk",
        "quantity": 1,
        "unit": "liter",
        "is_checked": true,
        "category_id": "uuid"
      }
    ]
    ```
  - Error Responses:
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 404 Not Found:
      ```json
      { "error": "Shopping list not found" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

- **PUT /shopping-lists/{listId}/items/{itemId}**

  - Description: Update a specific shopping list item (e.g., adjust quantity, mark as checked).
  - Request Payload: `{ "quantity": number, "unit": "string", "is_checked": boolean }`
  - Request Example:
    ```json
    { "quantity": 10, "unit": "pcs", "is_checked": true }
    ```
  - Successful Response Example:
    ```json
    {
      "id": "uuid",
      "product_name": "Eggs",
      "quantity": 10,
      "unit": "pcs",
      "is_checked": true,
      "updated_at": "2023-01-02T00:00:00Z"
    }
    ```
  - Error Responses:
    - 400 Bad Request:
      ```json
      { "error": "Invalid input data" }
      ```
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 404 Not Found:
      ```json
      { "error": "Shopping list or item not found" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

- **DELETE /shopping-lists/{listId}/items/{itemId}**
  - Description: Delete an item from a shopping list.
  - Successful Response Example:
    ```json
    { "message": "Item deleted successfully" }
    ```
  - Error Responses:
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 404 Not Found:
      ```json
      { "error": "Shopping list or item not found" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

#### Batch Add Shopping List Items

- **POST /shopping-lists/{listId}/items/batch**
  - Description: Add multiple items to a shopping list in a single request.
  - Request Payload: An array of item objects, each containing:
    - product_name (string, required)
    - quantity (number, required)
    - unit (string, optional)
    - source (string, one of: "auto", "manual", "modified")
    - category_id (UUID, required)
  - Request Example:
    ```json
    [
      {
        "product_name": "Eggs",
        "quantity": 12,
        "unit": "pcs",
        "source": "manual",
        "category_id": "uuid"
      },
      {
        "product_name": "Milk",
        "quantity": 1,
        "unit": "liter",
        "source": "manual",
        "category_id": "uuid"
      }
    ]
    ```
  - Successful Response Example:
    ```json
    [
      {
        "id": "uuid",
        "product_name": "Eggs",
        "quantity": 12,
        "unit": "pcs",
        "source": "manual",
        "category_id": "uuid",
        "created_at": "2023-01-01T00:00:00Z"
      },
      {
        "id": "uuid",
        "product_name": "Milk",
        "quantity": 1,
        "unit": "liter",
        "source": "manual",
        "category_id": "uuid",
        "created_at": "2023-01-01T00:00:00Z"
      }
    ]
    ```
  - Error Responses:
    - 400 Bad Request:
      ```json
      { "error": "Invalid input: one or more items are missing required fields" }
      ```
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

### Categories

- **GET /categories**
  - Description: Retrieve a list of all available categories.
  - Successful Response Example:
    ```json
    [
      { "id": "uuid", "name": "Dairy" },
      { "id": "uuid", "name": "Vegetables" },
      { "id": "uuid", "name": "Fruits" },
      { "id": "uuid", "name": "Bread" }
    ]
    ```
  - Error Responses:
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

### Auto-Generation Endpoints

- **POST /recipes/{recipeId}/generate-shopping-list**

  - Description: Trigger auto-generation of a shopping list based on the recipe text.
  - Request Payload: None.
  - Successful Response Example:
    ```json
    {
      "shopping_list": {
        "id": "uuid",
        "name": "Auto-generated List",
        "items": [{ "id": "uuid", "product_name": "Sugar", "quantity": 1 }]
      }
    }
    ```
  - Error Responses:
    - 400 Bad Request:
      ```json
      { "error": "Invalid recipe ID" }
      ```
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Generation failed due to server error" }
      ```

- **GET /recipes/{recipeId}/generation-status**
  - Description: Check the status of the auto-generation process.
  - Successful Response Example:
    ```json
    { "status": "completed", "processing_time": 2.5, "errors": [] }
    ```
  - Error Responses:
    - 400 Bad Request:
      ```json
      { "error": "Invalid recipe ID" }
      ```
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 404 Not Found:
      ```json
      { "error": "Generation process not found" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

#### Retrieve Generation Records for a Shopping List

- **GET /shopping-lists/{listId}/generations**
  - Description: Retrieve all generation records (auto-generation processes) associated with a specific shopping list.
  - Validation: The path parameter `listId` is required and must be a valid UUID.
  - Successful Response Example:
    ```json
    [
      {
        "id": "uuid",
        "recipe_id": "uuid",
        "shopping_list_id": "uuid",
        "generation_time": 2.5,
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z"
      },
      {
        "id": "uuid",
        "recipe_id": "uuid",
        "shopping_list_id": "uuid",
        "generation_time": 3.1,
        "created_at": "2023-01-02T00:00:00Z",
        "updated_at": "2023-01-02T00:00:00Z"
      }
    ]
    ```
  - Error Responses:
    - 400 Bad Request:
      ```json
      { "error": "Invalid shopping list ID" }
      ```
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 404 Not Found:
      ```json
      { "error": "Shopping list not found" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

### Error Logging (Admin/Monitoring)

- **GET /generation-errors**
  - Description: Retrieve logs for generation errors.
  - Query Parameters: Supports pagination and filtering by recipe or shopping list.
  - Successful Response Example:
    ```json
    [
      {
        "id": "uuid",
        "error_message": "Timeout error",
        "error_code": "TIMEOUT",
        "created_at": "2023-01-01T00:00:00Z"
      }
    ]
    ```
  - Error Responses:
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Server error" }
      ```

#### Start Generation Without Saving Recipe

- **POST /generate-shopping-list**
  - Description: Initiate the auto-generation of a shopping list from the provided recipe text without persisting the recipe in the database.
  - Validation: The request payload must include the `recipe_text` field, which is required, non-empty, and limited to 10000 characters.
  - Request Example:
    ```json
    { "recipe_text": "Mix flour, sugar, eggs, and butter to create a cake batter..." }
    ```
  - Successful Response Example:
    ```json
    {
      "id": "temp-uuid",
      "recipe_id": 23,
      "items": [
        { "id": "uuid", "product_name": "Flour", "quantity": 1, "unit": "kg" },
        { "id": "uuid", "product_name": "Sugar", "quantity": 0.5, "unit": "kg" }
      ]
    }
    ```
  - Error Responses:
    - 400 Bad Request:
      ```json
      { "error": "Missing or invalid recipe_text" }
      ```
    - 401 Unauthorized:
      ```json
      { "error": "Authentication required" }
      ```
    - 500 Internal Server Error:
      ```json
      { "error": "Generation failed due to server error" }
      ```

## 3. Authentication and Authorization

- The API uses Supabase's built-in authentication to handle user signup and login, issuing JWT tokens to authenticated users.
- Endpoint access is controlled by Row-Level Security (RLS) policies, ensuring users can only operate on their own data, as managed through the `ShoppingListUsers` join table.
- Middleware verifies JWT tokens and enforces authorization on each request.

## 4. Validation and Business Logic

- **Input Validation**:

  - Email and password must follow proper formats during signup and login.
  - Required fields such as `title`, `recipe_text`, and `name` must be non-empty.
  - `recipe_text` is capped at 10000 characters.
  - Numeric values such as `quantity` are validated.

- **Business Logic**:

  - The auto-generation endpoint utilizes AI to extract ingredients from the recipe text, marking items with a source label (e.g., 'auto-generated').
  - Shopping list items are automatically grouped by pre-defined categories to enhance usability.
  - Deletion endpoints expect client-side confirmation before proceeding with irreversible actions.
  - Input sanitization and consistency checks are performed prior to database interactions.

- **Performance & Security Considerations**:
  - Database indexes on foreign keys optimize join operations.
  - Rate limiting and input sanitization protect against abuse and ensure API stability.
  - Prepared statements and parameter binding mitigate SQL injection risks.
  - Detailed error logging and monitoring features support proactive issue resolution.
