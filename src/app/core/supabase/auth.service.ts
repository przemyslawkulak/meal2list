import { Injectable, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { User, AuthResponse } from '@supabase/supabase-js';
import { AppEnvironment } from '@app/app.config';
import { SupabaseService } from './supabase.service';

// Auth service configuration constants
const AUTH_CONFIG = {
  SNACKBAR_DURATIONS_MS: {
    SUCCESS: 3000,
    ERROR: 5000,
  },
} as const;

@Injectable({
  providedIn: 'root',
})
export class AuthService extends SupabaseService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));

  constructor(
    @Inject('APP_ENVIRONMENT') environment: AppEnvironment,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    super(environment);
    this.initializeAuth();
  }

  private initializeAuth(): void {
    // Check for existing sessions
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.currentUserSubject.next(session?.user ?? null);

      // Don't auto-navigate on app initialization - let guards handle routing
      // This prevents interference with returnUrl logic

      // Setup auth state change subscription
      this.supabase.auth.onAuthStateChange((event, session) => {
        this.currentUserSubject.next(session?.user ?? null);

        if (event === 'SIGNED_OUT') {
          this.router.navigate(['/auth/login']);
        }
      });
    });
  }

  signUp(email: string, password: string): Observable<User> {
    return from(this.supabase.auth.signUp({ email, password })).pipe(
      map((response: AuthResponse) => {
        if (response.error) throw response.error;
        const user = response.data.user;
        if (!user) throw new Error('No user returned from auth response');
        return user;
      }),
      catchError(error => {
        console.error('Registration error:', error);
        this.snackBar.open(this.getErrorMessage(error), 'Close', {
          duration: AUTH_CONFIG.SNACKBAR_DURATIONS_MS.ERROR,
          panelClass: ['error-snackbar'],
        });
        throw error;
      })
    );
  }

  login(email: string, password: string, returnUrl?: string): Observable<User> {
    return from(this.signInWithPassword(email, password)).pipe(
      map((response: AuthResponse) => {
        if (response.error) throw response.error;

        const user = response.data.user;
        if (!user) throw new Error('No user returned from auth response');

        this.currentUserSubject.next(user);

        return user;
      }),
      tap(() => {
        this.snackBar.open('Zalogowano pomyślnie', 'Zamknij', {
          duration: AUTH_CONFIG.SNACKBAR_DURATIONS_MS.SUCCESS,
        });
        // Navigate to intended URL or default to lists
        console.log('Auth: Login successful, returnUrl:', returnUrl);
        if (returnUrl && returnUrl !== '/auth/login') {
          console.log('Auth: Navigating to returnUrl:', returnUrl);
          this.router.navigateByUrl(returnUrl);
        } else {
          console.log('Auth: Navigating to default /lists');
          this.router.navigate(['/lists']);
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        this.snackBar.open(this.getErrorMessage(error), 'Close', {
          duration: AUTH_CONFIG.SNACKBAR_DURATIONS_MS.ERROR,
          panelClass: ['error-snackbar'],
        });
        throw error;
      })
    );
  }

  logout(): Observable<void> {
    return from(this.signOut()).pipe(
      map(() => void 0),
      tap(() => {
        this.currentUserSubject.next(null);
        this.router.navigate(['/auth/login']);
      }),
      catchError(error => {
        console.error('Logout error:', error);
        return of(void 0);
      })
    );
  }

  resetPassword(email: string): Observable<void> {
    return from(
      this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
    ).pipe(
      map(() => void 0),
      catchError(error => {
        console.error('Reset password error:', error);
        this.snackBar.open(this.getErrorMessage(error), 'Close', {
          duration: AUTH_CONFIG.SNACKBAR_DURATIONS_MS.ERROR,
          panelClass: ['error-snackbar'],
        });
        throw error;
      })
    );
  }

  handleResetToken(fragment: string): Observable<void> {
    const hashParams = new URLSearchParams(fragment);
    const accessToken = hashParams.get('access_token');

    if (!accessToken) {
      throw new Error('No access token found');
    }

    return from(
      this.supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: hashParams.get('refresh_token') || '',
      })
    ).pipe(
      map(() => void 0),
      catchError(error => {
        console.error('Handle reset token error:', error);
        this.snackBar.open(this.getErrorMessage(error), 'Close', {
          duration: AUTH_CONFIG.SNACKBAR_DURATIONS_MS.ERROR,
          panelClass: ['error-snackbar'],
        });
        throw error;
      })
    );
  }

  updatePassword(newPassword: string): Observable<void> {
    return from(this.supabase.auth.updateUser({ password: newPassword })).pipe(
      map(() => void 0),
      catchError(error => {
        console.error('Update password error:', error);
        this.snackBar.open(this.getErrorMessage(error), 'Close', {
          duration: AUTH_CONFIG.SNACKBAR_DURATIONS_MS.ERROR,
          panelClass: ['error-snackbar'],
        });
        throw error;
      })
    );
  }

  private getErrorMessage(error: { message?: string }): string {
    if (error.message) {
      switch (error.message) {
        case 'Invalid login credentials':
          return 'Nieprawidłowy email lub hasło';
        case 'Email not confirmed':
          return 'Proszę potwierdzić adres email';
        case 'User already registered':
          return 'Email jest już zarejestrowany';
        case 'No access token found':
          return 'Nieprawidłowy link resetowania hasła';
        case 'JWT expired':
          return 'Link resetowania hasła wygasł';
        default:
          return error.message;
      }
    }
    return 'Wystąpił nieoczekiwany błąd';
  }
}
