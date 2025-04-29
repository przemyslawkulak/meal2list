# Dokument wymagań produktu (PRD) - Meal2List

## 1. Przegląd produktu

Meal2List to webowa aplikacja zaprojektowana do uproszczenia procesu tworzenia list zakupowych poprzez automatyczne generowanie listy składników na podstawie wprowadzonego przepisu tekstowego. Użytkownicy, głównie kucharze domowi, mogą również ręcznie tworzyć i edytować swoje listy zakupowe. Aplikacja umożliwia zapisywanie, przeglądanie oraz usuwanie przepisów w formie tekstowej, a także sortowanie produktów według statycznie zdefiniowanych kategorii (np. nabiał, warzywa, owoce, pieczywo). Produkty są oznaczane ikonami lub badge'ami, co umożliwia rozróżnienie między automatycznie generowanymi, ręcznie dodanymi oraz modyfikowanymi wpisami.

## 2. Problem użytkownika

Głównym problemem jest ręczne tworzenie list zakupowych, które jest czasochłonne i nudne. Kucharze domowi chcą skupić się na gotowaniu, a nie przepisywaniu zakupów. Automatyzacja tego procesu pozwoli zaoszczędzić czas, zmniejszyć liczbę błędów oraz poprawić efektywność planowania zakupów.

## 3. Wymagania funkcjonalne

- System umożliwia zapisywanie, odczytywanie, przeglądanie i usuwanie przepisów w formie tekstowej.
- Automatyczne generowanie listy zakupowej przy użyciu AI, która wyodrębnia składniki z wklejonego przepisu.
- Ręczne tworzenie listy zakupowej, z możliwością dodawania nowych produktów.
- Edycja listy zakupowej: zmiana ilości, jednostki, usuwanie produktów oraz oznaczanie ich jako zrealizowane (checkbox).
- Grupowanie produktów według statycznych kategorii (np. nabiał, warzywa, owoce, pieczywo).
- Oznaczenie produktów według źródła: automatycznie generowane, ręcznie dodane, modyfikowane (z użyciem ikon lub badge'ów).
- Prosty system kont użytkowników z mechanizmem rejestracji i logowania, zapewniający bezpieczny dostęp do list zakupowych.
- Możliwość edycji jedynie elementów listy zakupowej (bez edycji czy walidacji przepisu).
- Architektura umożliwiająca przyszłe rozszerzenia, takie jak logi zmian, imprt przepisu z adredu URL historia edycji produktów oraz edycja przepisów.

## 4. Granice produktu

- Import przepisu z adresu URL nie jest obsługiwany.
- Brak bogatej obsługi multimediów (np. zdjęć przepisów).
- Funkcje społecznościowe, takie jak udostępnianie przepisów czy list, nie są uwzględnione.
- Edycja i walidacja przepisów nie są możliwe.
- Aplikacja dostępna jest wyłącznie jako webowa wersja; brak natywnych aplikacji mobilnych.
- Tworzenie baz przepisów, wyszukiwarka, podsumowania kosztów przepisu oraz customowe listy produktów wykraczają poza zakres MVP.
- Funkcjonalności logów zmian i historii edycji są planowane na przyszłe wersje.
- Dane o listach zakupowych, produktach, przepisach i użytkownikach przechowywane w sposób zapewniający skalowalność i bezpieczeństwo.
- Dane osobowe użytkowników i przepisów przechowywane zgodnie z RODO.
- Prawo do wglądu i usunięcia danych (konto wraz z listami i przepisamy) na wniosek użytkownika.

## 5. Historyjki użytkowników

US-001
Tytuł: Bezpieczny dostęp
Opis: Jako użytkownik chcę móc zarejestrować konto oraz zalogować się, aby uzyskać bezpieczny dostęp do swoich list zakupowych.
Kryteria akceptacji:

- Logowanie i rejestracja odbywają się na dedykowanych stronach.
- Logowanie wymaga podania adresu email i hasła.
- Rejestracja wymaga podania adresu email, hasła i potwierdzenia hasła.
- Użytkownik NIE MOŻE korzystać z innych stron poza logowanie i rejestracją bez zalogowania.
- Po pomyślnym logowaniu użytkownik widzi swoje listy zakupowe.
- Użytkownik może logować się do systemu poprzez przycisk w prawym górnym rogu.
- Użytkownik może się wylogować z systemu poprzez przycisk w prawym górnym rogu.
- Nie korzystamy z zewnętrznych serwisów logowania (np. Google, GitHub).
- Odzyskiwanie hasła powinno być możliwe.

US-002
Tytuł: Ręczne tworzenie listy zakupowej
Opis: Jako użytkownik chcę móc ręcznie tworzyć nową listę zakupową oraz dodawać do niej produkty, aby rozpocząć organizację zakupów.
Kryteria akceptacji:

- Użytkownik może utworzyć nową listę zakupową.
- Interfejs umożliwia dodawanie nowych produktów ręcznie.
- Nowo utworzona lista jest widoczna w widoku listy.

US-003
Tytuł: Ręczna edycja listy zakupowej
Opis: Jako użytkownik chcę móc edytować istniejącą listę zakupową, aby zmienić ilości, jednostki lub inne właściwości produktów, bez konieczności usuwania listy.
Kryteria akceptacji:

- Użytkownik może zmieniać ilości i jednostki produktów w liście.
- Zmiany są zapisywane i aktualizowane w widoku listy.

US-004
Tytuł: Usuwanie całej listy zakupowej z potwierdzeniem
Opis: Jako użytkownik chcę móc usuwać całą listę zakupową, aby usuwać niepotrzebne lub nieaktualne listy, przy czym każda operacja usuwania wymaga zatwierdzenia.
Kryteria akceptacji:

- Interfejs zawiera opcję usunięcia listy zakupowej.
- Przed usunięciem wyświetlane jest okno potwierdzenia operacji.
- Po potwierdzeniu lista zostaje usunięta, a użytkownik otrzymuje komunikat o powodzeniu operacji.
- W przypadku anulowania operacji lista pozostaje niezmieniona.

US-005
Tytuł: Przeglądanie listy zakupowej
Opis: Jako użytkownik chcę przeglądać swoją listę zakupową, aby mieć szybki dostęp do widoku wszystkich produktów.
Kryteria akceptacji:

- Lista zakupowa jest wyświetlana w przejrzystym interfejsie.
- Produkty są wyświetlane wraz z informacjami o stanie i źródle pochodzenia (jeśli dotyczy).

US-006
Tytuł: Edycja pojedynczych produktów na liście zakupowej
Opis: Jako użytkownik chcę móc edytować poszczególne produkty na liście zakupowej, aby zmienić ich ilości lub jednostki.
Kryteria akceptacji:

- Użytkownik może edytować ilość oraz jednostkę pojedynczego produktu.
- Zmiany są natychmiast zapisywane i widoczne w widoku listy.

US-007
Tytuł: Usuwanie pojedynczych produktów z potwierdzeniem
Opis: Jako użytkownik chcę móc usuwać pojedyncze produkty z listy zakupowej, aby usuwać te, które nie są już potrzebne, przy czym każda operacja usuwania wymaga zatwierdzenia.
Kryteria akceptacji:

- Interfejs umożliwia usunięcie indywidualnego produktu z listy.
- Przed usunięciem produktu wyświetlane jest okno potwierdzenia operacji.
- Po potwierdzeniu produkt zostaje usunięty.
- W przypadku anulowania operacji produkt pozostaje na liście.

US-008
Tytuł: Automatyczne generowanie listy zakupowej z przepisu
Opis: Jako użytkownik chcę wkleić przepis w formie tekstowej, aby system automatycznie wyodrębnił składniki i wygenerował listę zakupową.
Kryteria akceptacji:

- Dostępne jest pole tekstowe do wprowadzenia przepisu, które oczekuje do 5000 znaków.
- Po kliknięciu przycisku generowania aplikacja komunikuje się z API modelu LLM i wyświetla listę wygenerowanych składników.
- W przypadku problemów z API lub braku odpowiedzi, użytkownik zobaczy stosowny komunikat o błędzie.
- Produkty automatycznie wygenerowane są oznaczone odpowiednią ikoną lub badge'em.

US-009
Tytuł: Oznaczenie źródła produktów
Opis: Jako użytkownik chcę, aby produkty na liście były wyraźnie oznaczone według źródła (automatycznie generowane, ręcznie dodane, modyfikowane), aby móc łatwo ocenić jakość generacji AI.
Kryteria akceptacji:

- Każdy produkt posiada widoczną etykietę lub ikonę wskazującą źródło.
- Ikony lub badge są spójne i czytelne.

US-010
Tytuł: Automatyczne grupowanie produktów
Opis: Jako użytkownik chcę, aby produkty na liście zakupowej były automatycznie pogrupowane według zdefiniowanych kategorii (np. nabiał, warzywa, owoce, pieczywo), aby ułatwić przegląd i organizację zakupów.
Kryteria akceptacji:

- Produkty dodawane do listy (zarówno generowane przez AI, jak i ręcznie dodane) są automatycznie grupowane według ustalonych kategorii.
- Lista zakupowa wyświetla sekcje z nazwami kategorii.
- Grupowanie produktów jest widoczne i spójne we wszystkich widokach listy.

## 6. Metryki sukcesu

- 80% produktów wygenerowanych przez AI musi być akceptowanych przez użytkowników (niezmodyfikowanych).
- 75% użytkowników generuje produkty do listy zakupowej na przynajmniej jeden przepis tygodniowo.
- Wskaźniki satysfakcji użytkowników oraz częstotliwość korzystania z aplikacji będą monitorowane dla dalszej optymalizacji produktu.
