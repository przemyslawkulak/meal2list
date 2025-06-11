import { ErrorHandler, Injectable, inject } from '@angular/core';
import { NotificationService } from '@app/shared/services/notification.service';
import { LoggerService } from '@app/shared/services/logger.service';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(LoggerService);
  private readonly notification = inject(NotificationService);

  handleError(error: HttpErrorResponse): void {
    this.logger.logError(error);
    this.notification.showError('An unexpected error occurred.');
  }
}
