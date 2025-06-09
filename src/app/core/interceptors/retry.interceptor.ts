import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retryWhen, mergeMap, finalize } from 'rxjs/operators';

// Retry configuration constants
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1000,
  EXPONENTIAL_BASE: 2,
  JITTER_PERCENTAGE: 0.1,
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504] as number[],
  RETRYABLE_METHODS: ['GET', 'HEAD', 'OPTIONS'] as string[],
} as const;

@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  private readonly maxRetries = RETRY_CONFIG.MAX_RETRIES;
  private readonly retryDelay = RETRY_CONFIG.BASE_DELAY_MS;
  private readonly retryableStatuses = RETRY_CONFIG.RETRYABLE_STATUS_CODES;
  private readonly retryableMethods = RETRY_CONFIG.RETRYABLE_METHODS;

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error: HttpErrorResponse, attempt: number) => {
            // Only retry for specific conditions
            if (!this.shouldRetry(error, attempt, req)) {
              return throwError(() => error);
            }

            // Calculate exponential backoff delay
            const delay = this.calculateDelay(attempt);

            console.warn(
              `HTTP request failed (attempt ${attempt + 1}/${this.maxRetries}). ` +
                `Retrying in ${delay}ms...`,
              { url: req.url, status: error.status, method: req.method }
            );

            return timer(delay);
          }),
          finalize(() => {
            // Log when retry sequence is complete
            console.debug('Retry sequence completed for request:', req.url);
          })
        )
      ),
      catchError((error: HttpErrorResponse) => {
        // Log final failure after all retries exhausted
        if (this.isRetryableError(error) && this.isRetryableMethod(req.method)) {
          console.error(`HTTP request failed after ${this.maxRetries} retries:`, {
            url: req.url,
            status: error.status,
            method: req.method,
          });
        }
        return throwError(() => error);
      })
    );
  }

  private shouldRetry(
    error: HttpErrorResponse,
    attempt: number,
    req: HttpRequest<unknown>
  ): boolean {
    // Don't retry if we've exceeded max attempts
    if (attempt >= this.maxRetries) {
      return false;
    }

    // Don't retry non-retryable HTTP methods (POST, PUT, DELETE, PATCH)
    if (!this.isRetryableMethod(req.method)) {
      return false;
    }

    // Don't retry for client errors (except specific ones)
    if (!this.isRetryableError(error)) {
      return false;
    }

    // Don't retry for authentication/authorization errors
    const AUTH_ERROR_CODES = [401, 403];
    if (AUTH_ERROR_CODES.includes(error.status)) {
      return false;
    }

    return true;
  }

  private isRetryableError(error: HttpErrorResponse): boolean {
    // Network errors (status 0)
    if (error.status === 0) {
      return true;
    }

    // Server errors and specific client errors
    return this.retryableStatuses.includes(error.status);
  }

  private isRetryableMethod(method: string): boolean {
    return this.retryableMethods.includes(method.toUpperCase());
  }

  private calculateDelay(attempt: number): number {
    // Exponential backoff with jitter to avoid thundering herd
    const exponentialDelay = this.retryDelay * Math.pow(RETRY_CONFIG.EXPONENTIAL_BASE, attempt);
    const jitter = Math.random() * RETRY_CONFIG.JITTER_PERCENTAGE * exponentialDelay;
    return Math.floor(exponentialDelay + jitter);
  }
}
