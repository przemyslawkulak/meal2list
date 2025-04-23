import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { generateSchema } from '../../../services/schemas/generation.schema';
import { GenerationService } from '../../../services/generation.service';
import { GeneratedListResponseDto, CreateRecipeCommand } from '../../../types';

@Injectable({
  providedIn: 'root',
})
export class GenerationController {
  constructor(private generationService: GenerationService) {}

  generateFromText(command: CreateRecipeCommand): Observable<GeneratedListResponseDto> {
    try {
      // Validate input using Zod schema
      generateSchema.parse(command);

      return this.generationService.generateFromText(command.recipe_text).pipe(
        catchError((error: HttpErrorResponse) => {
          let errorMessage = 'An unexpected error occurred';
          let statusCode = 500;

          if (error.status === 401) {
            errorMessage = 'Unauthorized access';
            statusCode = 401;
          } else if (error.status === 400) {
            errorMessage = error.error?.message || 'Invalid input';
            statusCode = 400;
          }

          return throwError(() => ({ message: errorMessage, statusCode }));
        })
      );
    } catch (error) {
      return throwError(() => ({ message: 'Invalid input data', statusCode: 400 }));
    }
  }
}
