# Plan implementacji widoku Generacja listy z przepisu

## 1. Przegląd

Widok umożliwia użytkownikowi wklejenie tekstu przepisu (do 5000 znaków), wybranie istniejącej listy zakupowej, uruchomienie asynchronicznej generacji składników oraz automatyczne dodanie wygenerowanych pozycji do wybranej listy.

## 2. Routing widoku

- Ścieżka routingu: `/generate`
- Konfiguracja w `app.routes.ts` z loadComponent dla `GenerateListPageComponent`.

## 3. Struktura komponentów

```
GenerateListPageComponent
├── GenerationFormComponent
│   ├── MatFormField (lista zakupów)
│   ├── MatSelect (wybór listy)
│   ├── MatFormField + MatInput (textarea przepisu)
│   ├── CharacterCounterComponent (licznik znaków)
│   └── MatButton (generuj)
└── GenerationStatusComponent (z Angular Animations)
```

## 4. Szczegóły komponentów

### GenerateListPageComponent

- Cel: kontener logiki i stanu, łączy formę i komponent statusu.
- Komponenty dzieci: `GenerationFormComponent`, `GenerationStatusComponent`
- Zarządza serwisami: `ShoppingListsService`, `GenerationService`.

### GenerationFormComponent

- Opis: formularz wprowadzania tekstu przepisu i wyboru listy.
- Elementy:
  - `<mat-form-field>` + `<mat-select>` do listy zakupów.
  - `<mat-form-field>` + `<textarea matInput>` z limitem 5000 znaków.
  - `<app-character-counter>` pokazujący liczbę znaków.
  - `<button mat-flat-button>` do generowania.
- Zdarzenia:
  - `listChange(selectedId: string)`
  - `textChange(text: string)`
  - `generate()`
- Walidacja:
  - Wymagane: wybór listy.
  - Tekst przepisu: niepusty, długość ≤ 5000.
  - Przycisk `generuj` dezaktywowany przy błędach lub w trakcie generacji.
- Typy:
  - `string recipeText`
  - `string selectedListId`
- Props (Output): emit `onGenerate({ listId, recipeText })`

### GenerationStatusComponent

- Opis: wizualizacja postępu i wyniku generacji.
- Elementy:
  - Tekst animowany opisujący etap (np. "Ładowanie...", "Przetwarzanie...", "Dodawanie pozycji...").
  - Lista wygenerowanych pozycji z badge ikoną "auto".
- Inputs:
  - `status$: Signal<'idle' | 'generating' | 'adding' | 'completed' | 'error'>`
  - `items$: Signal<CreateShoppingListItemCommand[]>`
  - `errorMessage?: string`
- Walidacja: timeout 60s -> emit `error` po przekroczeniu.

### CharacterCounterComponent

- Opis: sygnalny licznik znaków.
- Input: `length$: Signal<number>`, `max: number`.
- Wyświetla `length / max`.

## 5. Typy

```ts
// ViewModel dla nowej pozycji
export interface CreateShoppingListItemCommand {
  product_name: string;
  quantity: number;
  unit?: string;
  source: 'auto';
  category_id: string; // domyślna kategoria lub z configu
}

// Payload dla generacji
export interface GenerateShoppingListRequest {
  recipe_text: string;
}

// Odpowiedź API
export interface GeneratedListResponseDto {
  id: string;
  recipe_id: number;
  items: CreateShoppingListItemCommand[];
}
```

## 6. Zarządzanie stanem

- Korzystamy z `signals`:
  - `recipeText` (signal)
  - `selectedListId` (signal)
  - `isGenerating` (signal boolean)
  - `generationStatus` (signal statusu enum)
  - `generatedItems` (signal tablicy ViewModel)
  - `errorMessage` (signal string | null)
- Wzorce: `@if`, `@for` w szablonie, strategia OnPush.

## 7. Integracja API

1. **GET /shopping-lists** – wczytanie list użytkownika przy inicjalizacji.
2. **POST /generate-shopping-list** – wysłanie `{ recipe_text }`, timeout RxJS 60s.
3. **POST /shopping-lists/{listId}/items/batch** – automatyczne dodanie wygenerowanych pozycji.

Proces:

```ts
generationService.generate(recipeText)
  .pipe(timeout(60000), switchMap(resp =>
    shoppingListsService.addItemsBatch(selectedListId, resp.items)
  ))
  .subscribe(...)
```

## 8. Interakcje użytkownika

- Wybór listy z dropdown -> aktualizacja sygnału.
- Wpis/klejenie przepisu -> licznik znaków odświeża się.
- Klik `Generuj` -> zmiana statusu do `generating`, blokada formy.
- Po sukcesie: status `adding` -> potem `completed`, wyświetlenie listy.
- W razie błędu lub timeout: status `error`, komunikat.

## 9. Warunki i walidacja

- `recipeText.trim().length > 0` i `≤ 5000`.
- `selectedListId` nie może być pusty.
- Timeout 60s w RxJS.
- Obsługa błędów HTTP (400, 401, 500).

## 10. Obsługa błędów

- Błąd 400: komunikat "Brak lub nieprawidłowy przepis".
- Błąd 401: przekierowanie do logowania lub popup.
- Błąd 500 lub timeout: komunikat "Generacja nie powiodła się. Spróbuj ponownie."
- Logowanie w `ErrorInterceptor`.

## 11. Kroki implementacji

1. Dodaj routing do `GenerateListPageComponent` w `app.routes.ts`.
2. Wygeneruj `GenerateListPageComponent` jako standalone (OnPush, signal) z Angular CLI.
3. Stwórz `ShoppingListsService` i `GenerationService` (jeśli brak).
4. Implementuj `GenerationFormComponent` (template + SCSS).
5. Dodaj `CharacterCounterComponent`.
6. Wykorzystaj `MatSelect`, `MatFormField`, `MatInput`, `MatButton`.
7. Implementuj sygnały i powiązania formy.
8. Dodaj timeout i obsługę błędów w serwisie RxJS.
9. Stwórz lub zaktualizuj `GenerationStatusComponent` z animacjami.
10. Przetestuj end-to-end oraz jednostkowo (TestBed, spy do serwisów).
11. Dodaj dokumentację i uwzględnij w CI lint i format.
