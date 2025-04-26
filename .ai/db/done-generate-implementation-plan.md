/\*
API Endpoint Implementation Plan: POST /generate-shopping-list

## 1. Przegląd punktu końcowego

Cel: Endpoint generacji listy zakupów na podstawie przekazanego tekstu przepisu, bez zapisywania przepisu w bazie danych. Przetwarza dane wejściowe, waliduje i wywołuje serwis generujący automatyczną listę zakupów przy użyciu logiki (np. AI) lub dedykowanego algorytmu.

## 2. Szczegóły żądania

- Metoda HTTP: POST
- Struktura URL: /generate-shopping-list
- Parametry:
  - Wymagane:
    - recipe_text (string, niepusty, max 5000 znaków)
  - Opcjonalne: brak
- Przykładowe ciało żądania:
  ```json
  { "recipe_text": "Mix flour, sugar, eggs, and butter to create a cake batter..." }
  ```

## 3. Wykorzystywane typy

- DTO/Command Model:
  - GenerateShoppingListFromRecipeCommand (właściwość: recipe_text: string)
- Typ odpowiedzi (np. GeneratedListResponseDto):
  - id (string, tymczasowy identyfikator np. "temp-uuid")
  - recipe_id (string lub number, unikalny identyfikator wygenerowanego przepisu)
  - items (tablica obiektów, każdy według struktury ShoppingListItemResponseDto zawierającej: id, product_name, quantity, unit)

## 4. Szczegóły odpowiedzi

- Sukces (200 OK lub 201 Created):
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
- Błędy:
  - 400 Bad Request: Gdy recipe_text jest brakujący lub nie spełnia kryteriów walidacji
  - 401 Unauthorized: Gdy żądanie nie zawiera ważnego tokena autoryzacji
  - 500 Internal Server Error: W przypadku błędów systemowych lub nieudanej generacji (opcjonalnie logowanych w tabeli Generation_Error)

## 5. Przepływ danych

1. Klient wysyła żądanie POST z JSON zawierającym recipe_text.
2. Middleware autoryzacji (Supabase Auth) weryfikuje token dostępu.
3. Walidacja danych wejściowych przy użyciu Zod: sprawdzenie, czy recipe_text jest obecny, niepusty i nie przekracza 5000 znaków.
4. Wywołanie serwisu (`GenerationService`):
   - Przetwarzanie recipe_text
   - Interakcja z zewnętrzną usługą (np. AI) lub użycie dedykowanego algorytmu do generacji listy
5. Formatowanie wyniku w strukturę odpowiedzi zgodną z typami DTO.
6. W przypadku błędu, zapis do systemu logowania lub tabeli Generation_Error oraz zwrócenie odpowiedniego statusu błędu.

## 6. Względy bezpieczeństwa

- Autoryzacja: Endpoint chroniony za pomocą Supabase Auth.
- Walidacja: Użycie Zod gwarantuje, że tylko poprawne dane wejściowe są przetwarzane.
- Ograniczenie rozmiaru wejścia: Maksymalnie 5000 znaków dla recipe_text, co zapobiega nadużyciom.
- Logowanie błędów: Wszelkie błędy krytyczne są logowane (opcjonalnie do tabeli Generation_Error) oraz monitorowane.

## 7. Obsługa błędów

- 400 Bad Request: Błąd walidacji wejścia (brak lub nieprawidłowy recipe_text).
- 401 Unauthorized: Błąd autoryzacji, brak lub nieważny token.
- 500 Internal Server Error: Błąd podczas generacji listy lub problem systemowy. Użycie wczesnych returnów w kodzie ułatwia obsługę błędów i czytelność logiki.

## 8. Rozważania dotyczące wydajności

- Użycie RxJS do obsługi asynchronicznych operacji pozwala lepiej zarządzać opóźnieniami w wywołaniach zewnętrznych (np. AI).
- Rozważenie mechanizmów buforowania lub kolejkowania, jeśli generacja jest zasobożerna.
- Monitorowanie wykorzystania zasobów w celu identyfikacji potencjalnych wąskich gardeł.

## 9. Etapy wdrożenia

1. Utworzenie nowego endpointu POST /generate-shopping-list w warstwie backendowej ( w dedykowanym serwisie).
2. Opracowanie schematu walidacji wejścia przy użyciu Zod.
3. Implementacja `GenerationService`, która:
   - Przetwarza dane wejściowe
   - Integruje się z zewnętrzną usługą AI lub używa własnego algorytmu generacji
   - Formatuje wynik zgodnie z wymaganym typem odpowiedzi
4. Implementacja logiki obsługi błędów oraz ewentualnego zapisu błędów do tabeli Generation_Error.
5. Opracowanie testów jednostkowych i integracyjnych obejmujących:
   - Testy walidacji wejścia
   - Testy autoryzacji
   - Testy poprawności generacji
     \*/
