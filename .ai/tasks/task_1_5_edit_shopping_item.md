# Task 1.5: Shopping List Item Editing Implementation

## Overview

Implement comprehensive editing capabilities for shopping list items, allowing users to modify quantities, units, product names, categories, and the ability to mark items as completed or remove them entirely. This task enhances the current shopping list functionality with full CRUD operations on individual items.

## Current State Analysis

### Existing Functionality

- ✅ **Item Creation**: Adding new items via `AddItemDialogComponent`
- ✅ **Item Deletion**: `deleteShoppingListItem()` service method and UI implementation
- ✅ **Item Status Toggle**: `toggleItemChecked()` for marking items as completed
- ✅ **Service Layer**: `ShoppingListItemsService` with `updateShoppingListItem()` method
- ✅ **Data Structure**: `ShoppingListItemResponseDto` and `UpdateShoppingListItemCommand` types

### Missing Functionality

- ❌ **Edit Dialog Component**: No UI for editing existing items
- ❌ **Inline Editing**: No quick edit capabilities in the list view
- ❌ **Edit Action Buttons**: No edit buttons in the current item display
- ❌ **Validation**: No frontend validation for edit operations
- ❌ **Testing**: No tests for edit functionality

## Technical Implementation Plan

### Phase 1: Backend Service Enhancements

#### 1.1 Service Method Validation

- **File**: `src/app/core/supabase/shopping-list-items.service.ts`
- **Task**: Enhance `updateShoppingListItem()` method
- **Changes**:
  - Add comprehensive input validation using Zod schemas
  - Implement proper error handling for edge cases
  - Add optimistic updates support
  - Ensure proper category validation when updating

#### 1.2 Schema Updates

- **File**: `src/schemas/shopping-list-item.schema.ts`
- **Task**: Create update-specific validation schemas
- **Changes**:
  - Create `updateShoppingListItemSchema` for partial updates
  - Add validation for product name length, quantity ranges
  - Implement unit validation against allowed values

### Phase 2: UI Components Development

#### 2.1 Edit Item Dialog Component

- **Location**: `src/app/features/shopping-lists/components/edit-item-dialog/`
- **Files to Create**:
  - `edit-item-dialog.component.ts`
  - `edit-item-dialog.component.html`
  - `edit-item-dialog.component.scss`
  - `edit-item-dialog.component.spec.ts`
  - `index.ts`

**Component Features**:

- Pre-populated form with current item values
- Product name autocomplete using existing products
- Category dropdown with icon display
- Quantity input with validation
- Unit selection dropdown
- Source tracking (maintain original source or mark as 'modified')
- Recipe source preservation
- Form validation with real-time feedback
- Accessibility compliance (ARIA labels, keyboard navigation)

**Dialog Data Interface**:

```typescript
export interface EditItemDialogData {
  item: ShoppingListItemResponseDto;
  categories: CategoryDto[];
  listId: string;
}

export interface UpdatedShoppingListItem {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  category_id: string;
  product_id?: string;
}
```

#### 2.2 Item Actions Enhancement

- **File**: `src/app/features/shopping-lists/pages/detail/shopping-list-detail.component.html`
- **Task**: Add edit action buttons to each item
- **Changes**:
  - Add edit icon button next to delete button
  - Implement responsive design for mobile
  - Add tooltips and accessibility attributes
  - Maintain existing hover/focus states

#### 2.3 Shopping List Detail Component Updates

- **File**: `src/app/features/shopping-lists/pages/detail/shopping-list-detail.component.ts`
- **Task**: Integrate edit functionality
- **Changes**:
  - Add `openEditItemDialog()` method
  - Implement optimistic updates for better UX
  - Add error handling and user feedback
  - Update local state management
  - Add proper loading states

### Phase 3: Advanced Features

#### 3.1 Inline Editing (Optional Enhancement)

- **Task**: Quick edit capabilities directly in the list
- **Features**:
  - Click-to-edit product names
  - Quantity stepper controls
  - Quick category change dropdown
  - Auto-save on blur/enter

#### 3.2 Bulk Edit Operations

- **Task**: Multi-select and bulk edit capabilities
- **Features**:
  - Select multiple items via checkboxes
  - Bulk category change
  - Bulk delete confirmation
  - Bulk completion toggle

### Phase 4: Testing & Quality Assurance

#### 4.1 Unit Tests

- **Files to Test**:
  - `edit-item-dialog.component.spec.ts`
  - `shopping-list-items.service.spec.ts` (edit-specific tests)
  - `shopping-list-detail.component.spec.ts` (edit integration tests)

**Test Scenarios**:

- Form validation edge cases
- Service method error handling
- Optimistic update rollback
- Category validation
- Product name autocomplete
- Accessibility compliance

#### 4.2 E2E Tests

- **File**: `e2e/shopping-list-item-editing.spec.ts`
- **Scenarios**:
  - Complete edit workflow
  - Form validation errors
  - Cancel edit operations
  - Edit different item types (auto, manual, modified)
  - Mobile responsiveness

### Phase 5: Documentation & Polish

#### 5.1 Type Safety Enhancements

- Update type definitions for better IntelliSense
- Add JSDoc comments for new methods
- Ensure proper error type handling

#### 5.2 Accessibility Improvements

- Screen reader compatibility
- Keyboard navigation support
- High contrast mode support
- Focus management in dialogs

## Implementation Checklist

### Backend & Services

- [ ] Enhance `updateShoppingListItem()` method validation
- [ ] Create `updateShoppingListItemSchema`
- [ ] Add comprehensive error handling
- [ ] Implement optimistic update support

### UI Components

- [ ] Create `EditItemDialogComponent`
- [ ] Design responsive dialog layout
- [ ] Implement form validation
- [ ] Add product name autocomplete
- [ ] Create category selection UI
- [ ] Add quantity/unit controls
- [ ] Implement accessibility features

### Integration

- [ ] Add edit buttons to item display
- [ ] Integrate dialog with detail component
- [ ] Implement optimistic updates
- [ ] Add loading states and error handling
- [ ] Update local state management

### Testing

- [ ] Write unit tests for dialog component
- [ ] Test service method edge cases
- [ ] Create E2E test scenarios
- [ ] Test accessibility compliance
- [ ] Validate mobile responsiveness

### Polish & Documentation

- [ ] Add JSDoc comments
- [ ] Update type definitions
- [ ] Implement proper error messages
- [ ] Add loading indicators
- [ ] Create user feedback mechanisms

## Technical Requirements

### Dependencies

- **Angular Material**: Form controls, dialogs, buttons, icons
- **RxJS**: Observable patterns for service integration
- **Zod**: Input validation schemas
- **TypeScript**: Type safety and interfaces

### Performance Considerations

- Implement lazy loading for dialog component
- Use OnPush change detection strategy
- Optimize form validation debouncing
- Minimize unnecessary re-renders

### Accessibility Requirements

- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- Focus management
- Color contrast compliance

### Mobile Responsiveness

- Touch-friendly button sizes (44px minimum)
- Responsive dialog sizing
- Optimized form layouts for small screens
- Swipe gestures for mobile actions

## Expected User Experience

### Edit Flow

1. User clicks edit button on any shopping list item
2. Edit dialog opens with pre-populated form
3. User modifies desired fields with real-time validation
4. User confirms changes or cancels
5. Optimistic update provides immediate feedback
6. Success/error message confirms operation

### Visual Feedback

- Edited items show visual indicator (modified source)
- Loading states during save operations
- Success/error notifications
- Form validation feedback

### Error Handling

- Network connectivity issues
- Validation errors with specific field highlighting
- Conflict resolution (item deleted by another user)
- Graceful degradation and retry mechanisms

## Success Criteria

- [ ] Users can edit all item properties (name, quantity, unit, category)
- [ ] Form validation prevents invalid data submission
- [ ] Optimistic updates provide responsive user experience
- [ ] Edit operations work reliably across all device types
- [ ] Accessibility standards are met
- [ ] All tests pass with good coverage
- [ ] Performance meets application standards
- [ ] User feedback is clear and actionable

## Future Enhancements

### Version 2 Features

- Bulk edit operations
- Inline editing capabilities
- Edit history tracking
- Undo/redo functionality
- Smart suggestions based on edit patterns

### Integration Opportunities

- Connect with recipe management
- Product database synchronization
- Category management improvements
- Advanced search and filtering during edit

## Risk Mitigation

### Technical Risks

- **State Management Complexity**: Use established patterns from existing components
- **Form Validation Performance**: Implement debouncing and async validation
- **Mobile UX Challenges**: Extensive testing on various devices and screen sizes

### User Experience Risks

- **Data Loss**: Implement auto-save drafts and confirmation dialogs
- **Confusion**: Clear visual indicators and helpful error messages
- **Performance**: Optimize for low-end devices and slow networks

This comprehensive implementation plan ensures robust, user-friendly editing capabilities while maintaining consistency with existing codebase patterns and quality standards.
