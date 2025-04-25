# API Endpoint Implementation Plan: GET /categories

## 1. Przegląd punktu końcowego

Endpoint GET /categories umożliwia pobranie listy dostępnych kategorii produktów w systemie. Celem jest dostarczenie klientowi kompletnej listy kategorii, które mogą być wykorzystywane przy tworzeniu list zakupów lub kategoryzacji treści.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** /categories
- **Parametry:**
  - Wymagane: brak
  - Opcjonalne: brak
- **Request Body:** brak

## 3. Wykorzystywane typy

- **DTO:** `CategoryDto` (zdefiniowany w `src/types.ts`) z polami:
  - `id`: string (UUID)
  - `name`: string
- **Command Model:** brak

## 4. Szczegóły odpowiedzi

- **Status 200:** Zwraca poprawną listę kategorii w formacie JSON, np.:
  ```json
  [
    { "id": "uuid", "name": "Dairy" },
    { "id": "uuid", "name": "Vegetables" },
    { "id": "uuid", "name": "Fruits" },
    { "id": "uuid", "name": "Bread" }
  ]
  ```
- **Status 500:** Błąd serwera, przykładowa odpowiedź:
  ```json
  { "error": "Server error" }
  ```

## 5. Przepływ danych

1. Klient wysyła żądanie GET do `/categories`.
2. Kontroler przekazuje żądanie do serwisu `CategoryService`.
3. `CategoryService` wykonuje zapytanie do bazy danych Supabase, pobierając dane z tabeli `categories`.
4. Wyniki są mapowane na `CategoryDto` i zwracane jako odpowiedź JSON.
5. W przypadku wystąpienia błędu, kontroler obsługuje wyjątek i zwraca odpowiedni kod błędu (500).

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie i Autoryzacja:** Endpoint może być publiczny, gdyż kategorie zwykle są dostępne dla wszystkich. Jeżeli wymagane, należy zabezpieczyć endpoint mechanizmami uwierzytelniania.
- **Row-Level Security (RLS):** Konfiguracja RLS w Supabase, jeśli dotyczy, by uniemożliwić nieautoryzowany dostęp do danych.
- **Walidacja:** Ze względu na brak danych wejściowych, walidacja polega głównie na poprawnym mapowaniu danych wyjściowych z bazy.

## 7. Obsługa błędów

- **Błąd połączenia lub zapytania do bazy:** Zwracany jest kod 500 z komunikatem `{ "error": "Server error" }`.
- **Logowanie Błędów:** Błędy powinny być logowane przy użyciu centralnego systemu logowania (np. Winston, Bunyan) w celu późniejszej analizy.
- **Fallback:** W przypadku braku danych, zwracana jest pusta tablica lub dedykowany komunikat.

## 8. Rozważania dotyczące wydajności

- **Cache:** Kategorie rzadko się zmieniają, więc warto rozważyć cachowanie wyników na poziomie serwisu lub przez mechanizmy zewnętrzne (np. CDN).
- **Optymalizacja zapytań:** Upewnienie się, że tabela `categories` posiada odpowiednie indeksy.
- **Monitorowanie:** Implementacja mechanizmów monitorowania czasu odpowiedzi oraz logowania opóźnień.

## 9. Etapy wdrożenia

1. Utworzenie lub rozszerzenie serwisu `CategoryService` w warstwie backendowej do pobierania danych z tabeli `categories`.
2. Implementacja metody pobierania `/categories`, w `CategoryService`.
3. Implementacja mechanizmu logowania błędów.
