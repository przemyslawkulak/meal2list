import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ImageTextExtractionService } from './image-text-extraction.service';

/**
 * Simple service for extracting text from recipe images
 */
@Injectable({
  providedIn: 'root',
})
export class MealRecipeImageProcessingService {
  constructor(private textExtractionService: ImageTextExtractionService) {}

  /**
   * Extract text from recipe image
   */
  processRecipeImage(imageFile: File): Observable<string> {
    return this.textExtractionService.extractTextFromImage(imageFile);
  }
}
