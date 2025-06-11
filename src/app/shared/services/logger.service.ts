import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  logError(error: HttpErrorResponse, context?: string): void {
    if (context) {
      console.error(`[Error] ${context}`, error);
    } else {
      console.error('[Error]', error);
    }
    // TODO: integrate with remote logging (e.g. Sentry, Supabase function)
  }

  logWarning(message: string, context?: string): void {
    if (context) {
      console.warn(`[Warning] ${message}`, context);
    } else {
      console.warn(`[Warning] ${message}`);
    }
  }

  logInfo(message: string, context?: string): void {
    console.info(`[Info] ${message}`, context);
  }

  logDebug(message: string, context?: string): void {
    console.debug(`[Debug] ${message}`, context);
  }
}
