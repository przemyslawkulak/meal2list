import { Injectable } from '@angular/core';
import { GenerationReviewItemDto } from '../../../../types';

@Injectable({
  providedIn: 'root',
})
export class ReviewValidationService {
  validateItems(items: GenerationReviewItemDto[]): string[] {
    const errors: string[] = [];
    const includedItems = items.filter(item => !item.excluded);

    if (includedItems.length === 0) {
      errors.push('Musisz wybrać przynajmniej jeden produkt');
    }

    // Validate individual items
    includedItems.forEach((item, index) => {
      if (!item.product_name?.trim()) {
        errors.push(`Produkt ${index + 1}: Nazwa nie może być pusta`);
      }
      if (item.quantity <= 0) {
        errors.push(`Produkt ${index + 1}: Ilość musi być większa od 0`);
      }
      if (!item.unit?.trim()) {
        errors.push(`Produkt ${index + 1}: Jednostka jest wymagana`);
      }
      if (!item.category_id) {
        errors.push(`Produkt ${index + 1}: Kategoria jest wymagana`);
      }
    });

    return errors;
  }

  validateRecipeMetadata(name: string, source: string): string[] {
    const errors: string[] = [];

    if (!name?.trim()) {
      errors.push('Nazwa przepisu jest wymagana');
    }

    if (!source?.trim()) {
      errors.push('Źródło przepisu jest wymagane');
    }

    return errors;
  }

  hasValidItems(items: GenerationReviewItemDto[], formErrors: string[]): boolean {
    const includedItems = items.filter(item => !item.excluded);
    return includedItems.length > 0 && formErrors.length === 0;
  }
}
