# Specyfikacja modułu autentykacji

## 1. Architektura interfejsu użytkownika

### 1.1. Moduły i routing

- Utworzyć `AuthModule` w `src/app/features/auth`:
  - Routing w `auth.routes.ts` definiuje ścieżki:
    - `/auth/login` → `LoginPageComponent`
    - `/auth/register` → `RegisterPageComponent`
    - `/auth/recover` → `PasswordRecoveryPageComponent`
  - Lazy-load w `AppRoutingModule`:
    ```ts
    { path: 'auth', loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule) }
    ```
- W `AppComponent` wyodrębnić dwie struktury layoutów:
  - `AuthLayoutComponent` – prosty layout dla stron logowania/registracji (centracja formularza).
  - `MainLayoutComponent` – toolbar, sidebar i obszar główny dla części chronionej.

### 1.2. Komponenty formularzy

Wszystkie formularze oparte na Reactive Forms i Angular Material:

- `LoginPageComponent`:
  - Pola:
    - `email` (mat-form-field + mat-error [required, pattern]).
    - `password` (mat-form-field typu password [required]).
- `RegisterPageComponent`:
  - Pola:
    - `email` [required, email pattern].
    - `password` [required, minLength 8].
    - `confirmPassword` [required, musi się zgadzać z `password`].
- `PasswordRecoveryPageComponent`:
  - Pole `email` [required, email pattern].

### 1.3. Walidacja i komunikaty błędów

- Użycie `mat-error` pod każdym `mat-form-field`:
  ```html
  <mat-error *ngIf="email.hasError('required')">Email jest wymagany</mat-error>
  <mat-error *ngIf="email.hasError('email')">Nieprawidłowy format adresu</mat-error>
  ```
- Blokada przycisku submit przez `[disabled]="form.invalid || loading"`.
- Błędy z backendu wyświetlane globalnie przez `MatSnackBar` lub dedykowany komponent `AlertComponent`.

### 1.4. Scenariusze użytkownika

1. Nieautoryzowany użytkownik próbuje wejść na chronioną trasę → `AuthGuard` przekierowuje na `/auth/login`.
2. Użytkownik loguje się → sukces: przekierowanie do dashboardu; błąd: wyświetlenie komunikatu.
3. Użytkownik rejestruje konto → sukces: opcjonalne potwierdzenie mailowe lub automatyczne logowanie i redirect; błąd: komunikat o istniejącym adresie.
4. Zapomniane hasło → wysłanie maila z linkiem resetującym; potwierdzenie w UI.

## 2. Logika backendowa

### 2.1. Endpointy i modele danych

Wykorzystujemy wbudowane endpointy Supabase Auth API:

- POST `/auth/v1/signup` – rejestracja.
- POST `/auth/v1/token?grant_type=password` – logowanie.
- POST `/auth/v1/recover` – żądanie resetu hasła.
- POST `/auth/v1/logout` – wylogowanie.

Model `User` w tabeli `auth.users`:

| pole                 | typ                    |
| -------------------- | ---------------------- |
| `id`                 | `uuid`                 |
| `email`              | `string`               |
| `email_confirmed_at` | `timestamp` lub `null` |
| `created_at`         | `timestamp`            |
| `updated_at`         | `timestamp`            |

DTO frontendu:

```ts
interface AuthCredentials {
  email: string;
  password: string;
}
interface RegisterData extends AuthCredentials {
  confirmPassword: string;
}
interface PasswordRecoveryData {
  email: string;
}
```

### 2.2. Walidacja danych wejściowych

- Klient: Reactive Forms z walidatorami Angular.
- Serwer (Supabase): domyślne reguły Auth (min 6 znaków hasła).
- Dodatkowa walidacja (opcjonalnie Edge Function):
  - Min 8 znaków, złożoność hasła.
  - Unikatowość email (obsługiwane przez Supabase).
- Błędy 4xx zwracane jako JSON z `error` i `status`.

### 2.3. Obsługa wyjątków

- `ErrorInterceptor` globalnie przechwytuje HTTP 401/403 → wymuszony logout.
- W serwisie mapowanie kodów błędów Supabase na przyjazne wiadomości.
- Logowanie krytycznych błędów do zewnętrznego systemu (Sentry).

## 3. System autentykacji

### 3.1. Konfiguracja Supabase Auth w Angular

- `src/app/core/supabase/supabase.client.ts`:
  ```ts
  import { createClient } from '@supabase/supabase-js';
  export const supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  ```
- `SupabaseAuthService` (`core/supabase-auth.service.ts`):
  - `signUp(data: RegisterData): Observable<User>` – wywołuje `supabase.auth.signUp`.
  - `signIn(credentials: AuthCredentials): Observable<User>` – `supabase.auth.signInWithPassword`.
  - `signOut(): Observable<void>` – `supabase.auth.signOut`.
  - `resetPassword(email: string): Observable<void>` – `supabase.auth.resetPasswordForEmail`.
  - `onAuthStateChange(): Observable<Session>` – nasłuchuje zdarzeń `auth.onAuthStateChange`.

### 3.2. Mechanizmy klienta

- `AuthService` fasada nad `SupabaseAuthService`:
  - `currentUser$`: `BehaviorSubject<User | null>`.
  - `isAuthenticated$`: `currentUser$.pipe(map(u => !!u))`.
  - Logika odświeżania tokenu (w razie potrzeby).
- `AuthGuard` (`core/guards/auth.guard.ts`):
  ```ts
  canActivate(): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      tap(auth => {
        if (!auth) this.router.navigate(['auth', 'login']);
      })
    );
  }
  ```
- `AuthInterceptor` (`core/interceptors/auth.interceptor.ts`):
  - Dodaje nagłówek `Authorization: Bearer <token>` do chronionych zapytań.

### 3.3. Bezpieczeństwo i dobre praktyki

- JWT w `localStorage` lub `SessionStorage` z mechanizmem odświeżania.
- Stosować guardy i interceptory do ochrony tras i danych.
- Nie ujawniać surowych komunikatów błędów użytkownikowi.
- Ograniczyć próby logowania (rate limiting) na poziomie edge function (opcjonalnie).

## 4. Zarządzanie kontem i RODO

### 4.1. UI zarządzania kontem

- W `ProfilePageComponent` dodać sekcję "Usuń konto":
  - `mat-button danger` otwierający `MatDialog` z potwierdzeniem operacji.
  - Po potwierdzeniu uruchomić wywołanie usuwania konta.
- Opcjonalnie: przycisk "Eksportuj dane" do pobrania JSON wszystkich danych użytkownika.

### 4.2. Endpointy i logika backendowa

- Edge Function w Supabase `delete-user` (ścieżka `/functions/v1/delete-user`):
  - Wywołuje Supabase Admin API `auth.admin.deleteUser(userId)`.
  - Usuwa powiązane dane z tabel: `shopping_lists`, `recipes`, `profiles`.
  - Zwraca status 204 lub JSON potwierdzający usunięcie.
- (Opcjonalnie) Edge Function `export-user-data` (`/functions/v1/export-user-data`) zwraca JSON z danymi użytkownika.

### 4.3. Serwis Angular

- W `SupabaseAuthService` dodać metodę:
  ```ts
  deleteAccount(): Observable<void> {
    return this.http.post<void>('/functions/v1/delete-user', {});
  }
  ```
- W `ProfileService` opakować i obsłużyć przekierowanie oraz czyszczenie stanu:
  ```ts
  removeAccount() {
    this.authService.deleteAccount().pipe(
      tap(() => this.authService.signOut())
    ).subscribe(() => {
      this.router.navigate(['auth', 'login']);
      this.snackBar.open('Konto usunięte pomyślnie', 'OK');
    });
  }
  ```

### 4.4. Scenariusz usuwania konta

1. Użytkownik klika "Usuń konto" → dialog potwierdzający.
2. Po potwierdzeniu wywołanie `ProfileService.removeAccount()`.
3. Po sukcesie: usunięcie sesji, przekierowanie do `/auth/login`, komunikat o powodzeniu.
4. W razie błędu: wyświetlenie przyjaznego komunikatu o niepowodzeniu.
