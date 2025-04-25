# API Endpoint Implementation Plan: POST /shopping-lists/{listId}/items

## 1. Przegląd punktu końcowego

This endpoint allows adding new items to a specific shopping list. It performs input validation, enforces authentication and authorization, and performs a batch insert of records into the `shopping_list_items` table using the Supabase SDK with rxjs.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** /shopping-lists/{listId}/items
- **Parametry:**
  - **Path Parameter:**
    - `listId`: UUID of the shopping list (must be a valid UUID).
  - **Request Body (JSON):** An array of item objects where each object must include:
    - **Wymagane (dla każdego elementu):**
      - `product_name` (string)
      - `quantity` (number)
      - `category_id` (UUID)
      - `source` (string with allowed values: "auto", "manual", "modified")
    - **Opcjonalne (dla każdego elementu):**
      - `unit` (string)
- **Przykład żądania:**
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
      "quantity": 2,
      "source": "manual",
      "category_id": "uuid"
    }
  ]
  ```

## 3. Wykorzystywane typy

- **DTO/Command Models:**
  - `CreateBatchShoppingListItemsCommand` – reprezentuje tablicę obiektów `CreateShoppingListItemCommand` (każdy definiuje strukturę pojedynczego elementu).
- **Response DTO:**
  - `ShoppingListItemResponseDto` – definiuje strukturę zwracanego elementu; na odpowiedzi zwracana jest tablica dodanych elementów.

## 4. Szczegóły odpowiedzi

- **Sukces:**
  - **Status:** 201 Created
  - **Response Body:** (Array of created items)
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
        "quantity": 2,
        "unit": null,
        "source": "manual",
        "category_id": "uuid",
        "created_at": "2023-01-01T00:00:00Z"
      }
    ]
    ```
- **Błędy:**
  - **400 Bad Request:** When required fields are missing or input validation fails.
    ```json
    { "error": "Missing required fields: product_name, quantity, and category_id" }
    ```
  - **401 Unauthorized:** For unauthenticated access.
    ```json
    { "error": "Authentication required" }
    ```
  - **500 Internal Server Error:** For server-side or database errors.
    ```json
    { "error": "Server error" }
    ```

## 5. Przepływ danych

1. Customer sends a POST request with the `listId` in the URL and a JSON array containing multiple item objects in the body.
2. Backend:
   - Verifies user authentication.
   - Extracts and validates the `listId` from the URL.
   - Validates the request body against the schema defined by `CreateBatchShoppingListItemsCommand` (using a validation library like Zod).
   - Calls the service method `addItemsToShoppingList(listId: string, items: CreateBatchShoppingListItemsCommand)`:
     - Checks that the user has permission to modify the specific shopping list.
     - Performs a batch INSERT into the `shopping_list_items` table using the Supabase SDK along with rxjs operators (e.g., `from`, `map`).
3. Upon success, returns an array of the created records with HTTP status 201.

## 6. Względy bezpieczeństwa

- **Autoryzacja:** Ensure that the authenticated user has permission to modify the specified shopping list (using RLS and database access policies).
- **Walidacja danych:** Rigorously validate all inputs to prevent SQL injection and other security threats.
- **Uwierzytelnianie:** Use Supabase Auth and middleware for session verification.
- **RLS Policies:** Apply database level RLS to further protect user data.

## 7. Obsługa błędów

- **400 Bad Request:** When required fields are missing or validation fails for one or more items in the array.
- **401 Unauthorized:** When the request is made by an unauthenticated user.
- **500 Internal Server Error:** For server-side issues or database errors.
- **Error Logging:** Log errors using a centralized logging mechanism or by recording entries in a dedicated table for recurring issues.

## 8. Rozważania dotyczące wydajności

- **Indeksy:** Ensure that columns such as `shopping_list_id` and `category_id` are indexed to optimize INSERT operations and queries.
- **Skalowalność:** The batch insert operation is lightweight; consider connection pooling and batch processing strategies for high-concurrency scenarios.
- **Asynchroniczność:** Leverage rxjs for efficient asynchronous operations, ensuring non-blocking execution.

## 9. Etapy wdrożenia

1. **Routing:** Confirm that the existing route (POST `/shopping-lists/{listId}/items`) accepts an array of items without creating a new endpoint.
2. **Walidacja danych:** Implement input validation (using Zod or similar) to ensure each item in the array contains the required fields: `product_name`, `quantity`, `category_id`, and `source`.
3. **Logika serwisowa:** Update or create the method `addItemsToShoppingList(listId: string, items: CreateBatchShoppingListItemsCommand)`:
   - Verify user authorization.
   - Use Supabase SDK and rxjs to perform a batch INSERT operation.
4. **Integracja z bazą danych:** Ensure that the Supabase connection and the `shopping_list_items` table are correctly configured, with default values (e.g., `is_checked` set to false) properly set up.
5. **Obsługa błędów:** Implement error handling that returns proper HTTP status codes (400, 401, 500) along with error messages, and log errors appropriately.
