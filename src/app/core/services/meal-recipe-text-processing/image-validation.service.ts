import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ImageValidationService {
  private readonly supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  validate(file: File): Observable<void> {
    return of(file).pipe(
      map(file => {
        if (!this.supportedFormats.includes(file.type)) {
          throw new Error(
            `Unsupported file format. Please use: ${this.supportedFormats.join(', ')}`
          );
        }

        if (file.size > this.maxFileSize) {
          throw new Error(`File too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`);
        }
      }),
      catchError(error => throwError(() => error))
    );
  }
}
