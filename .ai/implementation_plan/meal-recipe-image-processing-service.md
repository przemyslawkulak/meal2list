# Plan Implementacji: Meal Recipe Image Processing Service

## 1. Opis usługi

Usługa **MealRecipeImageProcessingService** umożliwia konwersję obrazów przepisów kulinarnych na strukturalny tekst przy użyciu modeli AI dostępnych przez openAI.ai. Usługa analizuje przesłane obrazy i ekstraktuje informacje o przepisach, składnikach, instrukcjach przygotowania oraz metadanych kulinarnych.

### Główne funkcjonalności:

1. Przetwarzanie obrazów przepisów kulinarnych
2. Ekstrakcja strukturalnych danych przepisu
3. Walidacja i optymalizacja wyniku
4. Obsługa różnych formatów obrazów
5. Integracja z openAI dla analizy wizualnej

## 2. Opis konstruktora

```typescript
export class MealRecipeImageProcessingService {
  constructor(
    private openAIService: openAIService,
    private logger: LoggerService,
    private notification: NotificationService
  ) {}
}
```

### Parametry konstruktora:

- **openAIService**: Instancja usługi openAI do komunikacji z modelami AI
- **logger**: Usługa logowania dla monitorowania operacji
- **notification**: Usługa powiadomień dla informowania użytkownika o statusie

## 3. Publiczne metody i pola

### 3.1 Metoda główna: `processRecipeImage()`

```typescript
public async processRecipeImage(
  imageFile: File,
  options?: RecipeProcessingOptions
): Promise<ProcessedRecipe>
```

**Parametry:**

- `imageFile`: Plik obrazu do przetworzenia
- `options`: Opcjonalne parametry konfiguracyjne

**Zwraca:** Promise z strukturalnymi danymi przepisu

### 3.2 Metoda pomocnicza: `validateImageFormat()`

```typescript
public validateImageFormat(file: File): ValidationResult
```

**Parametry:**

- `file`: Plik do walidacji

**Zwraca:** Wynik walidacji formatu

### 3.3 Metoda pomocnicza: `getProcessingStatus()`

```typescript
public getProcessingStatus(): Observable<ProcessingStatus>
```

**Zwraca:** Observable ze statusem przetwarzania

### 3.4 Publiczne pola:

```typescript
public readonly supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
public readonly maxFileSize = 10 * 1024 * 1024; // 10MB
public readonly processingTimeout = 30000; // 30 sekund
```

## 4. Prywatne metody i pola

### 4.1 Metoda `prepareImageForProcessing()`

```typescript
private async prepareImageForProcessing(file: File): Promise<string>
```

Konwertuje obraz do formatu base64 wymaganego przez openAI API.

### 4.2 Metoda `buildSystemMessage()`

```typescript
private buildSystemMessage(): string
```

**Przykład komunikatu systemowego:**

```
"You are an expert recipe analyzer. Extract recipe information from images with high accuracy.
Focus on: recipe title, ingredients with quantities, step-by-step instructions, cooking time,
servings, difficulty level, and cuisine type. Always respond in structured JSON format."
```

### 4.3 Metoda `buildUserMessage()`

```typescript
private buildUserMessage(imageBase64: string, options?: RecipeProcessingOptions): any[]
```

**Przykład komunikatu użytkownika:**

```typescript
[
  {
    type: 'text',
    text: 'Please analyze this recipe image and extract all recipe information in the specified JSON format.',
  },
  {
    type: 'image_url',
    image_url: {
      url: `data:image/jpeg;base64,${imageBase64}`,
    },
  },
];
```

### 4.4 Metoda `getResponseFormat()`

```typescript
private getResponseFormat(): any
```

**Przykład response_format:**

```typescript
{
  type: 'json_schema',
  json_schema: {
    name: 'recipe_extraction',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        ingredients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quantity: { type: 'string' },
              unit: { type: 'string' }
            },
            required: ['name']
          }
        },
        instructions: {
          type: 'array',
          items: { type: 'string' }
        },
        cookingTime: { type: 'string' },
        servings: { type: 'number' },
        difficulty: {
          type: 'string',
          enum: ['easy', 'medium', 'hard']
        },
        cuisineType: { type: 'string' },
        nutritionalInfo: {
          type: 'object',
          properties: {
            calories: { type: 'number' },
            protein: { type: 'string' },
            carbohydrates: { type: 'string' },
            fat: { type: 'string' }
          }
        }
      },
      required: ['title', 'ingredients', 'instructions']
    }
  }
}
```

### 4.5 Metoda `getModelConfiguration()`

```typescript
private getModelConfiguration(): ModelConfig
```

**Przykład konfiguracji modelu:**

```typescript
{
  model: 'openai/gpt-4o', // Model z możliwościami wizualnymi
  temperature: 0.1, // Niska temperatura dla spójności
  max_tokens: 2000,
  top_p: 0.9
}
```

### 4.6 Metoda `validateRecipeData()`

```typescript
private validateRecipeData(data: any): ValidationResult
```

Waliduje strukturę i poprawność wyekstraktowanych danych przepisu.

### 4.7 Metoda `optimizeRecipeData()`

```typescript
private optimizeRecipeData(data: ProcessedRecipe): ProcessedRecipe
```

Optymalizuje i normalizuje dane przepisu (jednostki miar, formatowanie, etc.).

### 4.8 Prywatne pola:

```typescript
private processingSubject = new BehaviorSubject<ProcessingStatus>('idle');
private processingHistory: ProcessingLog[] = [];
private retryAttempts = 3;
private retryDelay = 1000;
```

## 5. Obsługa błędów

### 5.1 Scenariusze błędów:

1. **Nieprawidłowy format pliku**

   - Kod błędu: `INVALID_FILE_FORMAT`
   - Rozwiązanie: Walidacja przed przetwarzaniem

2. **Plik zbyt duży**

   - Kod błędu: `FILE_TOO_LARGE`
   - Rozwiązanie: Kompresja lub ograniczenie rozmiaru

3. **Błąd API openAI**

   - Kod błędu: `API_ERROR`
   - Rozwiązanie: Mechanizm retry z exponential backoff

4. **Timeout przetwarzania**

   - Kod błędu: `PROCESSING_TIMEOUT`
   - Rozwiązanie: Anulowanie żądania i retry

5. **Nieprawidłowa odpowiedź AI**

   - Kod błędu: `INVALID_AI_RESPONSE`
   - Rozwiązanie: Walidacja i ponowne przetwarzanie

6. **Brak przepisu na obrazie**
   - Kod błędu: `NO_RECIPE_DETECTED`
   - Rozwiązanie: Informowanie użytkownika o wymaganiach

### 5.2 Implementacja obsługi błędów:

```typescript
private async handleProcessingError(error: any, context: string): Promise<never> {
  const errorInfo = {
    code: this.getErrorCode(error),
    message: this.getErrorMessage(error),
    context,
    timestamp: new Date().toISOString()
  };

  this.logger.error('Recipe processing error', errorInfo);
  this.notification.showError(errorInfo.message);

  throw new RecipeProcessingError(errorInfo);
}
```

## 6. Kwestie bezpieczeństwa

### 6.1 Zabezpieczenia:

1. **Walidacja plików**

   - Sprawdzanie typu MIME
   - Kontrola rozmiaru pliku
   - Skanowanie na malware (opcjonalnie)

2. **Sanityzacja danych**

   - Czyszczenie odpowiedzi AI
   - Walidacja JSON Schema
   - Usuwanie potencjalnie niebezpiecznych znaków

3. **Kontrola dostępu**

   - Uwierzytelnienie użytkownika
   - Rate limiting
   - Logowanie operacji

4. **Bezpieczne przechowywanie**
   - Szyfrowanie tymczasowych plików
   - Automatyczne usuwanie po przetworzeniu
   - Niewystawianie wrażliwych danych

### 6.2 Implementacja bezpieczeństwa:

```typescript
private sanitizeRecipeData(data: any): any {
  return {
    ...data,
    title: this.sanitizeText(data.title),
    ingredients: data.ingredients?.map(ing => ({
      ...ing,
      name: this.sanitizeText(ing.name)
    })),
    instructions: data.instructions?.map(inst => this.sanitizeText(inst))
  };
}
```

## 7. Plan wdrożenia krok po kroku

### Krok 1: Przygotowanie infrastruktury (1-2 dni)

1. Konfiguracja openAI.ai w Supabase Edge Functions
2. Stworzenie typów TypeScript dla przepisów
3. Konfiguracja Angular Material components
4. Przygotowanie schematu walidacji JSON

### Krok 2: Implementacja core service (2-3 dni)

1. Stworzenie `MealRecipeImageProcessingService`
2. Implementacja metod pomocniczych
3. Konfiguracja komunikatów systemowych i użytkownika
4. Implementacja response_format z JSON Schema

### Krok 3: Integracja z openAI (1-2 dni)

1. Konfiguracja modelu GPT-4o dla analizy wizualnej
2. Implementacja retry logic i error handling
3. Testowanie różnych parametrów modelu
4. Optymalizacja kosztów i wydajności

### Krok 4: Implementacja UI komponenty (2-3 dni)

1. Komponent upload obrazu (Angular Material)
2. Preview i progress indicator
3. Wyświetlanie wyników w strukturalnej formie
4. Obsługa błędów w UI

### Krok 5: Walidacja i bezpieczeństwo (1-2 dni)

1. Implementacja walidacji plików
2. Sanityzacja danych wyjściowych
3. Rate limiting i kontrola dostępu
4. Testy bezpieczeństwa

### Krok 6: Testy i optymalizacja (2-3 dni)

1. Testy jednostkowe (Jest)
2. Testy E2E (Playwright)
3. Testy wydajnościowe
4. Optymalizacja accuracy modelu

### Krok 7: Dokumentacja i deployment (1 dzień)

1. Dokumentacja API
2. Instrukcje użytkowania
3. Deploy na DigitalOcean
4. Monitoring i alerting

### Struktura plików:

```
src/app/core/services/
├── meal-recipe-image-processing/
│   ├── meal-recipe-image-processing.service.ts
│   ├── models/
│   │   ├── processed-recipe.model.ts
│   │   ├── processing-options.model.ts
│   │   └── processing-status.model.ts
│   ├── validators/
│   │   └── recipe-data.validator.ts
│   └── index.ts

src/app/features/recipe-image-processing/
├── components/
│   ├── image-upload/
│   ├── processing-status/
│   └── recipe-display/
├── recipe-image-processing.page.ts
└── recipe-image-processing.routes.ts
```

### Całkowity czas implementacji: 8-12 dni

Ten plan zapewnia kompleksowe wdrożenie usługi przetwarzania obrazów przepisów z pełną integracją z tech stackiem Angular 19 + Supabase + openAI.ai, uwzględniając wszystkie aspekty bezpieczeństwa, wydajności i user experience.
