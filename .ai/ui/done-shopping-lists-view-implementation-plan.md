# Plan implementacji widoku Shopping Lists (Przegląd list zakupowych)

## 1. Przegląd

Widok `/lists` prezentuje wszystkie listy zakupowe użytkownika w formie materiałowej listy. Umożliwia: wyświetlanie nazwy i daty utworzenia, tworzenie nowej listy (modal), usuwanie listy z potwierdzeniem oraz generację listy na podstawie przepisu.

## 2. Routing widoku

```ts
// src/app/features/shopping-lists/shopping-lists.routes.ts
export const shoppingListsRoutes: Route[] = [
  {
    path: 'lists',
    component: ShoppingListsPageComponent,
    canActivate: [AuthGuard],
  },
];
```

## 2a. Główne trasy aplikacji

```ts
// src/app/app.routes.ts
export const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'lists',
        loadChildren: () =>
          import('./features/shopping-lists/shopping-lists.module').then(
            m => m.ShoppingListsModule
          ),
      },
      { path: 'generate', component: GeneratePageComponent, canActivate: [AuthGuard] },
      // ...inne trasy
    ],
  },
];
```

## 3. Struktura komponentów

```
ShoppingListsPageComponent
├─ NewShoppingListDialogComponent
├─ DeleteConfirmDialogComponent
└─ ShoppingListItemComponent
```

## 4. Szczegóły komponentów

### ShoppingListsPageComponent

- Przeznaczenie: container dla listy i zarządzania modalami
- Główne elementy:
  - `<mat-toolbar>` z tytułem i przyciskiem "Nowa lista"
  - `<mat-nav-list role="list">` z `*ngFor="let list of lists$ | async; trackBy: trackById"`
  - `<ngx-skeleton-loader>` dla czasu ładowania
  - `<app-shopping-list-item [list]="list" (delete)="openDelete(list)" (generate)="onGenerate(list)" />`
- Zdarzenia:
  - `openNew()` → otwiera `NewShoppingListDialog`
  - `openDelete(list)` → otwiera `DeleteConfirmDialog`
  - `onGenerate(list)` → przekazuje do serwisu generację (opcjonalnie)
- Stan:
  - `lists$`: `Observable<ShoppingListResponseDto[]>`
  - `isLoading`: `boolean`
- Walidacja:
  - brak (tylko wyświetlanie)
- Typy:
  - `ShoppingListResponseDto`
- Propsy: brak (root)

### ShoppingListItemComponent

- Przeznaczenie: wyświetla pojedynczy element listy
- Główne elementy:
  - `<mat-list-item role="listitem">`
    - `.mat-icon-button` usuwania
    - `.mat-icon-button` generacji
    - `.mat-line` nazwa
    - `.mat-line` data utworzenia (DatePipe)
- Zdarzenia:
  - `(click)` na ikonę delete → `delete.emit(list.id)`
  - `(click)` na ikonę generate → `onGenerate(list.recipe_id)` (nawigacja do `/generate` z queryParams)
- Walidacja: brak
- Typy wejściowe:
  - `@Input() list: ShoppingListResponseDto`
  - `@Output() delete = new EventEmitter<string>()`

### NewShoppingListDialogComponent

- Przeznaczenie: modal tworzenia nowej listy
- Główne elementy:
  - `<h1 mat-dialog-title>`
  - `<mat-dialog-content>` z `<form [formGroup]="form">`
    - `<mat-form-field>` z `<input formControlName="name" required maxlength="100" />`
  - `<mat-dialog-actions>`: przyciski Anuluj i Utwórz
- Zdarzenia:
  - `onSubmit()` → walidacja formy, `dialogRef.close(name)`
- Walidacja:
  - `name`: `Validators.required`, `Validators.maxLength(100)`
- Typy:
  - `CreateShoppingListCommand` (name: string)
- Propsy: brak (samodzielny)

### DeleteConfirmDialogComponent

- Przeznaczenie: modal potwierdzenia usunięcia listy
- Główne elementy:
  - `<h2 mat-dialog-title>`: komunikat
  - `<mat-dialog-actions>`: Anuluj, Usuń
- Zdarzenia:
  - `confirm()` → `dialogRef.close(true)`
- Walidacja: brak
- Typy:
  - `id: string` (przekazywane przy otwieraniu)

## 5. Typy

Używamy istniejącego typu `ShoppingListResponseDto` z `src/types.ts`, który zawiera właściwości:

- `id: string`
- `name: string`
- `recipe_id: string | null`
- `created_at: string`
- `updated_at: string`

Datę `created_at` można przekonwertować lokalnie: `new Date(dto.created_at)`.

## 6. Zarządzanie stanem

- W komponencie głównym sygnały (`signal`) lub `BehaviorSubject<ShoppingListResponseDto[]>` + `lists$ = listsSubject.asObservable()`
- `isLoading` jako sygnał/`boolean`
- Po `ngOnInit()` wywołanie `loadLists()` → serwis `getShoppingLists()` → mapowanie na `ShoppingListResponseDto` → emit do stanu
- Po tworzeniu/usuń/refresh pobranie nowej listy lub modyfikacja stanu lokalnie

## 7. Integracja API

- Serwis: `ShoppingListService` z metodami:
  - `getShoppingLists(): Observable<ShoppingListResponseDto[]>`
  - `createShoppingList(cmd: CreateShoppingListCommand): Observable<ShoppingListResponseDto>`
  - `deleteShoppingList(id: string): Observable<void>` (należy dodać)
- Mapowanie DTO → VM
- Typy żądań i odpowiedzi zgodne z `types.ts`

## 8. Interakcje użytkownika

1. Wejście na `/lists` → skeleton loader → po responsie pokazanie listy
2. Klik "Nowa lista" → modal → wprowadzenie nazwy → Utwórz → spinner → zamknięcie → odświeżenie listy
3. Klik ikona kosza → modal potwierdzenia → Usuń → spinner → zamknięcie → usunięcie elementu z listy + snackbar
4. Klik ikona generacji → (opcjonalnie) przekazanie eventu do serwisu generacji

## 9. Warunki i walidacja

- `name`: niepuste, max 100 znaków
- W modalach blokada przycisku Utwórz/Usuń do czasu zakończenia akcji
- Obsługa błędów walidacji formularza (`form.invalid`

## 10. Obsługa błędów

- Błędy 401 → przekierowanie do logowania (AuthGuard)
- Błędy serwera → snackbar z komunikatem "Wystąpił błąd. Spróbuj ponownie."
- Błędy sieci → informacja użytkownika i przycisk retry

## 11. Kroki implementacji

1. Utworzyć moduł `ShoppingListsModule` ze ścieżką `/lists` i lazy loadingiem.
2. Wygenerować komponenty: page, item, new-dialog, delete-dialog.
3. Dodać trasy w `shopping-lists.routes.ts` i zarejestrować w `app.routes.ts`.
4. Zaimplementować serwis `deleteShoppingList` w `ShoppingListService`.
5. Napisać `ShoppingListResponseDto` i helper do mapowania DTO.
6. W `ShoppingListsPageComponent` zaimplementować stan, ładowanie, skeleton i `AsyncPipe`.
7. Zaimplementować `NewShoppingListDialogComponent` z formularzem i walidacją.
8. Zaimplementować `DeleteConfirmDialogComponent`.
9. Zaimplementować `ShoppingListItemComponent` z akcjami.
10. Dodać obsługę błędów i snackbar.
11. Przetestować scenariusze: pusta lista, tworzenie, usuwanie, błędy.
12. Dodać testy jednostkowe dla komponentów i serwisu.
