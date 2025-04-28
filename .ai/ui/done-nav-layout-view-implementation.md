# Plan implementacji widoku Shell (Nawigacja)

## 1. Przegląd

Widok Shell to główny layout aplikacji dostępny wyłącznie po zalogowaniu. Zawiera stały panel boczny z nawigacją (desktop) lub hamburger menu (mobile/tablet) oraz górny toolbar. Umożliwia użycie `router-outlet` do wyświetlania podwidoków: list zakupowych i generacji listy.

## 2. Routing widoku

```ts
// src/app/app.routes.ts
export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'lists',
        loadChildren: () => import('./features/lists/lists.routes').then(m => m.listsRoutes),
      },
      {
        path: 'generate',
        loadChildren: () =>
          import('./features/generate/generate.routes').then(m => m.generateRoutes),
      },
      { path: '', redirectTo: 'lists', pathMatch: 'full' },
    ],
  },
  { path: '**', component: NotFoundComponent },
];
```

## 3. Struktura komponentów

- AppComponent  
  └── RouterOutlet (wybiera Shell lub Login)  
   └── ShellComponent  
   ├── MatToolbar  
   │ └── MobileMenuToggleComponent  
   └── MatSidenavContainer  
   ├── MatSidenav (mode, opened)  
   │ └── NavListComponent  
   └── MatSidenavContent  
   └── RouterOutlet (podwidoki /lists, /generate)

## 4. Szczegóły komponentów

### ShellComponent

- Opis: główny layout, obsługuje responsywne otwieranie zamykanie panelu i preload kategorii.
- Główne elementy:
  - `<mat-toolbar>` z przyciskiem hamburger (`MobileMenuToggleComponent`)
  - `<mat-sidenav-container>` z `<mat-sidenav>` i `<mat-sidenav-content>`
  - `<router-outlet>` w treści
- Obsługiwane zdarzenia:
  - click na toggle → otwórz/zamknij sidenav
  - automatyczna zmiana trybu przy zmianie rozmiaru ekranu
- Typy/DTO:
  - `CategoryDto`
  - ViewModel:
    ```ts
    interface ShellViewModel {
      isHandset$: Observable<boolean>;
      sidenavMode$: Observable<'side' | 'over'>;
      sidenavOpened$: Observable<boolean>;
      categories$: Observable<CategoryDto[]>;
    }
    ```
- Propsy: brak (samodzielny layout)
- Walidacja: brak formularzy

### NavListComponent

- Opis: renderuje listę linków nawigacyjnych
- Główne elementy: `<mat-nav-list>` z `<a mat-list-item routerLink>`
- Propsy:
  ```ts
  interface NavLink { label: string; path: string; icon?: string; }
  @Input() links: NavLink[];
  ```
- Obsługiwane zdarzenia: click na link → Router.navigate

### MobileMenuToggleComponent

- Opis: przycisk otwierający menu na mobile
- Główne elementy: `<button mat-icon-button>` z ikoną `menu`
- Wyjścia: `@Output() toggle = new EventEmitter<void>();`

## 5. Typy

- CategoryDto:
  ```ts
  export type CategoryDto = { id: string; name: string };
  ```
- NavLink, ShellViewModel (opisane wyżej)
- Reszta typów (ShoppingListResponseDto, itp.) pozostaje w `src/types.ts`

## 6. Zarządzanie stanem

- Respondowanie na breakpointy:
  ```ts
  isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(r => r.matches),
    shareReplay(1)
  );
  sidenavMode$ = this.isHandset$.pipe(map(h => (h ? 'over' : 'side')));
  sidenavOpened$ = this.isHandset$.pipe(map(h => !h));
  ```
- Kategorie:
  - `categories$ = categoryService.categories$` (shareReplay(1) w serwisie)
- ChangeDetectionStrategy.OnPush dla wydajności

## 7. Integracja API

- Service `CategoryService`:
  ```ts
  @Injectable({ providedIn: 'root' })
  export class CategoryService extends SupabaseService {
    private _categories$ = from(
      this.supabase.from('categories').select('id, name').order('name')
    ).pipe(
      map(r => {
        if (r.error) throw r.error;
        return r.data;
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    get categories$(): Observable<CategoryDto[]> {
      return this._categories$;
    }
    preload() {
      this._categories$.subscribe({
        error: () => {
          /* log/snackbar */
        },
      });
    }
  }
  ```
- W ShellComponent.ngOnInit: `categoryService.preload();`

## 8. Interakcje użytkownika

- Klik hamburger → otwarcie/zamknięcie panelu
- Klik link → nawigacja do podwidoku, zamknięcie panelu na mobile
- Zmiana rozmiaru okna → automatyczne przełączenie trybu panelu

## 9. Warunki i walidacja

- AuthGuard: przed wejściem do `/`, sprawdza JWT; redirect do `/login`
- GET /categories: oczekuje 200 + lista; w razie 500 retry i komunikat w UI

## 10. Obsługa błędów

- Błąd preload kategorii:
  - retry 3x z backoff (RxJS `retryWhen`)
  - po ostatniej próbie: `MatSnackBar.open('Nie udało się załadować kategorii', 'OK');`
- AuthGuard odbija na `/login`
- Nieznany route → NotFoundComponent

## 11. Kroki implementacji

1. Stworzyć folder `src/app/layout/shell/` z `shell.component.ts/html/scss`.
2. Wygenerować standalone `ShellComponent` z OnPush i injectami (`BreakpointObserver`, `CategoryService`, `Router`).
3. Zaimplementować logikę obserwacji breakpointów (isHandset$, sidenavMode$, sidenavOpened$).
4. W metodzie `ngOnInit` wywołać `categoryService.preload()`.
5. Stworzyć `NavListComponent` i `MobileMenuToggleComponent` w `src/app/layout`.
6. Zdefiniować `NavLink[]` w ShellComponent i przekazać do NavListComponent.
7. Przygotować i przetestować szablon HTML z `<mat-sidenav-container>`, `<mat-toolbar>` i `<router-outlet>`.
8. Dodać `AuthGuard` do głównej trasy w `app.routes.ts`.
9. Dodać handling błędów preloadu (retry/snackbar).
10. Napisać testy jednostkowe dla ShellComponent (mock BreakpointObserver i CategoryService).
11. Przetestować responsywność w różnych breakpointach (E2E).
