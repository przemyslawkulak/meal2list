Frontend - Angular dla komponentów interaktywnych:

- Angular 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Angular Material zapewnia bibliotekę dostępnych komponentów, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API
- obługa Openrouter.ai poprzez Edge Functions w Supabase

CI/CD i Hosting:

- Github Actions do tworzenia pipeline'ów CI/CD
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker

Code Quality Tools:

- ESLint z konfiguracją @angular-eslint/recommended dla spójnego stylu kodu
  - @typescript-eslint/recommended dla dodatkowych reguł TypeScript
  - eslint-config-prettier dla integracji z Prettier
- Prettier dla automatycznego formatowania kodu
  - Konfiguracja w .prettierrc.json z semi: true, singleQuote: true, printWidth: 100
- Husky dla git hooks
  - pre-commit hook dla uruchamiania lint-staged
- lint-staged dla sprawdzania tylko zmienionych plików
  - Uruchamia ESLint i Prettier na plikach .ts/.html
  - Automatyczne formatowanie i sprawdzanie przed commitem

Testing - Kompleksowe rozwiązania do testowania aplikacji:

- Testy jednostkowe:

  - Jest jako główny framework testowy dla testowania komponentów i usług Angular
  - Pokrycie kodu testami jednostkowymi na poziomie ≥ 80%
  - Każdy commit w CI jest weryfikowany przez testy jednostkowe

- Testy end-to-end (E2E):

  - Playwright do automatyzacji testów w przeglądarce i testowania całej aplikacji
  - Scenariusze testowe obejmujące kluczowe ścieżki użytkownika
  - Testy uruchamiane po zakończeniu sprintów i przed releasem

- Narzędzia dodatkowe:
  - Lighthouse CI do testów wydajnościowych
  - axe-core do testów dostępności
  - Postman + Newman do testowania API
  - OWASP ZAP do testów bezpieczeństwa
