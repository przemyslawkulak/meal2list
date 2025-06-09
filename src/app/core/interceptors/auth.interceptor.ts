import { Injectable, Inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, from, switchMap, catchError, throwError } from 'rxjs';
import { supabaseClient } from '@db/supabase.client';
import { AppEnvironment } from '@app/app.config';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private supabase = supabaseClient;

  constructor(@Inject('APP_ENVIRONMENT') private environment: AppEnvironment) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip auth header for non-Supabase API calls
    if (!this.isSupabaseRequest(req)) {
      return next.handle(req);
    }

    // Get current session and add auth header if available
    return from(this.supabase.auth.getSession()).pipe(
      switchMap(({ data: { session }, error }) => {
        if (error) {
          console.warn('Auth interceptor: Failed to get session:', error);
          return next.handle(req);
        }

        // Clone request and add Authorization header if session exists
        const authReq = session?.access_token
          ? req.clone({
              setHeaders: {
                Authorization: `Bearer ${session.access_token}`,
              },
            })
          : req;

        return next.handle(authReq);
      }),
      catchError(error => {
        console.error('Auth interceptor error:', error);
        return throwError(() => error);
      })
    );
  }

  private isSupabaseRequest(req: HttpRequest<unknown>): boolean {
    return req.url.startsWith(this.environment.supabaseUrl);
  }
}
