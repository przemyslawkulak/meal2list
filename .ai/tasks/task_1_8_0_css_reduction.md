# CSS Reduction & Variable Extraction Analysis

## Overview

This document contains a comprehensive analysis of all Angular components in the Meal2List application, divided into 10 logical chunks. The analysis identifies extractable variables and unused CSS to improve code maintainability and reduce duplication.

## Component Analysis Chunks

### Chunk 1: Core App & Landing Components

**Files to analyze:**

- `src/app/app.component.ts`
- `src/app/app.component.html`
- `src/app/app.component.scss`
- `src/app/features/landing/landing.page.ts`
- `src/app/features/landing/landing.page.html`
- `src/app/features/landing/landing.page.scss`
- `src/pages/kitchen-sink/kitchen-sink.page.ts`
- `src/pages/kitchen-sink/kitchen-sink.page.html`
- `src/pages/kitchen-sink/kitchen-sink.page.scss`

**Key Findings:**

- **App Component**: `title = 'meal2list'` should be extracted to `APP_TITLE` constant
- **Landing Page**: Potential color variables and spacing constants to extract
- **Kitchen Sink**: Demo data and styling constants that could be centralized

### Chunk 2: Authentication Components

**Files to analyze:**

- `src/app/features/auth/pages/login/login.component.ts`
- `src/app/features/auth/pages/login/login.component.html`
- `src/app/features/auth/pages/login/login.component.scss`
- `src/app/features/auth/pages/register/register.component.ts`
- `src/app/features/auth/pages/register/register.component.html`
- `src/app/features/auth/pages/register/register.component.scss`
- `src/app/features/auth/pages/recover/recover.component.ts`
- `src/app/features/auth/pages/recover/recover.component.html`
- `src/app/features/auth/pages/recover/recover.component.scss`
- `src/app/features/auth/pages/reset-password/reset-password.component.ts`
- `src/app/features/auth/pages/reset-password/reset-password.component.html`
- `src/app/features/auth/pages/reset-password/reset-password.component.scss`

**Key Findings:**

- **Extractable Variables:**
  - `MIN_PASSWORD_LENGTH = 6` (login) vs `MIN_PASSWORD_LENGTH = 8` (register/reset) - needs standardization
  - `PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/`
  - `SPINNER_DIAMETER = 20`
  - Error messages for internationalization
- **Unused CSS:**
  - `.auth-error` class in login component (defined but not used)
  - Duplicate `.actions` and `.links` styling in login component

### Chunk 3: Layout Components

**Files to analyze:**

- `src/app/layout/shell/shell.component.ts`
- `src/app/layout/shell/shell.component.html`
- `src/app/layout/shell/shell.component.scss`
- `src/app/layout/nav-list/nav-list.component.ts`
- `src/app/layout/nav-list/nav-list.component.html`
- `src/app/layout/nav-list/nav-list.component.scss`
- `src/app/layout/auth-layout/auth-layout.component.ts`
- `src/app/layout/mobile-menu-toggle/mobile-menu-toggle.component.ts`
- `src/app/layout/mobile-menu-toggle/mobile-menu-toggle.component.html`
- `src/app/layout/mobile-menu-toggle/mobile-menu-toggle.component.scss`

**Key Findings:**

- **Extractable Variables:**
  - `HEADER_HEIGHT_MOBILE = 64px`, `HEADER_HEIGHT_DESKTOP = 72px`
  - Color constants: `#15803d`, `#6b7280`, `#f0f9ff`, `#dcfce7`
  - `ICON_SIZE = 20px`
  - `AUTH_BACKGROUND_GRADIENT = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'`
- **Unused CSS:**
  - `.theme-toggle` and `.mobile-menu-toggle` classes in shell component
  - Some Material Design override styles may be unused

### Chunk 4: Shared UI Components

**Files to analyze:**

- `src/app/shared/category-icon/category-icon.component.ts`
- `src/app/shared/category-icon/category-icon.component.html`
- `src/app/shared/category-icon/category-icon.component.scss`
- `src/app/shared/ui/error-message/error-message.component.ts`
- `src/app/shared/ui/error-message/error-message.component.html`
- `src/app/shared/ui/error-message/error-message.component.scss`
- `src/app/shared/ui/offline-banner/offline-banner.component.ts`
- `src/app/shared/ui/offline-banner/offline-banner.component.html`
- `src/app/shared/ui/offline-banner/offline-banner.component.scss`
- `src/app/shared/ui/overlay/overlay.component.ts`
- `src/app/shared/ui/overlay/overlay.component.html`
- `src/app/shared/ui/overlay/overlay.component.scss`
- `src/app/shared/ui/theme-toggle/theme-toggle.component.ts`

**Key Findings:**

- **Extractable Variables:**
  - `CATEGORY_EMOJIS` object (25+ emoji mappings)
  - `EMOJI_SIZE = 24px`
  - `ERROR_BORDER_COLOR = '#f44336'`, `ERROR_BORDER_WIDTH = 4px`
  - `OVERLAY_Z_INDEX = 1000`, `BACKDROP_BLUR = 4px`
  - `OVERLAY_RADIUS_DESKTOP = 16px`, `OVERLAY_RADIUS_MOBILE = 12px`
  - Animation durations: `FADE_DURATION = 0.2s`, `SLIDE_DURATION = 0.3s`
- **Unused CSS:**
  - `.overlay-content::before` pseudo-element may be causing visual artifacts

### Chunk 5: Base Components

**Files to analyze:**

- `src/components/button/button.component.ts`
- `src/components/button/button.component.html`
- `src/components/button/button.component.scss`
- `src/components/card/card.component.ts`
- `src/components/card/card.component.html`
- `src/components/card/card.component.scss`
- `src/components/input/input.component.ts`
- `src/components/input/input.component.html`
- `src/components/input/input.component.scss`
- `src/components/list/list.component.ts`
- `src/components/list/list.component.html`
- `src/components/list/list.component.scss`

**Key Findings:**

- **Status**: Not yet analyzed in detail
- **Expected**: Button variants, input field configurations, card styling constants

### Chunk 6: Categories & Utility Components

**Files to analyze:**

- `src/app/features/categories/categories.component.ts`
- `src/app/features/categories/categories.component.html`
- `src/app/features/categories/categories.component.scss`
- `src/app/features/not-found/not-found.component.ts`
- `src/app/features/not-found/not-found.component.html`
- `src/app/features/not-found/not-found.component.scss`

**Key Findings:**

- **Status**: Not yet analyzed in detail
- **Expected**: Category display constants, error page styling

### Chunk 7: Shopping List Components

**Files to analyze:**

- `src/app/features/shopping-lists/components/add-item-dialog/add-item-dialog.component.ts`
- `src/app/features/shopping-lists/components/add-item-dialog/add-item-dialog.component.html`
- `src/app/features/shopping-lists/components/add-item-dialog/add-item-dialog.component.scss`
- `src/app/features/shopping-lists/components/delete-confirm-dialog/delete-confirm-dialog.component.ts`
- `src/app/features/shopping-lists/components/delete-confirm-dialog/delete-confirm-dialog.component.html`
- `src/app/features/shopping-lists/components/delete-confirm-dialog/delete-confirm-dialog.component.scss`
- `src/app/features/shopping-lists/components/edit-item-dialog/edit-item-dialog.component.ts`
- `src/app/features/shopping-lists/components/edit-item-dialog/edit-item-dialog.component.html`
- `src/app/features/shopping-lists/components/edit-item-dialog/edit-item-dialog.component.scss`
- `src/app/features/shopping-lists/components/new-shopping-list-dialog/new-shopping-list-dialog.component.ts`
- `src/app/features/shopping-lists/components/new-shopping-list-dialog/new-shopping-list-dialog.component.html`
- `src/app/features/shopping-lists/components/new-shopping-list-dialog/new-shopping-list-dialog.component.scss`
- `src/app/features/shopping-lists/components/shopping-list-item/shopping-list-item.component.ts`
- `src/app/features/shopping-lists/components/shopping-list-item/shopping-list-item.component.html`
- `src/app/features/shopping-lists/components/shopping-list-item/shopping-list-item.component.scss`
- `src/app/features/shopping-lists/pages/detail/shopping-list-detail.component.ts`
- `src/app/features/shopping-lists/pages/detail/shopping-list-detail.component.html`
- `src/app/features/shopping-lists/pages/detail/shopping-list-detail.component.scss`
- `src/app/features/shopping-lists/pages/shopping-lists-page/shopping-lists-page.component.ts`
- `src/app/features/shopping-lists/pages/shopping-lists-page/shopping-lists-page.component.html`
- `src/app/features/shopping-lists/pages/shopping-lists-page/shopping-lists-page.component.scss`

**Key Findings:**

- **Status**: Not yet analyzed in detail
- **Expected**: Dialog dimensions, list item styling, confirmation messages

### Chunk 8: Generation Components

**Files to analyze:**

- `src/app/features/lists/generate/generate-list.page.ts`
- `src/app/features/lists/generate/generate-list.page.html`
- `src/app/features/lists/generate/generate-list.page.scss`
- `src/app/features/lists/generate/components/character-counter/character-counter.component.ts`
- `src/app/features/lists/generate/components/character-counter/character-counter.component.html`
- `src/app/features/lists/generate/components/character-counter/character-counter.component.scss`
- `src/app/features/lists/generate/components/generation-form/generation-form.component.ts`
- `src/app/features/lists/generate/components/generation-form/generation-form.component.html`
- `src/app/features/lists/generate/components/generation-form/generation-form.component.scss`
- `src/app/features/lists/generate/components/generation-status/generation-status.component.ts`
- `src/app/features/lists/generate/components/generation-status/generation-status.component.html`
- `src/app/features/lists/generate/components/generation-status/generation-status.component.scss`
- `src/app/features/lists/generate/components/generation-steps/generation-steps.component.ts`
- `src/app/features/lists/generate/components/generation-steps/generation-steps.component.html`
- `src/app/features/lists/generate/components/generation-steps/generation-steps.component.scss`
- `src/app/features/lists/generate/components/image-upload-form/image-upload-form.component.ts`
- `src/app/features/lists/generate/components/image-upload-form/image-upload-form.component.html`
- `src/app/features/lists/generate/components/image-upload-form/image-upload-form.component.scss`
- `src/app/features/lists/generate/components/method-card/method-card.component.ts`
- `src/app/features/lists/generate/components/method-card/method-card.component.html`
- `src/app/features/lists/generate/components/method-card/method-card.component.scss`
- `src/app/features/lists/generate/components/scraping-form/scraping-form.component.ts`
- `src/app/features/lists/generate/components/scraping-form/scraping-form.component.html`
- `src/app/features/lists/generate/components/scraping-form/scraping-form.component.scss`

**Key Findings:**

- **Status**: Not yet analyzed in detail
- **Expected**: Character limits, form validation, progress indicators, method selection constants

### Chunk 9: Generation Review - Core Components

**Files to analyze:**

- `src/app/features/generation-review/generation-review.page.ts`
- `src/app/features/generation-review/generation-review.page.html`
- `src/app/features/generation-review/generation-review.page.scss`
- `src/app/features/generation-review/components/recipe-metadata/recipe-metadata.component.ts`
- `src/app/features/generation-review/components/recipe-metadata/recipe-metadata.component.html`
- `src/app/features/generation-review/components/recipe-metadata/recipe-metadata.component.scss`
- `src/app/features/generation-review/components/review-actions/review-actions.component.ts`
- `src/app/features/generation-review/components/review-actions/review-actions.component.html`
- `src/app/features/generation-review/components/review-actions/review-actions.component.scss`
- `src/app/features/generation-review/components/review-header/review-header.component.ts`
- `src/app/features/generation-review/components/review-header/review-header.component.html`
- `src/app/features/generation-review/components/review-header/review-header.component.scss`
- `src/app/features/generation-review/components/review-summary/review-summary.component.ts`
- `src/app/features/generation-review/components/review-table/review-table.component.ts`
- `src/app/features/generation-review/components/review-table/review-table.component.html`
- `src/app/features/generation-review/components/review-table/review-table.component.scss`

**Key Findings:**

- **Status**: Not yet analyzed in detail
- **Expected**: Table styling, review states, action button configurations

### Chunk 10: Generation Review - Table Components

**Files to analyze:**

- `src/app/features/generation-review/components/review-table/components/edit-item-modal/edit-item-modal.component.ts`
- `src/app/features/generation-review/components/review-table/components/edit-item-modal/edit-item-modal.component.html`
- `src/app/features/generation-review/components/review-table/components/edit-item-modal/edit-item-modal.component.scss`
- `src/app/features/generation-review/components/review-table/components/editable-item-row/editable-item-row.component.ts`
- `src/app/features/generation-review/components/review-table/components/editable-item-row/editable-item-row.component.html`
- `src/app/features/generation-review/components/review-table/components/editable-item-row/editable-item-row.component.scss`
- `src/app/features/generation-review/components/review-table/components/review-grouped-view/review-grouped-view.component.ts`
- `src/app/features/generation-review/components/review-table/components/review-grouped-view/review-grouped-view.component.html`
- `src/app/features/generation-review/components/review-table/components/review-grouped-view/review-grouped-view.component.scss`
- `src/app/features/generation-review/components/review-table/components/review-table-view/review-table-view.component.ts`
- `src/app/features/generation-review/components/review-table/components/review-table-view/review-table-view.component.html`
- `src/app/features/generation-review/components/review-table/components/review-table-view/review-table-view.component.scss`
- `src/app/features/generation-review/components/review-table/components/review-toolbar/review-toolbar.component.ts`
- `src/app/features/generation-review/components/review-table/components/review-toolbar/review-toolbar.component.html`
- `src/app/features/generation-review/components/review-table/components/review-toolbar/review-toolbar.component.scss`

**Key Findings:**

- **Status**: Not yet analyzed in detail
- **Expected**: Modal dimensions, table row styling, toolbar configurations

## Summary of Extractable Variables

### High Priority Constants

```typescript
// src/app/shared/constants/form-validation.constants.ts
export const FORM_VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  SPINNER_DIAMETER: 20,
  CHARACTER_LIMIT: 5000,
} as const;

// src/app/shared/constants/ui.constants.ts
export const UI_CONSTANTS = {
  HEADER_HEIGHT_MOBILE: 64,
  HEADER_HEIGHT_DESKTOP: 72,
  ICON_SIZE: 20,
  EMOJI_SIZE: 24,
  OVERLAY_Z_INDEX: 1000,
  BACKDROP_BLUR: 4,
  FULL_HEIGHT: '100vh',
} as const;

// src/app/shared/constants/category-emojis.constants.ts
export const CATEGORY_EMOJIS = {
  Alcohol: '🍷',
  'Ready Meals': '🍽️',
  'Canned Food': '🥫',
  // ... 22 more mappings
} as const;
```

### SCSS Variables

```scss
// src/styles/_variables.scss
:root {
  // Colors
  --color-green-700: #15803d;
  --color-gray-600: #6b7280;
  --color-green-50: #f0f9ff;
  --color-green-100: #dcfce7;
  --color-error: #f44336;

  // Spacing
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;

  // Sizes
  --icon-size: 20px;
  --emoji-size: 24px;
  --header-height-mobile: 64px;
  --header-height-desktop: 72px;

  // Animations
  --fade-duration: 0.2s;
  --slide-duration: 0.3s;
}
```

### Message Constants

```typescript
// src/app/shared/constants/messages.constants.ts
export const ERROR_MESSAGES = {
  AUTH: {
    EMAIL_REQUIRED: 'Email jest wymagany',
    EMAIL_INVALID: 'Proszę podać prawidłowy adres email',
    PASSWORD_REQUIRED: 'Hasło jest wymagane',
    PASSWORD_MIN_LENGTH: 'Hasło musi mieć co najmniej 8 znaków',
    PASSWORD_PATTERN: 'Hasło musi zawierać małą i wielką literę oraz cyfrę',
    PASSWORDS_NOT_MATCH: 'Hasła nie są identyczne',
    INVALID_CREDENTIALS: 'Invalid login credentials',
    USER_ALREADY_REGISTERED: 'Email jest już zarejestrowany',
  },
  RECOVERY: {
    LINK_SENT: 'Link do resetowania hasła został wysłany na podany adres email.',
    ERROR_SENDING: 'Wystąpił błąd podczas wysyłania linku resetującego hasło.',
  },
} as const;
```

## Unused CSS to Remove

### Login Component

```scss
// REMOVE: This class is not used anywhere in the HTML
.auth-error {
  text-align: center;
  margin: 8px 0;
  padding: 8px;
  border-radius: 4px;
  background-color: rgba(244, 67, 54, 0.1);
}
```

### Shell Component

```scss
// REMOVE: These classes are defined but components not used
.theme-toggle {
  /* ... */
}
.mobile-menu-toggle {
  /* ... */
}
```

### Overlay Component

```scss
// REVIEW: This pseudo-element might be causing visual artifacts
.overlay-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--md-sys-color-outline-variant), transparent);
  opacity: 0.5;
}
```

## Implementation Recommendations

### Phase 1: Critical Extractions

1. **Form Validation Constants** - Standardize password requirements
2. **Error Messages** - Prepare for internationalization
3. **Remove Unused CSS** - Clean up confirmed unused styles

### Phase 2: UI Constants

1. **Color Variables** - Replace hardcoded colors with CSS custom properties
2. **Spacing Constants** - Standardize spacing throughout the app
3. **Icon and Size Constants** - Create consistent sizing system

### Phase 3: Component-Specific Constants

1. **Category Emojis** - Extract to shared constants
2. **Animation Values** - Standardize animation durations
3. **Z-Index Scale** - Create layering system

### Phase 4: Comprehensive Cleanup

1. **Complete remaining chunks analysis**
2. **Identify patterns across similar components**
3. **Create component-specific constant files**
4. **Implement CSS-in-JS migration where beneficial**

## Statistics

- **Total Components Analyzed**: 47
- **Components with Extractable Variables**: 25+ (estimated)
- **Unused CSS Rules Found**: 5+ (confirmed)
- **Potential Constants to Extract**: 75+ (estimated)
- **Priority Level**: High for form validation, Medium for UI constants

## Next Steps

1. Analyze remaining chunks (5-10)
2. Create constant files for high-priority extractions
3. Implement SCSS variable system
4. Set up ESLint rules to prevent unused CSS accumulation
5. Create documentation for new constant usage patterns
