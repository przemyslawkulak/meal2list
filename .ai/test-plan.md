# Plan testów projektu Meal2List

## 1. Wprowadzenie i cele testowania

Celem testowania jest zapewnienie jakości, stabilności i bezpieczeństwa aplikacji Meal2List opartej na Angular 19 i Supabase. Testy mają zweryfikować poprawność działania kluczowych funkcjonalności, wydajność pod obciążeniem oraz spełnienie wymagań dostępności i bezpieczeństwa.

## 2. Zakres testów

- Frontend (Angular 19 + Angular Material): komponenty UI, routing, formularze, walidacja, dostępność.
- Warstwa usługowa (Supabase SDK): uwierzytelnianie, operacje CRUD, zabezpieczenia ACL.
- Integracja AI (Openrouter.ai Edge Functions): wysyłanie zapytań, obsługa odpowiedzi, limity API.
- CI/CD (GitHub Actions) i wdrożenie (DigitalOcean): pipeline, build, deploy.
- Narzędzia i procesy jakości: ESLint, Prettier, Husky, lint-staged.

## 3. Typy testów do przeprowadzenia

- **Testy jednostkowe**: usługi Angular, komponenty bez DOM, RxJS.
- **Testy integracyjne**: komunikacja komponent–serwis, serwis–Supabase.
- **Testy end-to-end (E2E)**: pełne scenariusze użytkownika w przeglądarce (Playwright).
- **Testy wydajnościowe**: Lighthouse, JMeter dla endpointów Supabase.
- **Testy bezpieczeństwa**: skan OWASP ZAP, analiza ACL, testy uwierzytelniania.
- **Testy dostępności (a11y)**: audyt Angular Material pod kątem WCAG.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

1. **Rejestracja i logowanie**
   - Krok 1: Użytkownik wprowadza poprawne dane → oczekiwane przekierowanie do listy.
   - Krok 2: Błędne hasło/email → komunikat o błędzie.
2. **Lista posiłków**
   - Załadowanie listy po uwierzytelnieniu.
   - Filtrowanie i wyszukiwanie.
3. **Szczegóły posiłku**
   - Otworzenie szczegółów → wyświetlenie informacji.
   - Obsługa błędu 404.
4. **Profil użytkownika**
   - Edycja danych profilu → zapisywanie i potwierdzenie.
   - Usuwanie konta.
5. **Integracja AI**
   - Wysłanie zapytania do Edge Function → poprawna odpowiedź.
   - Przekroczenie limitu → obsługa błędu.
6. **CI/CD**
   - Pipeline uruchamia testy i lintowanie.

## 5. Środowisko testowe

- **Local / Test**: Angular CLI 19, Node.js 20.x, Chrome/Firefox/Edge.
- **Supabase**: osobna instancja testowa z odizolowaną bazą danych.
- **CI**: GitHub Actions runner (Linux), konfiguracja z env var TEST_SUPABASE_URL/KEY.

## 6. Narzędzia do testowania

- **Angular Unit**: Jest.
- **E2E**: Playwright.
- **API**: Postman + Newman.
- **Wydajność**: Lighthouse CI, JMeter.
- **Bezpieczeństwo**: OWASP ZAP.
- **Dostępność**: axe-core, Angular Material a11y.
- **Statyczna analiza**: ESLint, Prettier.

## 7. Harmonogram testów

| Faza                              | Czas trwania           | Zakres                                |
| --------------------------------- | ---------------------- | ------------------------------------- |
| Przygotowanie środowiska          | 1 tydzień              | Konfiguracja CI, baza testowa         |
| Testy jednostkowe                 | Cały cykl Sprintu      | Każdy commit, minimalnie 80% coverage |
| Testy integracyjne                | Po każdej iteracji     | Usługi backend, supabase, RxJS        |
| Testy E2E                         | Po zakończeniu sprintu | Scenariusze użytkownika               |
| Testy wydajności i bezpieczeństwa | Przed release          | Punkty krytyczne aplikacji            |

## 8. Kryteria akceptacji testów

- Pokrycie kodu testami jednostkowymi ≥ 80%.
- Brak blokujących błędów krytycznych.
- Wszystkie scenariusze E2E przechodzą z wynikiem pozytywnym.
- Raporty wydajności mieszczą się w założonych limitach.
- Brak krytycznych ostrzeżeń bezpieczeństwa.

## 9. Role i odpowiedzialności

- **Inżynier QA**: definiowanie scenariuszy, prowadzenie testów, raportowanie.
- **Developer**: pisanie testów jednostkowych, naprawa błędów.
- **Tech Lead / Architekt**: przegląd wyników testowych, decyzje dot. kryteriów.
- **Product Owner**: akceptacja wyników testów, priorytetyzacja poprawek.

## 10. Procedury raportowania błędów

1. Zgłoszenie w systemie JIRA: tytuł, opis, kroki odtworzenia, środowisko.
2. Kategoryzacja: Severity (P0–P4), Priority.
3. Dołączenie logów, zrzutów ekranu i plików HAR w przypadku E2E.
4. Triage co drugi dzień przez Tech Leada i QA Lead.
5. Śledzenie statusu do zamknięcia i weryfikacja poprawek.
