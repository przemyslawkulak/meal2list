/\*
Plan wdrożenia endpointu REST API: GET /shopping-lists/{listId}

## 1. Przegląd punktu końcowego

Celem tego endpointu jest pobranie szczegółowych informacji o konkretnej liście zakupów wraz z jej elementami. Endpoint wymaga autoryzacji i walidacji identyfikatora listy.

## 2. Szczegóły żądania

- Metoda HTTP: GET
- Struktura URL: /shopping-lists/{listId}
- Parametry:
  - Wymagane:
    - listId (UUID) – identyfikator listy zakupów
  - Opcjonalne: brak
- Request Body: brak

## 3. Wykorzystywane typy

- DTO odpowiedzi: ShoppingListResponseDto (definiowany w src/types.ts), zawierający:
  - id
  - name
  - items (tablica typu ShoppingListItemResponseDto, zawierająca m.in. product_name, quantity, unit itd.)
  - created_at
- Dodatkowo, błędne odpowiedzi będą zwracane jako JSON zawierający pole 'error'.

## 4. Szczegóły odpowiedzi

- 200 OK:
  Przykładowa odpowiedź:
  {
  "id": "uuid",
  "name": "Weekly Groceries",
  "items": [ { "id": "uuid", "product_name": "Milk", "quantity": 2, "unit": "liters" } ],
  "created_at": "2023-01-01T00:00:00Z"
  }
- 401 Unauthorized:
  { "error": "Authentication required" }
- 404 Not Found:
  { "error": "Shopping list not found" }
- 500 Internal Server Error:
  { "error": "Server error" }

## 5. Przepływ danych

1. Klient wysyła żądanie GET /shopping-lists/{listId} z poprawnym tokenem autoryzacyjnym.
2. Middleware autoryzacyjny weryfikuje token i identyfikuje użytkownika.
3. Serwis (np. ShoppingListService) wykonuje zapytanie do bazy danych korzystając z identyfikatora listId, pobierając rekord z tabeli ShoppingLists oraz powiązane rekordy z tabeli ShoppingListItems.
4. Wyniki są mapowane do struktury ShoppingListResponseDto i zwracane jako odpowiedź.

## 6. Względy bezpieczeństwa

- Uwierzytelnianie: Obowiązkowe użycie tokenu JWT przesyłanego w nagłówku Authorization.
- Autoryzacja: Sprawdzenie, czy lista zakupów należy do zalogowanego użytkownika (RLS, Supabase policies).
- Walidacja danych: Walidacja formatu listId (UUID) przed wykonaniem zapytania.
- Logowanie prób dostępu oraz błędów.

## 7. Obsługa błędów

- 401 Unauthorized: Brak tokenu lub token nieważny.
- 404 Not Found: Lista zakupów o podanym identyfikatorze nie istnieje.
- 500 Internal Server Error: Nieoczekiwany błąd serwera; wszystkie wyjątki powinny być logowane.

## 8. Rozważania dotyczące wydajności

- Optymalizacja zapytań SQL: Użycie indeksów na kolumnach kluczy obcych w tabelach ShoppingLists i ShoppingListItems.
- Możliwość cache'owania wyników przy wysokim obciążeniu.
- Monitorowanie wydajności i analiza czasu odpowiedzi.

## 9. Etapy wdrożenia

1. Utworzenie/aktualizacja serwisu (np. ShoppingListService) z metodą getShoppingListById(listId: string): Observable<ShoppingListResponseDto> wykorzystującej Supabase i RxJS.
2. Dodanie nowego endpointu w kontrolerze (bez użycia tradycyjnego kontrolera dla Supabase, zamiast tego serwis w ramach podejścia funkcjonalnego).
3. Implementacja walidacji parametru listId (sprawdzenie formatu UUID).
4. Integracja z bazą danych: pobranie listy zakupów oraz jej elementów z tabel ShoppingLists i ShoppingListItems.
5. Implementacja mechanizmu obsługi błędów – mapowanie wyjątków na odpowiednie kody statusu (401, 404, 500).
   \*/
