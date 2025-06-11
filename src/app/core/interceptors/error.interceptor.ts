import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '@app/shared/services/notification.service';
import { LoggerService } from '@app/shared/services/logger.service';
import { Router } from '@angular/router';

// Error handling configuration constants
const ERROR_CONFIG = {
  SNACKBAR_DURATION_MS: 6000,
  HTTP_STATUS_CODES: {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    TIMEOUT: 408,
    VALIDATION_ERROR: 422,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
    NETWORK_ERROR: 0,
  },
  STORAGE_KEYS: {
    AUTH_TOKEN: 'supabase.auth.token',
  },
} as const;

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly notification = inject(NotificationService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        return this.handleError(error);
      })
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    this.logger.logError(error, 'HTTP Error');

    // Handle different error types
    const { HTTP_STATUS_CODES } = ERROR_CONFIG;

    switch (error.status) {
      case HTTP_STATUS_CODES.UNAUTHORIZED:
        this.handleUnauthorized();
        break;
      case HTTP_STATUS_CODES.FORBIDDEN:
        this.handleForbidden();
        break;
      case HTTP_STATUS_CODES.BAD_REQUEST:
        this.handleBadRequest(error);
        break;
      case HTTP_STATUS_CODES.NOT_FOUND:
        this.handleNotFound();
        break;
      case HTTP_STATUS_CODES.TIMEOUT:
        this.handleTimeout();
        break;
      case HTTP_STATUS_CODES.VALIDATION_ERROR:
        this.handleValidationError(error);
        break;
      case HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR:
      case HTTP_STATUS_CODES.BAD_GATEWAY:
      case HTTP_STATUS_CODES.SERVICE_UNAVAILABLE:
      case HTTP_STATUS_CODES.GATEWAY_TIMEOUT:
        this.handleServerError();
        break;
      case HTTP_STATUS_CODES.NETWORK_ERROR:
        this.handleNetworkError();
        break;
      default:
        this.handleGenericError(error);
    }

    return throwError(() => error);
  }

  private handleUnauthorized(): void {
    this.showError('Sesja wygasła. Proszę zalogować się ponownie.');
    // Clear any stored authentication data and redirect to login
    localStorage.removeItem(ERROR_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    sessionStorage.removeItem(ERROR_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    this.router.navigate(['/auth/login']);
  }

  private handleForbidden(): void {
    this.showError('Brak uprawnień do wykonania tej operacji.');
  }

  private handleBadRequest(error: HttpErrorResponse): void {
    const message =
      this.extractErrorMessage(error) || 'Nieprawidłowe żądanie. Sprawdź wprowadzone dane.';
    this.showError(message);
  }

  private handleNotFound(): void {
    this.showError('Nie znaleziono żądanego zasobu.');
  }

  private handleTimeout(): void {
    this.showError('Żądanie przekroczyło limit czasu. Spróbuj ponownie.');
  }

  private handleValidationError(error: HttpErrorResponse): void {
    const message = this.extractErrorMessage(error) || 'Dane nie przeszły walidacji.';
    this.showError(message);
  }

  private handleServerError(): void {
    this.showError('Wystąpił problem z serwerem. Spróbuj ponownie za chwilę.');
  }

  private handleNetworkError(): void {
    this.showError('Brak połączenia z internetem. Sprawdź połączenie sieciowe.');
  }

  private handleGenericError(error: HttpErrorResponse): void {
    const message = this.extractErrorMessage(error) || 'Wystąpił nieoczekiwany błąd.';
    this.showError(message);
  }

  private extractErrorMessage(error: HttpErrorResponse): string | null {
    // Try to extract meaningful error message from different response formats
    if (error.error?.message) {
      return error.error.message;
    }

    if (error.error?.error?.message) {
      return error.error.error.message;
    }

    if (error.error?.details) {
      return error.error.details;
    }

    if (typeof error.error === 'string') {
      return error.error;
    }

    return null;
  }

  private showError(message: string): void {
    this.notification.showError(message);
  }
}
