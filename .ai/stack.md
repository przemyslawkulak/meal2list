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
