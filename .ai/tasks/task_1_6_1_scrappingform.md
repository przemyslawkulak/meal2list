# Task 1.6.1: Scraping Path Form Integration Plan

## Plan for Scraping Path Form Integration

### 1. **Component Architecture**

#### A. Create New Scraping Form Component

- **Location**: `src/app/features/lists/generate/components/scraping-form/`
- **Structure**: Follow three-file pattern (`.ts`, `.html`, `.scss`)
- **Purpose**: Handle URL input and scraping validation

#### B. Modify Generation Form Component

- Add `disabled` input signal to control form state
- Implement visual disabled state styling
- Maintain existing functionality when enabled

### 2. **Form State Management Strategy**

#### A. Parent Component (GenerateListPageComponent) Coordination

- Add new signal: `activeFormType = signal<'text' | 'scraping' | null>(null)`
- Add signal: `scrapedContent = signal<string>('')`
- Implement form switching logic with mutual exclusion
- Handle both form types' submission events

#### B. Form Interaction Logic

```
- When scraping form has URL → disable generation form
- When generation form has text → disable scraping form
- When either form is cleared → enable both forms
- Clear opposite form when switching form types
```

### 3. **Scraping Form Component Design**

#### A. Form Structure

- **URL Input Field**: Material Design text input with URL validation
- **Scrape Button**: Trigger scraping process (loading state support)
- **Preview Area**: Show scraped content summary (first 200 chars)
- **Character Counter**: Reuse existing component for scraped content

#### B. Validation Rules

- Required URL field
- URL format validation (regex)
- Content length validation (same 5000 char limit)
- Domain validation (optional security measure)

#### C. State Management

- `scrapingStatus = signal<'idle' | 'scraping' | 'success' | 'error'>('idle')`
- `scrapedText = signal<string>('')`
- `errorMessage = signal<string | null>(null)`

### 4. **Scraping Service Integration**

#### A. Create Scraping Service

- **Location**: `src/app/core/supabase/scraping.service.ts`
- **Methods**:
  - `scrapeUrl(url: string): Observable<string>`
  - Handle Edge Function integration
  - Error handling for invalid URLs, timeouts, etc.

#### B. Edge Function Integration

- Use existing Supabase Edge Function pattern
- Implement the Cheerio-based scraping from task specification
- Return preprocessed, LLM-optimized content
- Handle CORS and authentication

### 5. **UI/UX Design Considerations**

#### A. Form Layout

- Side-by-side layout on desktop (50/50 split)
- Stacked layout on mobile
- Clear visual separation with divider
- "OR" indicator between forms

#### B. Visual States

- **Disabled State**: Grayed out with reduced opacity
- **Loading State**: Progress indicators during scraping
- **Error State**: Error messages with retry options
- **Success State**: Green checkmark with content preview

#### C. Responsive Design

- Breakpoint handling for form layout switching
- Mobile-optimized input sizing
- Touch-friendly button sizes

### 6. **Data Processing Integration**

#### A. Content Processing Pipeline

```typescript
ScrapedURL → EdgeFunction(Cheerio) → CleanedText → GenerationService → ReviewScreen
ManualText → ValidationOnly → GenerationService → ReviewScreen
```

#### B. Unified Processing

- Both scraping and manual text follow same path after content acquisition
- Same validation rules (5000 char limit)
- Same generation service integration
- Same review screen navigation

### 7. **Error Handling Strategy**

#### A. Scraping-Specific Errors

- Invalid URL format
- Unreachable domains
- Timeout errors (>10s)
- Content extraction failures
- Rate limiting responses

#### B. User Feedback

- Inline validation messages
- Toast notifications for scraping errors
- Retry mechanisms with exponential backoff
- Fallback suggestions (manual text input)

### 8. **Performance Considerations**

#### A. Lazy Loading

- Load scraping service only when needed
- Debounce URL input validation
- Cancel previous scraping requests on new input

#### B. Caching Strategy

- Cache successful scraping results temporarily
- Prevent duplicate requests for same URL
- Session-based caching (not persistent)

### 9. **Implementation Steps**

1. **Phase 1**: Create scraping form component structure
2. **Phase 2**: Implement parent component coordination logic
3. **Phase 3**: Create scraping service and Edge Function integration
4. **Phase 4**: Add form state management and mutual exclusion
5. **Phase 5**: Implement error handling and loading states
6. **Phase 6**: Add responsive design and accessibility features
7. **Phase 7**: Testing and refinement

### 10. **File Structure Changes**

```
src/app/features/lists/generate/components/
├── generation-form/           # Modified (add disabled input)
├── scraping-form/            # NEW
│   ├── scraping-form.component.ts
│   ├── scraping-form.component.html
│   └── scraping-form.component.scss
├── generation-status/         # Existing
└── character-counter/         # Existing (reused)

src/app/core/supabase/
└── scraping.service.ts       # NEW
```

### 11. **Technical Requirements Summary**

#### A. Form Mutual Exclusion

- Only one form can be active at a time
- Clear visual indication of which form is active
- Automatic clearing of inactive form when switching

#### B. Content Processing

- Scraped content processed through same pipeline as manual text
- Same character limits and validation rules
- Same generation service integration

#### C. Error Handling

- Comprehensive error handling for network issues
- User-friendly error messages
- Retry mechanisms where appropriate

#### D. Performance

- Debounced input validation
- Request cancellation for abandoned operations
- Temporary caching of successful scrapes

This plan ensures clean separation of concerns, maintains existing functionality, and provides a seamless user experience with proper mutual exclusion between the two input methods.
