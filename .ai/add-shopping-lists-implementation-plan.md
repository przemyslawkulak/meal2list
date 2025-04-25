# API Endpoint Implementation Plan: POST /shopping-lists

## 1. Przegląd punktu końcowego

Endpoint służy do tworzenia nowej listy zakupów – może być utworzona ręcznie lub na podstawie istniejącego przepisu. Użytkownik musi być uwierzytelniony, a operacja uwzględnia walidację danych wejściowych oraz bezpieczne wstawienie rekordu do tabeli `shopping_lists` w bazie danych przy użyciu Supabase Client wraz z obsługą RxJS.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** /shopping-lists
- **Parametry:**
  - **Wymagane:**
    - `name` (string) – nazwa listy zakupów
  - **Opcjonalne:**
    - `recipe_id` (UUID) – identyfikator przepisu, na podstawie którego generowana jest lista
- **Request Body Example:**
  ```json
  { "name": "Weekly Groceries", "recipe_id": "uuid" }
  ```

## 3. Wykorzystywane typy

- **DTO Wejściowe:** `CreateShoppingListCommand` (definiuje: `name: string` oraz opcjonalnie `recipe_id?: string`)
- **DTO Wyjściowe:** `ShoppingListResponseDto` (zawiera: `id`, `name`, `recipe_id`, `created_at`, `updated_at`)

## 4. Szczegóły odpowiedzi

- **Statusy:**
  - `201 Created` – Lista zakupów została pomyślnie utworzona
  - `400 Bad Request` – Błędne lub niekompletne dane wejściowe (np. brak pola `name`)
  - `401 Unauthorized` – Brak autoryzacji
  - `500 Internal Server Error` – Błąd serwera
- **Przykładowa Odpowiedź:**
  ```json
  {
    "id": "uuid",
    "name": "Weekly Groceries",
    "recipe_id": "uuid",
    "created_at": "2023-01-01T00:00:00Z"
  }
  ```

## 5. Przepływ danych

1. **Przyjęcie Żądania:** Klient wysyła żądanie POST do `/shopping-lists` z odpowiednim JSON payload.
2. **Autoryzacja:** Middleware weryfikuje token uwierzytelniający; w przypadku błędu zwracany jest status `401 Unauthorized`.
3. **Walidacja Danych:** Kontroler sprawdza, czy pole `name` jest obecne i zgodne z wymaganiami, a opcjonalne `recipe_id` posiada poprawny format UUID.
4. **Wywołanie Serwisu:** Po pomyślnej walidacji, kontroler przekazuje dane do `ShoppingListService`, który korzysta z Supabase Client (integracja z RxJS) do wstawienia rekordu do bazy.
5. **Zapis do Bazy:** Serwis wykonuje operację `insert` na tabeli `shopping_lists`. Po otrzymaniu wyniku, mapuje odpowiedź, weryfikuje wystąpienie ewentualnych błędów i zwraca rekord.
6. **Odesłanie Odpowiedzi:** Kontroler zwraca wynik z kodem `201 Created` wraz z utworzonym rekordem.

## 6. Względy bezpieczeństwa

- **Autoryzacja:** Wszystkie żądania muszą posiadać ważny token uwierzytelniający, sprawdzany przez odpowiedni middleware.
- **Walidacja Wejścia:** Pole `name` jest obowiązkowe i nie może być puste; `recipe_id` (jeśli podane) musi być w formacie UUID.
- **Ochrona przed SQL Injection:** Użycie metod Supabase Client zapewnia parametryzowane zapytania, minimalizując ryzyko SQL injection.
- **Logowanie Błędów:** Wszelkie błędy operacji na bazie danych powinny być logowane (np. do centralnego systemu monitorowania) przy jednoczesnym zwróceniem ogólnego komunikatu błędu do klienta.

## 7. Obsługa błędów

- **400 Bad Request:** Zwracany, gdy pole `name` jest puste lub dane wejściowe są niezgodne z oczekiwanym formatem.
- **401 Unauthorized:** Gdy brak ważnego tokena uwierzytelniającego.
- **500 Internal Server Error:** Przy nieoczekiwanych błędach podczas operacji na bazie danych; szczegóły błędu są logowane, a klient otrzymuje ogólny komunikat o błędzie.

## 8. Rozważania dotyczące wydajności

- **Indeksowanie:** Kluczowe kolumny (np. `recipe_id`) mają indeksy, co przyspiesza operacje związane z wyszukiwaniem i zachowaniem integralności referencyjnej.
- **Asynchroniczność:** Operacje są wykonywane asynchronicznie za pomocą RxJS, co umożliwia nieblokujące operacje w systemie.
- **Optymalizacja:** Minimalizacja czasu operacji insert za pomocą bezpośrednich wywołań Supabase oraz efektywna walidacja danych przed ich przetworzeniem.

## 9. Etapy wdrożenia

1. **Definicja DTO:** Upewnienie się, że w pliku `src/types.ts` istnieją definicje `CreateShoppingListCommand` oraz `ShoppingListResponseDto`.
2. **Implementacja Serwisu:** Dodanie metody `createShoppingList` w `ShoppingListService`, która wykorzystuje Supabase Client w połączeniu z RxJS do wstawienia nowej listy zakupów.
3. **Implementacja Kontrolera:** Utworzenie endpointu POST `/shopping-lists` z walidacją danych wejściowych i wywoływaniem metody serwisu.
