# Przewodnik implementacji usługi: Sharing Shopping Lists

## 1. Opis usługi

Usługa umożliwia użytkownikom współdzielenie swoich list zakupów z innymi osobami, wspierając dwa tryby: tylko do odczytu (view-only) oraz tryb współpracy (collaborative editing). Pozwala to na wspólne planowanie zakupów, edycję oraz śledzenie zmian w czasie rzeczywistym.

## 2. Opis konstruktora

Konstruktor inicjalizuje usługę z wymaganymi zależnościami:

- Klient Supabase (do obsługi bazy danych i autoryzacji)
- Konfiguracja uprawnień (rola właściciela, edytora, obserwatora)

## 3. Publiczne metody i pola

- `createShareLink(listId: string, mode: 'view' | 'edit'): Promise<string>`
  - Tworzy bezpieczny link do współdzielenia listy w wybranym trybie.
- `acceptShareLink(link: string, userId: string): Promise<void>`
  - Pozwala użytkownikowi dołączyć do współdzielonej listy.
- `getSharedLists(userId: string): Observable<ShoppingList[]>`
  - Zwraca listy współdzielone z użytkownikiem.
- `updateList(listId: string, changes: Partial<ShoppingList>, userId: string): Promise<void>`
  - Pozwala na edycję listy przez uprawnionych użytkowników.
- `revokeAccess(listId: string, userId: string): Promise<void>`
  - Usuwa dostęp użytkownika do listy.

## 4. Prywatne metody i pola

- `validateShareLink(link: string): { valid: boolean, mode: 'view' | 'edit', listId: string }`
  - Waliduje i dekoduje link współdzielenia.
- `hasEditPermission(listId: string, userId: string): boolean`
  - Sprawdza, czy użytkownik ma prawo edycji.
- `notifyCollaborators(listId: string, event: string): void`
  - Powiadamia współpracowników o zmianach (np. przez WebSocket lub Supabase Realtime).

## 5. Obsługa błędów

1. Nieprawidłowy lub wygasły link współdzielenia
2. Brak uprawnień do edycji/odczytu
3. Błąd połączenia z bazą danych
4. Przekroczenie limitów liczby współdzielonych list
5. Próba edycji przez użytkownika w trybie tylko do odczytu

Każdy błąd powinien być logowany i zwracany w ustrukturyzowanej formie (np. `{ code, message, details }`).

## 6. Kwestie bezpieczeństwa

- Linki współdzielenia powinny być jednorazowe lub mieć ograniczony czas ważności.
- Uprawnienia muszą być weryfikowane przy każdej operacji (zarówno po stronie backendu, jak i frontend).
- Dane przesyłane przez API muszą być walidowane (np. z użyciem JSON Schema).
- Wszelkie operacje na listach muszą być audytowalne (logi zmian).
- Ochrona przed nadużyciami (rate limiting, limity liczby współdzielonych list na użytkownika).

## 7. Plan wdrożenia krok po kroku

1. **Projekt bazy danych:**
   - Dodaj tabele: `shared_lists`, `shared_list_permissions` (listId, userId, role, expiresAt)
   - Indeksy na listId i userId
2. **Implementacja API w (Supabase):**
   - Endpointy: `/share`, `/accept`, `/revoke`, `/update`, `/list`
   - Autoryzacja JWT/Supabase Auth
   - Walidacja wejścia (JSON Schema)
3. **Frontend (Angular):**
   - Komponenty do generowania i przyjmowania linków współdzielenia
   - Widok list współdzielonych
   - Obsługa trybu tylko do odczytu i edycji (Angular Material, RxJS)
   - Integracja z API (Supabase SDK lub własne serwisy)
4. **Realtime Collaboration:**
   - Subskrypcja zmian na liście (Supabase Realtime lub WebSocket)
   - Notyfikacje o zmianach
5. **Testy:**
   - Jednostkowe (Jest) dla serwisów i komponentów
   - E2E (Playwright) dla scenariuszy współdzielenia
   - Testy bezpieczeństwa (OWASP ZAP)
6. **CI/CD:**
   - Automatyczne testy i linting w pipeline
   - Deployment na DigitalOcean

---

## Szczegółowa lista zadań deweloperskich (TODO)

### 1. Backend (Supabase, Edge Functions, RXJS, Zod)

1. Zaprojektuj schemat bazy danych:
   - Utwórz tabelę `shared_lists` (id, owner_id, created_at, expires_at, ...)
   - Utwórz tabelę `shared_list_permissions` (id, list_id, user_id, role, expires_at)
   - Dodaj indeksy na `list_id`, `user_id` i `expires_at`
   - Zaimplementuj migracje SQL
2. Utwórz Zod schematy do walidacji danych wejściowych/wyjściowych dla każdej operacji API
3. Utwórz serwis `SharedListService` (rozszerzający SupabaseService, RXJS, bez promes!):
   - Metoda `createShareLink$` (generowanie linku, zapis do bazy, obsługa trybu, data ważności)
   - Metoda `acceptShareLink$` (walidacja linku, przypisanie uprawnień użytkownikowi)
   - Metoda `getSharedLists$` (zwraca listy współdzielone z użytkownikiem)
   - Metoda `updateList$` (sprawdzenie uprawnień, aktualizacja listy)
   - Metoda `revokeAccess$` (usuwanie uprawnień użytkownika)
   - Metody pomocnicze: walidacja linku, sprawdzanie uprawnień, logowanie zmian
4. Zaimplementuj Edge Functions (lub API routes) dla endpointów:
   - `/share` (POST)
   - `/accept` (POST)
   - `/revoke` (POST)
   - `/update` (PATCH)
   - `/list` (GET)
   - Każdy endpoint: autoryzacja JWT, walidacja Zod, obsługa błędów, logowanie
5. Zaimplementuj audyt operacji (logi zmian w osobnej tabeli lub Supabase audit)
6. Zaimplementuj limity (rate limiting, liczba współdzielonych list na użytkownika)

### 2. Frontend (Angular 19, Angular Material, RXJS, Signals, SCSS)

1. Utwórz dedykowany moduł Angular Material (importy, theming)
2. Utwórz serwis `SharedListDataService` (komunikacja z backendem, RXJS, Signals)
3. Utwórz komponent do generowania linku współdzielenia:
   - UI: wybór trybu (view/edit), data ważności, generowanie linku
   - Walidacja formularza (Reactive Forms, Angular Material)
   - Obsługa błędów i loading state (RxJS, Signals)
4. Utwórz komponent do przyjmowania linku współdzielenia:
   - UI: wklejenie/kliknięcie linku, obsługa akceptacji
   - Walidacja linku, obsługa błędów
5. Utwórz widok list współdzielonych:
   - Lista z podziałem na role (właściciel, edytor, obserwator)
   - Akcje: edycja, usuwanie, cofnięcie dostępu
   - Responsywność (Angular Material, \_mixins.scss)
6. Zaimplementuj obsługę trybu tylko do odczytu i edycji (blokowanie edycji, informacja dla użytkownika)
7. Zaimplementuj powiadomienia o zmianach (Angular Material Snackbar, Signals)
8. Zapewnij pełną dostępność (ARIA, role, keyboard navigation, Angular Material a11y)
9. Styluj komponenty zgodnie z Material Design 3 i \_mixins.scss

### 3. Realtime Collaboration (Supabase Realtime, WebSocket, RXJS)

1. Zaimplementuj subskrypcję zmian na liście (Supabase Realtime, RXJS)
2. Zaimplementuj powiadomienia o zmianach dla współpracowników (np. snackbar, badge)
3. Zaimplementuj synchronizację edycji w trybie collaborative (optymalizacja konfliktów, debounce, merge)

### 4. Testy (Jest, Playwright, OWASP ZAP)

1. Napisz testy jednostkowe dla serwisów backendowych (Zod, RXJS)
2. Napisz testy jednostkowe dla serwisów i komponentów frontendowych (Signals, RXJS)
3. Napisz testy E2E (Playwright):
   - Generowanie i akceptacja linku współdzielenia
   - Edycja i cofnięcie dostępu
   - Tryb tylko do odczytu
   - Realtime collaboration
4. Przeprowadź testy bezpieczeństwa (OWASP ZAP, walidacja uprawnień, rate limiting)

### 5. CI/CD

1. Dodaj linting i testy jednostkowe do pipeline (Github Actions)
2. Dodaj testy E2E do pipeline
3. Automatyczny deployment na DigitalOcean po przejściu testów
4. Weryfikacja pokrycia kodu (≥80%)

### 6. Dokumentacja i utrzymanie

1. Uzupełnij dokumentację API (schematy, przykłady)
2. Uzupełnij dokumentację komponentów frontendowych
3. Uzupełnij README o instrukcje wdrożenia i testowania
4. Zapewnij aktualizację dokumentacji przy każdej zmianie API lub modelu danych
