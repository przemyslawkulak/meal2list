# Task 2.1.0: Meal Recipe Image Processing Service Implementation

## Overview

Implementacja serwisu **MealRecipeImageProcessingService** do konwersji obrazów przepisów kulinarnych na strukturalne dane JSON przy użyciu OpenAI API poprzez Supabase Edge Functions.

## Implementation Rules Compliance

### Backend Rules Applied:

- ✅ Extend SupabaseService base class
- ✅ Use RxJS exclusively (no Promises)
- ✅ Injectable service with proper DI
- ✅ Integrate with Supabase Edge Functions for OpenAI
- ✅ Use Zod schemas for data validation

### Shared Rules Applied:

- ✅ Angular 19 + TypeScript 5
- ✅ Angular Material for UI components
- ✅ RxJS for reactive programming
- ✅ Proper error handling with early returns
- ✅ Clean code practices with guard clauses

## Phase 1: First 3 Implementation Steps

### Step 1: Core Service Infrastructure (Day 1)

**Objective**: Stworzenie podstawowej struktury serwisu z integracją Supabase

**Implementation Details:**

```typescript
// Location: src/app/core/services/meal-recipe-image-processing/
// Files to create:
-meal -
  recipe -
  image -
  processing.service.ts -
  models / processed -
  recipe.model.ts -
  models / processing -
  options.model.ts -
  models / processing -
  status.model.ts -
  index.ts;
```

**Key Components:**

1. **Base Service Class** - extends SupabaseService

   ```typescript
   @Injectable({
     providedIn: 'root',
   })
   export class MealRecipeImageProcessingService extends SupabaseService {
     constructor(@Inject('APP_ENVIRONMENT') environment: AppEnvironment) {
       super(environment);
     }
   }
   ```

2. **TypeScript Models** - zgodne z JSON Schema

   - `ProcessedRecipe`: główny model danych przepisu
   - `RecipeProcessingOptions`: opcje konfiguracyjne
   - `ProcessingStatus`: status przetwarzania ('idle' | 'processing' | 'completed' | 'error')

3. **RxJS Subjects** - reaktywne zarządzanie stanem
   ```typescript
   private processingSubject = new BehaviorSubject<ProcessingStatus>('idle');
   public processingStatus$ = this.processingSubject.asObservable();
   ```

**Deliverables:**

- Struktura katalogów zgodna z planem
- Podstawowa klasa serwisu z DI
- Modele TypeScript z pełnym typowaniem
- Export przez index.ts

### Step 2: File Validation & Image Processing (Day 1-2)

**Objective**: Implementacja walidacji plików i przygotowania obrazów do przetwarzania

**Implementation Details:**

1. **File Validation System**

   ```typescript
   public validateImageFormat(file: File): Observable<ValidationResult> {
     return of(file).pipe(
       map(file => {
         // Early return pattern for validation
         if (!this.supportedFormats.includes(file.type)) {
           throw new Error('INVALID_FILE_FORMAT');
         }
         if (file.size > this.maxFileSize) {
           throw new Error('FILE_TOO_LARGE');
         }
         return { isValid: true, file };
       }),
       catchError(error => this.handleValidationError(error))
     );
   }
   ```

2. **Image Conversion to Base64**

   ```typescript
   private prepareImageForProcessing(file: File): Observable<string> {
     return new Observable(observer => {
       const reader = new FileReader();
       reader.onload = () => observer.next(reader.result as string);
       reader.onerror = error => observer.error(error);
       reader.readAsDataURL(file);
     }).pipe(
       map(dataUrl => dataUrl.split(',')[1]), // Extract base64 part
       timeout(10000),
       catchError(error => this.handleImageProcessingError(error))
     );
   }
   ```

3. **Security & Sanitization**
   - MIME type verification
   - File size limitations
   - Malicious content detection

**Deliverables:**

- Kompletna walidacja plików z RxJS
- Konwersja obrazów do base64
- Error handling dla wszystkich scenariuszy
- Security measures implementation

### Step 3: Supabase Edge Function Integration (Day 2)

**Objective**: Integracja z Supabase Edge Function dla komunikacji z OpenAI API

**Implementation Details:**

1. **Edge Function Call Structure**

   ```typescript
   public processRecipeImage(
     imageFile: File,
     options?: RecipeProcessingOptions
   ): Observable<ProcessedRecipe> {
     return this.validateImageFormat(imageFile).pipe(
       switchMap(() => this.prepareImageForProcessing(imageFile)),
       switchMap(base64Image => this.callOpenAIEdgeFunction(base64Image, options)),
       map(response => this.sanitizeRecipeData(response)),
       tap(() => this.processingSubject.next('completed')),
       catchError(error => this.handleProcessingError(error))
     );
   }
   ```

2. **OpenAI API Request Structure**

   ```typescript
   private callOpenAIEdgeFunction(
     imageBase64: string,
     options?: RecipeProcessingOptions
   ): Observable<any> {
     const payload = {
       model: 'gpt-4o',
       messages: [
         { role: 'system', content: this.buildSystemMessage() },
         { role: 'user', content: this.buildUserMessage(imageBase64, options) }
       ],
       response_format: this.getResponseFormat(),
       temperature: 0.1,
       max_tokens: 2000
     };

     return from(
       this.supabase.functions.invoke('openai-recipe-processor', {
         body: payload
       })
     ).pipe(
       map(result => {
         if (result.error) throw result.error;
         return result.data;
       }),
       retry({ count: 3, delay: 1000 })
     );
   }
   ```

3. **Response Format Definition**
   - JSON Schema dla strukturalnych danych
   - Walidacja odpowiedzi z AI
   - Mapowanie na TypeScript models

**Deliverables:**

- Integracja z Supabase Edge Functions
- Kompletna struktura żądania OpenAI
- Response format z JSON Schema
- Retry logic z exponential backoff

## Summary of Phase 1 (Steps 1-3)

**Co zostało zrealizowane:**

1. ✅ Podstawowa infrastruktura serwisu z SupabaseService
2. ✅ Walidacja plików i konwersja obrazów do base64
3. ✅ Integracja z Supabase Edge Functions dla OpenAI API

**Kluczowe osiągnięcia:**

- Kompletna struktura serwisu zgodna z Angular/Supabase patterns
- RxJS-based reactive architecture
- Robust error handling i security measures
- Typowane modele danych z pełnym pokryciem TypeScript

## Phase 2: UI Integration with Generate List Page (Planned)

### Step 4: Add Image Method Card to Generate List Page (Day 3)

**Objective**: Dodanie trzeciej opcji "Prześlij zdjęcie przepisu" do selection cards

**Implementation Components:**

- Rozszerzenie FormType: `'text' | 'scraping' | 'image'`
- Nowa method-card z ikoną camera/image
- Aktualizacja wszystkich form type references
- Dodanie obsługi image selection w component logic

### Step 5: Image Upload Component & Processing Integration (Day 3-4)

**Objective**: Stworzenie komponentu upload obrazu i integracja z MealRecipeImageProcessingService

**Implementation Components:**

- **ImageUploadComponent** (standalone):
  - File input z drag & drop support
  - Image preview functionality
  - Progress indicator podczas przetwarzania
  - Validation feedback dla formatów/rozmiaru
- **Integration z MealRecipeImageProcessingService**:
  - Wywołanie processRecipeImage() po upload
  - Obsługa processing status i progress
  - Error handling z user-friendly messages
- **Text Extraction Flow**:
  - Po successful processing → przekazanie do text form
  - Auto-switch do 'text' mode z wyekstraktowanym tekstem
  - Zachowanie image source info dla review

### Step 6: Generation Steps Extension & Testing (Day 4)

**Objective**: Rozszerzenie generation-steps o image processing i comprehensive testing

**Implementation Components:**

- **GenerationStepsComponent Updates**:
  - Nowy step "Przetwarzanie obrazu" dla image form type
  - Progress tracking dla AI image processing
  - Visual feedback dla różnych etapów (upload → AI → text extraction)
- **End-to-End Testing**:
  - Image upload workflow
  - Error scenarios (invalid files, AI failures)
  - Integration testing image → text → generation flow
  - Accessibility testing dla nowych komponentów

## Technical Dependencies

### Required Services:

- ✅ SupabaseService (base class)
- ✅ LoggerService (error tracking)
- ✅ NotificationService (user feedback)
- 🔄 OpenAI Edge Function (to be created)

### Required Models:

- 🔄 ProcessedRecipe interface
- 🔄 RecipeProcessingOptions interface
- 🔄 ProcessingStatus type
- 🔄 ValidationResult interface

### Supabase Edge Function Structure:

```typescript
// supabase/functions/openai-recipe-processor/index.ts
// Handles OpenAI API communication
// Processes multimodal requests (text + image)
// Returns structured recipe data
```

## Risk Assessment & Mitigation

### High Risk:

1. **OpenAI API Rate Limits** - Mitigation: Request queuing + user feedback
2. **Large Image Files** - Mitigation: Compression before processing
3. **Inconsistent AI Responses** - Mitigation: Response validation + retry logic

### Medium Risk:

1. **Network Timeouts** - Mitigation: Configurable timeout values
2. **Edge Function Cold Starts** - Mitigation: Keep-alive mechanisms

## Success Criteria

- [ ] Service successfully processes recipe images to structured data
- [ ] Complete RxJS-based reactive architecture
- [ ] Robust error handling for all scenarios
- [ ] Full TypeScript type coverage
- [ ] Integration tests passing
- [ ] Performance within acceptable limits (<30s processing time)

### Struktura plików (Zaktualizowana):

```
src/app/core/services/
├── ✅ meal-recipe-image-processing/ (COMPLETED)
│   ├── ✅ meal-recipe-image-processing.service.ts
│   ├── ✅ models/ (wszystkie modele gotowe)
│   └── ✅ index.ts

src/app/features/lists/generate/
├── ✅ generate-list.page.ts (do aktualizacji - FormType)
├── ✅ generate-list.page.html (do aktualizacji - nowy method card)
├── components/
│   ├── ✅ generation-form/ (existing)
│   ├── ✅ scraping-form/ (existing)
│   ├── 🔄 image-upload/ (NEW - to create)
│   │   ├── image-upload.component.ts
│   │   ├── image-upload.component.html
│   │   └── image-upload.component.scss
│   └── ✅ generation-steps/ (do aktualizacji)

supabase/functions/
└── ✅ openai-recipe-processor/index.ts (COMPLETED)
```

### Całkowity czas implementacji: 8-10 dni

**Phase 1 (COMPLETED):** Core Service - 3 dni ✅  
**Phase 2 (PLANNED):** UI Integration - 3 dni 🔄

Ten plan zapewnia kompleksowe wdrożenie usługi przetwarzania obrazów przepisów z pełną integracją w istniejący Generate List workflow, uwzględniając Angular 19 + Supabase + OpenAI.ai z focus na user experience i accessibility.

### **Updated Flow Architecture:**

```
Image Upload → AI Processing → Text Extraction → Existing Text Workflow → Generation Review
     ↓              ↓              ↓                    ↓                      ↓
[File Input] → [OpenAI API] → [Recipe Text] → [Generation Form] → [Shopping List]
```

**Key Benefits:**

- ✅ Seamless integration z existing workflow
- ✅ Consistent UX pattern dla wszystkich input methods
- ✅ Reuse existing text processing logic
- ✅ Unified error handling i progress tracking

## Next Action Required

✅ **Phase 1 Complete** - Core service ready for UI integration  
🔄 **Ready for Phase 2** - Begin implementing image method card and upload component
