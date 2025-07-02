# Analiza Designu Aplikacji

## Wprowadzenie

Ten dokument zawiera szczegółową analizę każdego widoku i komponentu w aplikacji. Celem jest zidentyfikowanie kluczowych elementów, ocena obecnego stanu interfejsu użytkownika oraz sformułowanie rekomendacji, które posłużą jako podstawa do stworzenia spójnego i intuicyjnego designu.

---

## 1. Widoki Główne i Układ (Layout)

### 1.1. `layout/shell` - Główna Powłoka Aplikacji

- **Opis:** Główny kontener aplikacji, który zarządza nawigacją i wyświetlaniem treści. Obejmuje boczny panel nawigacyjny (sidenav) oraz obszar na główną zawartość.
- **Kluczowe elementy:**
  - **Sidenav:** Boczny panel z linkami do głównych sekcji aplikacji.
  - **Toolbar:** Górny pasek z tytułem strony i przyciskiem do przełączania sidenava na urządzeniach mobilnych.
  - **`router-outlet`:** Kontener na dynamicznie ładowane widoki.
- **Na co zwrócić uwagę:**
  - **Spójność nawigacji:** Upewnić się, że linki w sidenavie są zawsze aktualne i odpowiadają strukturze aplikacji.
  - **Responsywność:** Przetestować działanie layoutu na różnych rozdzielczościach, zwłaszcza zachowanie sidenava (tryb `over` na mobile, `side` na desktopie).
  - **Dostępność:** Zapewnić, że nawigacja jest w pełni dostępna z klawiatury.

### 1.2. `layout/auth-layout` - Układ dla Stron Autoryzacji

- **Opis:** Uproszczony layout używany dla stron logowania, rejestracji i odzyskiwania hasła. Zazwyczaj jest wyśrodkowany i nie zawiera bocznej nawigacji.
- **Kluczowe elementy:**
  - Karta lub kontener na formularz.
  - Logo aplikacji.
- **Na co zwrócić uwagę:**
  - **Minimalizm:** Layout powinien być maksymalnie uproszczony, aby użytkownik mógł skupić się na zadaniu (logowanie, rejestracja).
  - **Branding:** Logo i kolorystyka powinny być spójne z resztą aplikacji.

---

## 2. Autoryzacja (`features/auth`)

### 2.1. `login`, `register`, `recover`, `reset-password` - Formularze

- **Opis:** Standardowe formularze do zarządzania kontem użytkownika.
- **Kluczowe elementy:**
  - Pola `input` na email, hasło, etc.
  - Przyciski `submit` ("Zaloguj się", "Zarejestruj").
  - Linki do alternatywnych akcji ("Nie pamiętasz hasła?", "Masz już konto?").
  - Walidacja i komunikaty o błędach.
- **Na co zwrócić uwagę:**
  - **Przejrzystość:** Etykiety pól muszą być jednoznaczne.
  - **Feedback:** Użytkownik musi otrzymywać natychmiastową informację zwrotną (np. błędy walidacji, status ładowania).
  - **Bezpieczeństwo:** Pola haseł powinny być maskowane z opcją ich podejrzenia.
  - **Spójność:** Wszystkie formularze autoryzacji powinny mieć identyczną stylistykę.

---

## 3. Strona Główna (`features/landing`)

- **Opis:** Pierwsza strona, którą widzi użytkownik po wejściu na stronę (jeśli nie jest zalogowany). Ma na celu przedstawienie aplikacji i zachęcenie do rejestracji.
- **Kluczowe elementy:**
  - **Nagłówek (Hero section):** Z chwytliwym hasłem i przyciskiem CTA (Call To Action), np. "Zacznij teraz".
  - **Sekcje opisujące funkcje:** Bloki z ikonami i krótkimi tekstami wyjaśniającymi, co aplikacja oferuje.
  - **Sekcja z opiniami (Social Proof):** Jeśli dotyczy.
  - **Stopka:** Z linkami do mediów społecznościowych, polityki prywatności etc.
- **Na co zwrócić uwagę:**
  - **Pierwsze wrażenie:** Strona musi być estetyczna i profesjonalna.
  - **Przejrzysty przekaz:** Użytkownik powinien w kilka sekund zrozumieć, do czego służy aplikacja.
  - **CTA:** Przyciski akcji muszą być dobrze widoczne i zachęcające.

---

## 4. Listy Zakupów (`features/shopping-lists`)

### 4.1. `shopping-lists-page` - Widok Główny List

- **Opis:** Strona wyświetlająca wszystkie listy zakupów użytkownika.
- **Kluczowe elementy:**
  - **Przycisk "Dodaj nową listę"**: Zazwyczaj FAB (Floating Action Button) lub wyraźny przycisk w nagłówku.
  - **`shopping-list-card`**: Karty reprezentujące poszczególne listy. Każda karta powinna zawierać nazwę listy, datę utworzenia/modyfikacji i ewentualnie podsumowanie (np. liczba produktów).
  - **Komunikat o braku list**: Informacja dla nowych użytkowników.
- **Na co zwrócić uwagę:**
  - **Czytelność:** Karty muszą być przejrzyste.
  - **Akcje:** Każda karta powinna mieć łatwo dostępne akcje (np. edytuj, usuń, przejdź do szczegółów).

### 4.2. `detail` - Szczegóły Listy

- **Opis:** Widok pojedynczej listy zakupów z jej zawartością.
- **Kluczowe elementy:**
  - **Nagłówek:** Z nazwą listy.
  - **Przycisk "Dodaj produkt"**: Do otwierania dialogu dodawania produktu.
  - **Lista produktów (`shopping-list-item`):** Każdy element listy z nazwą produktu, ilością, jednostką.
  - **Akcje na produkcie:** Checkbox do oznaczania jako "kupione", przyciski edycji/usunięcia.
- **Na co zwrócić uwagę:**
  - **Interaktywność:** Oznaczanie produktów jako kupionych powinno być płynne i dawać wizualny feedback (np. przekreślenie).
  - **Sortowanie/Filtrowanie:** Warto rozważyć opcje sortowania produktów (np. alfabetycznie, po kategorii).

### 4.3. Dialogi (`add-item-dialog`, `edit-item-dialog`, `create-list-dialog`)

- **Opis:** Pop-upy służące do tworzenia i edycji list oraz ich elementów.
- **Kluczowe elementy:**
  - Formularze z polami `input`.
  - Przyciski "Zapisz" / "Anuluj".
- **Na co zwrócić uwagę:**
  - **Fokus:** Po otwarciu dialogu, fokus powinien być automatycznie ustawiony na pierwszym polu formularza.
  - **Spójność:** Wszystkie dialogi w aplikacji powinny wyglądać i zachowywać się tak samo.

---

## 5. Generowanie Listy (`features/lists/generate`)

### 5.1. `generate-list.page` - Kreator Listy

- **Opis:** Wielokrokowy proces generowania listy zakupów na podstawie przepisów (np. z linków).
- **Kluczowe elementy:**
  - **`generation-steps` (Stepper):** Wskaźnik postępu, pokazujący, na którym etapie jest użytkownik.
  - **`scraping-form`:** Formularz do wklejania linków URL z przepisami.
  - **`generation-form`:** Formularz do wprowadzania dodatkowych informacji (np. ręczne dodawanie produktów).
  - **`generation-status`:** Informacje o statusie generowania (np. "Przetwarzam...", "Gotowe!").
- **Na co zwrócić uwagę:**
  - **Prowadzenie użytkownika:** Proces musi być intuicyjny. Stepper powinien jasno komunikować, co się dzieje.
  - **Obsługa stanu ładowania:** Użytkownik musi widzieć, że aplikacja pracuje (np. przez spinner/loader).
  - **Obsługa błędów:** Co jeśli link jest nieprawidłowy? Musi pojawić się zrozumiały komunikat.

---

## 6. Przegląd Wygenerowanej Listy (`features/generation-review`)

### 6.1. `generation-review.page`

- **Opis:** Strona, na której użytkownik przegląda, edytuje i akceptuje produkty wygenerowane z przepisów.
- **Kluczowe elementy:**
  - **`review-header`:** Podsumowanie (np. "Znaleziono X produktów").
  - **`review-table`:** Tabela z produktami do weryfikacji. Kolumny: Nazwa, Ilość, Jednostka, Kategoria.
  - **`review-table-toolbar`**: Pasek narzędzi nad tabelą, np. z opcją "Zaznacz wszystkie".
  - **`recipe-metadata`**: Informacje o przepisie, z którego pochodzą produkty.
  - **`review-actions`:** Przyciski "Zapisz listę" / "Odrzuć".
- **Na co zwrócić uwagę:**
  - **Edycja w miejscu (inline editing):** Użytkownik powinien móc łatwo poprawić nazwę produktu czy ilość bezpośrednio w tabeli.
  - **Grupowanie/Kategoryzacja:** Produkty powinny być inteligentnie pogrupowane, aby ułatwić przegląd.
  - **Responsywność tabeli:** Tabela musi być czytelna na urządzeniach mobilnych.

---

## 7. Komponenty Współdzielone (`shared`)

### 7.1. `app-loading`

- **Opis:** Wskaźnik ładowania.
- **Na co zwrócić uwagę:** Powinien być subtelny, ale zauważalny. Warto rozważyć umieszczenie go w centralnym miejscu (np. na środku ekranu z półprzezroczystym tłem), aby zablokować interakcje podczas ładowania.

### 7.2. `error-message`

- **Opis:** Komponent do wyświetlania błędów.
- **Na co zwrócić uwagę:** Musi być wizualnie odróżniający się (np. czerwone tło/ramka). Przekaz musi być prosty i zrozumiały dla użytkownika, z ewentualną opcją podjęcia akcji (np. "Spróbuj ponownie").

### 7.3. `offline-banner`

- **Opis:** Baner informujący o utracie połączenia z internetem.
- **Na co zwrócić uwagę:** Powinien być umieszczony na górze ekranu i nie zasłaniać kluczowych elementów interfejsu. Musi być dobrze widoczny.

### 7.4. Toastery/Snackbary

- **Opis:** Chwilowe powiadomienia na dole lub na górze ekranu (np. "Lista została zapisana").
- **Kluczowe elementy:**
  - Komunikat tekstowy.
  - Opcjonalnie przycisk akcji (np. "Cofnij").
  - Ikona statusu (sukces, błąd, informacja).
- **Na co zwrócić uwagę:**
  - **Spójność wyglądu:** Wszystkie toastery powinny mieć ten sam styl i pozycję.
  - **Czas wyświetlania:** Powinien być na tyle długi, aby użytkownik zdążył przeczytać komunikat, ale nie za długi, by nie irytować.
  - **Dostępność:** Powinny być odczytywane przez czytniki ekranu.
