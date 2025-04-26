# Architektura UI dla Meal2List

## 1. Przegląd struktury UI

Aplikacja oparta na Angular 19 z standalone lazy-loaded komponentami. Główna nawigacja realizowana przez `MatSidenav` na desktopie i hamburger menu w układzie mobile-first. Komunikacja z API odbywa się w serwisach zwracających `Observable` (Supabase SDK), stan globalny trzymany w Signal Store, a błędy HTTP obsługiwane globalnym interceptorem i wyświetlane przez `MatSnackBar`.

## 2. Lista widoków

- Widok logowania

  - Ścieżka: `/login`
  - Cel: uwierzytelnienie użytkownika
  - Kluczowe informacje: formularz (email, hasło), walidacja, loader, obsługa błędów 400/401, link do rejestracji
  - Komponenty: `MatCard`, `FormGroup`, `MatFormField`, `MatInput`, `MatButton`, `MatProgressSpinner`, `SnackBar`
  - UX/Dostępność/Bezpieczeństwo: autofocus, aria-label, ochrona tras, przekierowanie po 401

- Widok rejestracji

  - Ścieżka: `/register`
  - Cel: utworzenie konta
  - Kluczowe informacje: formularz (email, hasło, potwierdzenie hasła), walidacja, loader, komunikat sukcesu
  - Komponenty i założenia: analogicznie do logowania

- Przegląd list zakupowych

  - Ścieżka: `/lists`
  - Cel: wyświetlenie list użytkownika
  - Kluczowe informacje: nazwa listy, data utworzenia, przycisk "Nowa lista" (modal), akcje (usuń, generacja)
  - Komponenty: `MatList`, `MatListItem`, `MatIconButton`, `MatButton`, `MatDialog` (modal tworzenia, potwierdzenia usunięcia), `SkeletonLoader`
  - UX: skeleton podczas ładowania(ngx-skeleton-loader), puste stany, ARIA roles, responsywność

- Modal tworzenia nowej listy

  - Wywołanie: przycisk "Nowa lista" w widoku `/lists`
  - Cel: utworzenie nowej listy
  - Kluczowe informacje: input (nazwa listy, required), walidacja, przycisk "Utwórz", loader
  - Komponenty: `MatDialog`, `MatFormField`, `MatInput`, `MatButton`
  - UX: autofocus, aria-required, komunikaty validacji

- Generacja listy z przepisu

  - Ścieżka: `/lists/generate`
  - Cel: wprowadzenie przepisu i dodanie wygenerowanych pozycji do wybranej listy
  - Kluczowe informacje: dropdown z istniejącymi listami, textarea (limit 5000 znaków, licznik), przycisk generuj, status generacji (animowany tekst)
  - Komponenty: `MatFormField`, `MatSelect`, `MatInput` (textarea), `MatButton`, `GenerationStatusComponent` z Angular Animations, timeout 60s
  - UX: komunikaty etapów, obsługa timeout/errory, dezaktywacja przycisku podczas generacji

- Szczegóły listy zakupowej

  - Ścieżka: `/lists/:listId`
  - Cel: przegląd, oznaczanie zakupionych i edycja produktów
  - Kluczowe informacje: lista produktów z inline `MatCheckbox`, ilość, jednostka, ikona/badge źródła, przycisk usuń inline
  - Komponenty: `MatList`, `MatCheckbox`, `MatBadge`/`MatIcon`, `MatIconButton`, `ProductDrawerComponent` (edycja w `MatDrawer` z `cdkTrapFocus`)
  - UX: debounce edycji, loader inline, ARIA roles, trap focus, kontrast

- Dodawanie nowego produktu

  - Ścieżka: `/lists/:listId/new-items`
  - Cel: batch-add pozycji do listy
  - Kluczowe informacje: multi-select kategorii, nazwa produktu, ilość (domyślnie 1), jednostka
  - Komponenty: `MatSelect` (multi), `MatFormField`, `MatInput`, `MatButton`
  - UX: filtrowanie, placeholder, aria-label, trap focus w drawerze/modalu

- Potwierdzenie usunięcia listy/produktu
  - Dialog standaryzowany
  - Komponenty: `MatDialog`, `MatButton`, aria-describedby

## 3. Mapa podróży użytkownika

1. Użytkownik trafia na `/login` (lub `/register`), uwierzytelnia się.
2. Po zalogowaniu redirect do `/lists` – widok przeglądu list.
3. Kliknięcie "Nowa lista" w widoku `/lists` otwiera modal z inputem na nazwę (required). Po utworzeniu modal zamyka się i lista odświeża.
4. W menu (sidebar/toolbar) dostępne akcje: przegląd list zakupowych `/lists`, generacja `/lists/generate`.
5. Generacja: użytkownik wybiera listę z dropdown i wkleja przepis, klika "Generuj", widzi animowany status, po sukcesie przekierowanie do `/lists/:listId`.
6. Na `/lists/:listId` użytkownik:
   - Przegląda pozycje, zaznacza checkbox, edytuje (`ProductDrawer`), usuwa inline.
   - Dodaje nowy produkt przez `/lists/:listId/new-items`.
   - Usuwa całą listę z potwierdzeniem – redirect do `/lists`.

## 4. Układ i struktura nawigacji

- `ShellComponent` ze `MatSidenav` i `MatToolbar`:
  - Desktop: stały `MatSidenav` z linkami (Listy zakupowe, Generacja listy).
  - Mobile/tablet: hamburger w `MatToolbar`, otwiera `MatSidenav` w over mode.
- Router-outlet wewnątrz `ShellComponent`.
- AuthGuard zabezpiecza trasy `/lists/**`.
- Serwis `CategoryService` preloaduje i cache'uje kategorie przez `shareReplay`.

## 5. Kluczowe komponenty

- `ShellComponent`: globalny layout i nawigacja.
- `AuthGuard`: ochrona tras.
- `ErrorInterceptor` + `SnackBarService`: globalna obsługa błędów i komunikaty.
- `GenerationStatusComponent`: animowany tekst statusu z etapami generacji.
- `ProductDrawerComponent`: edycja produktu w `MatDrawer` z `cdkTrapFocus`.
- `SkeletonLoaderComponent`: widoki ładowania - użyj biblioteki ngx-skeleton-loader.
- `CategoryService`: preload i cache kategorii.
- Reactive Forms + Angular Material Form Components.
- `MatDialog`: potwierdzenia usunięcia.
