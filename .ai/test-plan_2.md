# Plan Testów dla Projektu Meal2list

**Wersja:** 1.0
**Data:** 2024-07-27
**Autor:** Doświadczony Inżynier QA

## 1. Wprowadzenie i Cele Testowania

### 1.1. Wprowadzenie

Niniejszy dokument opisuje strategię, zakres, zasoby i harmonogram testów dla aplikacji Meal2list. Meal2list to aplikacja webowa zbudowana przy użyciu Angular, Supabase i AI (OpenRouter), której głównym celem jest generowanie list zakupów na podstawie przepisów kulinarnych. Plan ten ma na celu zapewnienie, że aplikacja spełnia wymagania funkcjonalne, jest niezawodna, wydajna i bezpieczna, uwzględniając specyfikę zastosowanego stosu technologicznego i struktury projektu.

### 1.2. Cele Testowania

Główne cele procesu testowania to:

- **Weryfikacja funkcjonalności:** Potwierdzenie, że wszystkie funkcje aplikacji działają zgodnie ze specyfikacją, w tym generowanie list z przepisów, zarządzanie listami, autentykacja użytkowników oraz interakcje z komponentami UI.
- **Zapewnienie jakości:** Identyfikacja, dokumentacja i priorytetyzacja defektów w celu ich skutecznej naprawy przed wdrożeniem na produkcję.
- **Ocena niezawodności:** Sprawdzenie stabilności aplikacji, szczególnie w kontekście integracji z zewnętrznymi usługami (Supabase Auth, DB, Functions; OpenRouter AI) i obsługi błędów.
- **Weryfikacja użyteczności:** Ocena łatwości obsługi interfejsu użytkownika, przepływu pracy i ogólnego doświadczenia użytkownika (UX).
- **Sprawdzenie bezpieczeństwa:** Weryfikacja mechanizmów autentykacji, autoryzacji (w tym polityk Row Level Security w Supabase) i ochrony danych użytkownika.
- **Ocena wydajności:** Zapewnienie akceptowalnego czasu odpowiedzi aplikacji, zwłaszcza podczas operacji wymagających komunikacji z backendem i AI (generowanie list, ładowanie danych).
- **Potwierdzenie zgodności:** Sprawdzenie, czy aplikacja działa poprawnie w docelowych środowiskach, przeglądarkach i czy jest zgodna ze standardami jakości kodu (ESLint, Prettier).

## 2. Zakres Testów

### 2.1. Funkcjonalności objęte testami

- **Moduł Autentykacji:**
  - Proces logowania (poprawne/niepoprawne dane, walidacja formularza).
  - Proces rejestracji (jeśli zostanie zaimplementowany - walidacja, dopasowanie haseł).
  - Proces odzyskiwania hasła (jeśli zostanie zaimplementowany - wysyłanie linku).
  - Proces wylogowywania.
  - Ochrona ścieżek aplikacji za pomocą `authGuard`.
  - Zarządzanie sesją użytkownika (trwałość sesji, odświeżanie).
  - Obsługa błędów autentykacji (np. "Invalid login credentials") i wyświetlanie ich użytkownikowi.
- **Moduł Zarządzania Listami Zakupów (CRUD):**
  - Wyświetlanie listy posiadanych list zakupów (`ShoppingListsPageComponent`).
  - Paginacja/ładowanie list (jeśli dotyczy przy dużej ilości danych).
  - Tworzenie nowej listy zakupów poprzez dialog (`NewShoppingListDialogComponent`, walidacja nazwy).
  - Usuwanie istniejącej listy zakupów (z potwierdzeniem przez `DeleteConfirmDialogComponent`).
  - Wyświetlanie szczegółów wybranej listy zakupów (`ShoppingListDetailComponent`), w tym jej elementów.
  - Nawigacja między widokiem listy a widokiem szczegółów.
  - Wyświetlanie stanu ładowania (np. skeleton loader) podczas pobierania list.
- **Moduł Generowania Listy z Przepisu:**
  - Formularz generowania (`GenerationFormComponent`): walidacja (wymagane pola, długość tekstu przepisu), interakcja (wybór listy, wprowadzanie tekstu).
  - Proces generowania (`GenerationService`): wywołanie funkcji Supabase `openai`, komunikacja z OpenRouter AI.
  - Przetwarzanie odpowiedzi AI: Parsowanie JSON, mapowanie na `ShoppingListItemResponseDto`.
  - Dodawanie wygenerowanych elementów do wybranej listy (`ShoppingListItemsService`, walidacja schematem Zod `batchShoppingListItemsSchema`).
  - Wyświetlanie statusu procesu (`GenerationStatusComponent`): idle, generating, adding, completed, error.
  - Wyświetlanie wygenerowanych elementów po sukcesie.
  - Kompleksowa obsługa błędów: błędy walidacji Zod, błędy API OpenRouter (auth, rate limit, server error), błędy funkcji Supabase, błędy dodawania elementów do bazy, błędy sieciowe.
  - Logowanie błędów generowania w tabeli `generation_error`.
  - Nawigacja do listy po pomyślnym dodaniu elementów.
- **Moduł Kategorii:**
  - Wyświetlanie listy kategorii (`CategoriesComponent`).
  - Poprawność działania preloadingu kategorii (`CategoryService`).
- **Integracja z Supabase:**
  - Poprawność operacji CRUD na wszystkich tabelach bazy danych (profiles, recipes, shopping_lists, shopping_list_items, categories, generation, generation_error).
  - Działanie mechanizmów autentykacji Supabase (signIn, signOut, getSession, onAuthStateChange).
  - Poprawność wywołań i odpowiedzi funkcji Supabase Edge (`openai`, `openrouter-models`) - kontrakt API.
  - Weryfikacja działania polityk RLS (Row Level Security) - zapewnienie, że użytkownicy mają dostęp tylko do swoich danych (listy, elementy list, przepisy).
- **Interfejs Użytkownika (UI) i UX:**
  - Layout aplikacji (`ShellComponent`, `AuthLayoutComponent`) i jego responsywność.
  - Poprawność działania i wygląd komponentów Angular Material.
  - Funkcjonalność i interfejs reużywalnych komponentów (`ButtonComponent`, `InputComponent`, `CardComponent`, `ListComponent`, `CharacterCounterComponent`, etc.).
  - Nawigacja w aplikacji (poprawność `app.routes.ts`, działanie `RouterLink`, `RouterOutlet`).
  - Wyświetlanie komunikatów dla użytkownika (Snackbar, błędy walidacji w formularzach).
  - Działanie strony 404 (`NotFoundComponent`) dla nieistniejących ścieżek.
  - Spójność wizualna i zgodność z motywem Material Design.
- **Jakość Kodu i Procesy:**
  - Działanie narzędzi statycznej analizy kodu (ESLint) i formatowania (Prettier).
  - Poprawne działanie hooków Git (Husky, lint-staged) przy commitowaniu.
  - Konfiguracja i działanie pipeline'u CI/CD (Github Actions) - uruchamianie testów, budowanie aplikacji/obrazu Docker.

### 2.2. Funkcjonalności wyłączone z testów (opcjonalnie)

- Testowanie wewnętrznej logiki i algorytmów modeli AI dostarczanych przez OpenRouter.
- Testowanie niezawodności i skalowalności infrastruktury Supabase oraz DigitalOcean (zakładamy ich poprawność, chyba że testy wykażą inaczej).
- Testowanie strony `KitchenSinkPageComponent` pod kątem logiki biznesowej (służy jedynie jako demonstracja komponentów UI).

## 3. Typy Testów do Przeprowadzenia

- **Testy Jednostkowe (Unit Tests):**
  - **Cel:** Weryfikacja poprawności działania izolowanych fragmentów kodu (komponenty, serwisy, pipes, guards, schematy Zod, funkcje pomocnicze).
  - **Zakres:** Logika wewnętrzna komponentów (metody, interakcje z szablonem), logika biznesowa serwisów (mockowanie zależności, np. `SupabaseClient`, `HttpClient`), walidacja formularzy reaktywnych, działanie guardów (mockowanie serwisów), transformacje danych, walidacja schematów Zod.
  - **Narzędzia:** Jest + Angular Testing Library, `@angular/preset-jest`, biblioteki do mockowania.
  - **Odpowiedzialność:** Deweloperzy.
- **Testy Integracyjne (Integration Tests):**
  - **Cel:** Weryfikacja współpracy między różnymi modułami i warstwami aplikacji (np. komponent <-> serwis <-> Supabase API/Funkcje).
  - **Zakres:** Pełny przepływ danych (np. od formularza do zapisu w bazie), komunikacja frontend-backend (wywołania API Supabase, funkcje Edge), działanie routingu z załadowanymi komponentami i guardami, interakcja z bazą danych (wymaga testowej instancji Supabase).
  - **Narzędzia:** Jest + Testing Library z częściowym mockowaniem (MSW dla mockowania API) lub testową instancją Supabase, dedykowane testy backendowe (jeśli dotyczy funkcji Edge).
  - **Odpowiedzialność:** Deweloperzy, Inżynierowie QA.
- **Testy End-to-End (E2E Tests):**
  - **Cel:** Symulacja interakcji rzeczywistego użytkownika z aplikacją w przeglądarce, weryfikacja kompletnych przepływów biznesowych.
  - **Zakres:** Kluczowe ścieżki użytkownika: rejestracja (jeśli jest) -> logowanie -> tworzenie listy -> generowanie elementów z przepisu -> przeglądanie/edycja listy -> wylogowanie. Scenariusze "happy path" oraz podstawowe scenariusze błędów.
  - **Narzędzia:** Cypress lub Playwright. Wymagają działającej aplikacji i backendu w środowisku testowym.
  - **Odpowiedzialność:** Inżynierowie QA.
- **Testy API (dla Funkcji Supabase Edge):**
  - **Cel:** Bezpośrednie testowanie kontraktu i logiki funkcji Supabase Edge (`openai`, `openrouter-models`) niezależnie od frontendu.
  - **Zakres:** Poprawność odpowiedzi dla różnych danych wejściowych (różne przepisy, konfiguracje), obsługa błędów (np. błędy OpenRouter), autoryzacja (jeśli dotyczy).
  - **Narzędzia:** REST Client (VS Code), Mock Service Worker (MSW), `supabase-js` w skryptach testowych (np. Node.js/Jest), narzędzia do testów kontraktowych (np. Pact - opcjonalnie).
  - **Odpowiedzialność:** Deweloperzy (Backend/Fullstack), Inżynierowie QA.
- **Testy Wydajnościowe:**
  - **Cel:** Ocena czasu odpowiedzi i zużycia zasobów aplikacji pod typowym i szczytowym obciążeniem.
  - **Zakres:** Czas odpowiedzi API Supabase (zapytania DB, funkcje Edge), czas generowania listy przez AI, czas ładowania strony list/szczegółów, wydajność renderowania frontendu.
  - **Narzędzia:** Narzędzia deweloperskie przeglądarki (Lighthouse, Performance), K6, JMeter (dla API/backendu).
  - **Odpowiedzialność:** Inżynierowie QA, Deweloperzy.
- **Testy Bezpieczeństwa:**
  - **Cel:** Identyfikacja i weryfikacja potencjalnych luk bezpieczeństwa.
  - **Zakres:** Weryfikacja implementacji i skuteczności polityk RLS w Supabase, testowanie ochrony ścieżek (`authGuard`), bezpieczeństwo zarządzania tokenami/sesją, walidacja danych wejściowych (frontend i backend), podstawowe skanowanie pod kątem znanych podatności (np. OWASP Top 10).
  - **Narzędzia:** Manualna weryfikacja (np. próby dostępu do nieautoryzowanych zasobów), narzędzia deweloperskie przeglądarki (analiza żądań/odpowiedzi), OWASP ZAP (lub podobne skanery).
  - **Odpowiedzialność:** Inżynierowie QA, (opcjonalnie) Specjaliści ds. Bezpieczeństwa.
- **Testy Użyteczności (Manualne / Eksploracyjne):**
  - **Cel:** Ocena intuicyjności, łatwości obsługi i ogólnej satysfakcji użytkownika.
  - **Zakres:** Nawigacja, zrozumiałość interfejsu i komunikatów, spójność działania, efektywność przepływów pracy, testowanie eksploracyjne w poszukiwaniu nieoczywistych błędów.
  - **Narzędzia:** Eksploracja manualna, scenariusze oparte na personach użytkowników, heurystyki Nielsena.
  - **Odpowiedzialność:** Inżynierowie QA, Projektanci UX/UI.
- **Testy Kompatybilności:**
  - **Cel:** Zapewnienie poprawnego działania i wyglądu aplikacji w różnych środowiskach.
  - **Zakres:** Główne przeglądarki (Chrome, Firefox, Safari, Edge - najnowsze wersje), responsywność na różnych rozmiarach ekranu (desktop, tablet, mobile).
  - **Narzędzia:** Manualne testy na różnych przeglądarkach/urządzeniach, narzędzia typu BrowserStack/SauceLabs (opcjonalnie).
  - **Odpowiedzialność:** Inżynierowie QA.

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

(Poniżej znajdują się przykładowe, wysokopoziomowe scenariusze. Każdy scenariusz powinien być rozwinięty o szczegółowe kroki, dane testowe i precyzyjne oczekiwane rezultaty w dedykowanym narzędziu do zarządzania testami.)

### 4.1. Autentykacja

- **TC-AUTH-001:** Pomyślne logowanie przy użyciu prawidłowych danych uwierzytelniających.
- **TC-AUTH-002:** Nieudane logowanie z powodu błędnego hasła.
- **TC-AUTH-003:** Nieudane logowanie z powodu nieistniejącego adresu email.
- **TC-AUTH-004:** Walidacja formularza logowania (pola wymagane, format email, minimalna długość hasła).
- **TC-AUTH-005:** Pomyślne wylogowanie z aplikacji.
- **TC-AUTH-006:** Przekierowanie niezalogowanego użytkownika próbującego uzyskać dostęp do chronionej strony (`/lists`).
- **TC-AUTH-007:** Zachowanie sesji po odświeżeniu strony (zalogowany użytkownik pozostaje zalogowany).
- **(Opcjonalne) TC-AUTH-008:** Pomyślna rejestracja nowego użytkownika.
- **(Opcjonalne) TC-AUTH-009:** Walidacja formularza rejestracji (pola wymagane, email, min. długość hasła, zgodność haseł).
- **(Opcjonalne) TC-AUTH-010:** Pomyślne zainicjowanie procesu odzyskiwania hasła.

### 4.2. Generowanie Listy z Przepisu

- **TC-GEN-001:** Pomyślne wygenerowanie i dodanie elementów do listy dla poprawnego przepisu.
- **TC-GEN-002:** Walidacja formularza generowania (pole przepisu wymagane, pole listy wymagane, limit znaków przepisu).
- **TC-GEN-003:** Wyświetlanie wskaźnika postępu (`mat-spinner`) podczas generowania i dodawania.
- **TC-GEN-004:** Wyświetlanie wygenerowanych elementów na ekranie po sukcesie.
- **TC-GEN-005:** Poprawne dodanie wygenerowanych elementów do wybranej listy w bazie danych (weryfikacja w szczegółach listy).
- **TC-GEN-006:** Obsługa błędu zwracanego przez funkcję Supabase/OpenRouter (np. błąd 500) - wyświetlenie komunikatu użytkownikowi.
- **TC-GEN-007:** Obsługa błędu rate limit z OpenRouter - wyświetlenie komunikatu użytkownikowi.
- **TC-GEN-008:** Obsługa sytuacji, gdy AI nie jest w stanie wyekstrahować żadnych składników - odpowiedni komunikat.
- **TC-GEN-009:** Obsługa błędu dodawania elementów do bazy danych (np. naruszenie klucza obcego) - wyświetlenie komunikatu.
- **TC-GEN-010:** Weryfikacja logowania błędów generowania w tabeli `generation_error`.
- **TC-GEN-011:** Przekierowanie do szczegółów listy po pomyślnym zakończeniu procesu.

### 4.3. Zarządzanie Listami Zakupów

- **TC-LIST-001:** Poprawne wyświetlenie listy zakupów użytkownika po zalogowaniu.
- **TC-LIST-002:** Wyświetlanie stanu ładowania (skeleton) podczas pobierania list.
- **TC-LIST-003:** Pomyślne utworzenie nowej listy zakupów z poprawną nazwą.
- **TC-LIST-004:** Walidacja formularza tworzenia nowej listy (nazwa wymagana, limit znaków).
- **TC-LIST-005:** Pomyślne usunięcie listy zakupów po potwierdzeniu w dialogu.
- **TC-LIST-006:** Anulowanie operacji usuwania listy w dialogu potwierdzającym.
- **TC-LIST-007:** Poprawne wyświetlenie szczegółów listy zakupów (nazwa, data, elementy z ilościami/jednostkami).
- **TC-LIST-008:** Poprawne wyświetlenie statusu 'checked' dla elementów listy w szczegółach.
- **TC-LIST-009:** Obsługa sytuacji braku list zakupów (wyświetlenie odpowiedniego komunikatu).
- **TC-LIST-010:** Obsługa sytuacji braku elementów na liście w widoku szczegółów.

### 4.4. Integracja z Supabase (RLS)

- **TC-SEC-001:** Użytkownik A widzi tylko listy zakupów, które sam utworzył.
- **TC-SEC-002:** Użytkownik A nie może uzyskać dostępu (np. przez API lub bezpośredni URL) do list zakupów użytkownika B.
- **TC-SEC-003:** Użytkownik A widzi tylko elementy należące do jego list zakupów.
- **TC-SEC-004:** Użytkownik A nie może modyfikować/usuwać list ani elementów należących do użytkownika B.
- **TC-SEC-005:** Weryfikacja dostępu do tabeli `profiles` (użytkownik powinien móc widzieć/modyfikować tylko swój profil).

## 5. Środowisko Testowe

- **Frontend:**
  - **Przeglądarki:** Najnowsze stabilne wersje Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge.
  - **Systemy operacyjne:** Windows 10/11, macOS (najnowsza wersja).
  - **Urządzenia:** Desktop, Symulacja urządzeń mobilnych (tablet, smartfon) w narzędziach deweloperskich przeglądarki.
- **Backend:**
  - **Supabase:** Dedykowana, odizolowana instancja Supabase dla środowiska testowego (może być hostowana lokalnie przez Docker lub jako oddzielny projekt w chmurze Supabase).
  - **Konfiguracja:** Testowa instancja musi mieć ten sam schemat bazy danych co produkcja (zarządzane przez migracje), wdrożone te same funkcje Edge i skonfigurowane odpowiednie polityki RLS.
  - **Klucze API:** Oddzielne, dedykowane klucze API dla środowiska testowego (Supabase URL/anon key, klucz OpenRouter z niskimi limitami).
- **Dane Testowe:**
  - Zestaw predefiniowanych użytkowników testowych z różnymi danymi (np. z listami, bez list).
  - Mechanizm seedowania/resetowania bazy danych testowej przed uruchomieniem zestawu testów (szczególnie E2E i integracyjnych), aby zapewnić powtarzalność.
- **CI/CD:**
  - Środowisko uruchomieniowe Github Actions skonfigurowane z dostępem do testowej instancji Supabase i niezbędnych zmiennych środowiskowych (klucze API).

## 6. Narzędzia do Testowania

- **Testy Jednostkowe/Integracyjne (Frontend):** Jest, Angular Testing Library, `@angular/preset-jest`, MSW (Mock Service Worker).
- **Testy E2E:** Cypress lub Playwright (z preferencją dla Playwright ze względu na szybkość i możliwości).
- **Testy API:** REST Client (VS Code) (do eksploracji i wersjonowania testów API), `supabase-js` w skryptach testowych Node.js (np. z frameworkiem Jest lub Vitest), MSW do mockowania API, K6 (dla testów wydajnościowych API).
- **Zarządzanie Testami/Błędami:** GitHub Projects + Issues z Actions (integracja z workflow deweloperskim).
- **CI/CD:** Github Actions.
- **Mockowanie:** MSW, `jest.fn()` (jeśli używany Jest), `vi.fn()` (jeśli używany Vitest), Sinon.JS, własne implementacje mocków.
- **Testy Kompatybilności:** Narzędzia deweloperskie przeglądarek, BrowserStack/SauceLabs (jeśli budżet pozwala), testy manualne.
- **Testy Bezpieczeństwa:** OWASP ZAP, narzędzia deweloperskie przeglądarki, manualna inspekcja kodu i polityk RLS.
- **Narzędzia Jakości Kodu:** ESLint, Prettier, Husky, lint-staged (ich konfiguracja jest częścią zakresu testów zgodności).

## 7. Harmonogram Testów

(Harmonogram powinien być dostosowany do metodologii projektu, np. Scrum/Kanban, i długości iteracji/sprintów)

- **Na bieżąco (w trakcie sprintu/iteracji):**
  - Deweloperzy: Pisanie i uruchamianie testów jednostkowych i integracyjnych dla nowo tworzonych/modyfikowanych funkcjonalności.
  - QA: Projektowanie scenariuszy testowych dla nowych historyjek użytkownika, testy eksploracyjne zaimplementowanych funkcjonalności.
- **W ramach CI/CD:**
  - Automatyczne uruchamianie testów jednostkowych i integracyjnych przy każdym pushu/pull requeście do głównej gałęzi deweloperskiej.
  - Automatyczne uruchamianie testów E2E (np. nightly build lub po mergu do gałęzi stagingowej).
- **Pod koniec sprintu / Przed releasem:**
  - QA: Wykonanie testów akceptacyjnych dla zakończonych historyjek.
  - QA: Wykonanie testów regresji (automatycznych E2E + kluczowe scenariusze manualne).
  - QA: Testy kompatybilności (manualne lub z użyciem narzędzi).
  - QA/Dev: Sesje testów eksploracyjnych.
- **Okresowo / Na żądanie:**
  - Testy wydajnościowe (np. co kilka sprintów lub przed ważnym wdrożeniem).
  - Testy bezpieczeństwa (szczególnie po zmianach w autentykacji, autoryzacji lub RLS).

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria Wejścia (Gotowość do Testowania)

- Kod źródłowy dla testowanej funkcjonalności/wersji jest dostępny i stabilny (np. na gałęzi deweloperskiej/stagingowej).
- Aplikacja jest pomyślnie zbudowana i wdrożona na środowisku testowym.
- Środowisko testowe (w tym instancja Supabase) jest dostępne, skonfigurowane i stabilne.
- Wymagania funkcjonalne lub historyjki użytkownika są zdefiniowane i zrozumiałe.
- Scenariusze testowe dla danej funkcjonalności/wersji są przygotowane (lub zarysowane dla testów eksploracyjnych).

### 8.2. Kryteria Wyjścia (Zakończenie Testów / Gotowość do Wdrożenia)

- **Pokrycie Testami:** Osiągnięto zdefiniowane cele pokrycia kodu testami jednostkowymi (np. >80% dla kluczowych modułów) i pokrycia wymagań scenariuszami testowymi (np. 100% dla krytycznych wymagań).
- **Wyniki Testów Automatycznych:** 100% testów jednostkowych i integracyjnych przechodzi pomyślnie w ostatnim przebiegu CI. Kluczowe scenariusze E2E przechodzą pomyślnie.
- **Defekty:**
  - Wszystkie defekty o priorytecie Krytycznym (Blocker) i Wysokim (High) zostały naprawione i pomyślnie zweryfikowane przez QA.
  - Brak znanych defektów regresji wprowadzonych w testowanej wersji.
  - Liczba i waga pozostałych otwartych defektów (Średni/Niski priorytet) jest znana i zaakceptowana przez Product Ownera/managera projektu (np. udokumentowane jako znane problemy).
- **Testy Manualne:** Wszystkie zaplanowane manualne scenariusze testowe (akceptacyjne, regresji, kompatybilności, użyteczności) zostały wykonane, a ich wyniki są udokumentowane.
- **Dokumentacja:** Raport podsumowujący wyniki testów jest przygotowany i dostępny dla interesariuszy.
- **Akceptacja:** Formalna zgoda Product Ownera lub innego decydenta na wdrożenie wersji na produkcję na podstawie wyników testów.

## 9. Role i Odpowiedzialności w Procesie Testowania

- **Deweloperzy:**
  - Implementacja kodu zgodnie z wymaganiami i standardami jakości.
  - Pisanie, uruchamianie i utrzymanie testów jednostkowych oraz integracyjnych.
  - Debugowanie i naprawa błędów zgłoszonych przez QA lub wykrytych przez testy automatyczne.
  - Uczestnictwo w procesie code review, w tym ocena testowalności kodu.
  - Współpraca z QA w celu zrozumienia zgłoszonych błędów i scenariuszy testowych.
  - Zapewnienie poprawnej konfiguracji narzędzi jakości kodu (ESLint, Prettier) w projekcie.
- **Inżynierowie QA:**
  - Tworzenie, aktualizacja i egzekucja Planu Testów.
  - Projektowanie, implementacja i utrzymanie scenariuszy testowych (manualnych i automatycznych E2E, API).
  - Konfiguracja i zarządzanie środowiskiem testowym oraz danymi testowymi.
  - Wykonywanie różnych typów testów (funkcjonalnych, regresji, eksploracyjnych, wydajnościowych, bezpieczeństwa, kompatybilności).
  - Identyfikacja, dokładne raportowanie i śledzenie cyklu życia defektów w systemie zarządzania błędami.
  - Weryfikacja poprawności naprawionych błędów.
  - Komunikacja statusu testów, ryzyka i problemów do zespołu i interesariuszy.
  - Ciągłe doskonalenie procesu testowania i strategii automatyzacji.
- **Product Owner / Manager Projektu:**
  - Definiowanie wymagań biznesowych, funkcjonalnych i kryteriów akceptacji.
  - Priorytetyzacja funkcjonalności do implementacji i testowania.
  - Priorytetyzacja naprawy zgłoszonych błędów.
  - Uczestnictwo w procesie akceptacji wyników testów.
  - Podejmowanie ostatecznej decyzji o wdrożeniu aplikacji na produkcję.

## 10. Procedury Raportowania Błędów

- **Narzędzie:** GitHub Issues z Actions i Projects.
- **Cykl życia błędu (przykładowy):** Open -> In Progress -> Review -> Done | Closed (Not a Bug/Won't Fix).
- **Szablon zgłoszenia błędu:**
  - **Tytuł:** Zwięzły i jednoznaczny opis problemu (np. "Błąd logowania przy niepoprawnym haśle w komponencie Login").
  - **Projekt/Komponent:** Moduł lub konkretny komponent aplikacji, którego dotyczy błąd (np. Autentykacja, Generowanie Listy, `ShoppingListsPageComponent`).
  - **Środowisko:** Wersja aplikacji (np. numer buildu, hash commita), przeglądarka + wersja, system operacyjny, środowisko backendu (np. Testowe Supabase).
  - **Kroki do reprodukcji:** Numerowana lista precyzyjnych kroków, które pozwalają jednoznacznie odtworzyć błąd.
  - **Obecny rezultat:** Opis, co faktycznie dzieje się po wykonaniu kroków (np. "Wyświetla się ogólny komunikat 'Wystąpił błąd'").
  - **Oczekiwany rezultat:** Opis, jak aplikacja powinna się zachować zgodnie z wymaganiami (np. "Wyświetla się komunikat błędu 'Nieprawidłowe hasło'").
  - **Priorytet:** Używanie etykiet GitHub: `priority:high`, `priority:medium`, `priority:low`.
  - **Waga/Severity:** Używanie etykiet GitHub: `severity:blocker`, `severity:critical`, `severity:major`, `severity:minor`, `severity:trivial`.
  - **Załączniki:** Zrzuty ekranu (z zaznaczonym problemem), nagrania wideo (GIF/MP4), logi konsoli przeglądarki, logi sieciowe (HAR), relevantne dane testowe.
  - **Zgłaszający:** Automatycznie przypisany przez GitHub.
  - **Przypisany do:** Deweloper odpowiedzialny za naprawę (ustalany podczas triage).
  - **Etykiety/Tagi:** GitHub Labels (np. `bug`, `ui`, `backend`, `regression`, `performance`, `security`).
- **Triage Błędów:** Regularne spotkania zespołu (lub proces asynchroniczny) w celu przeglądu nowo zgłoszonych błędów, potwierdzenia ich zasadności, ustalenia priorytetów/wagi i przypisania do odpowiednich osób/sprintów. Można wykorzystać GitHub Projects do wizualizacji i zarządzania workflow.
- **Automatyzacja:** Wykorzystanie GitHub Actions do automatyzacji procesów, np. dodawanie etykiet na podstawie zawartości zgłoszenia, automatyczne przypisywanie do deweloperów, przypominanie o nieaktywnych zgłoszeniach.
- **Weryfikacja Naprawy:** QA testuje naprawiony błąd na środowisku testowym, używając tych samych kroków co w zgłoszeniu. Jeśli błąd został naprawiony, zgłoszenie jest zamykane z odpowiednim komentarzem. Jeśli nie, zgłoszenie pozostaje otwarte z komentarzem wyjaśniającym.
