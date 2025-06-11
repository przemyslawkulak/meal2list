import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LoggerService } from '@app/shared/services/logger.service';

@Injectable({
  providedIn: 'root',
})
export class AppInitializationService {
  private readonly logger = inject(LoggerService);

  /**
   * Initialize application
   * Data loading is handled after authentication in AuthService
   */
  initializeApp(): Observable<void> {
    this.logger.logInfo('🚀 Application initialized');
    return of(void 0);
  }
}
