import { Injectable, Inject, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { tap, map, catchError, switchMap } from 'rxjs/operators';
import { User, AuthResponse } from '@supabase/supabase-js';
import { AppEnvironment } from '@app/app.config';
import { SupabaseService } from './supabase.service';
import { ProductsStore } from '../stores/products/products.store';
import { CategoriesStore } from '../stores/categories/categories.store';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService extends SupabaseService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));
  private readonly productsStore = inject(ProductsStore);
  private readonly categoriesStore = inject(CategoriesStore);

  constructor(
    @Inject('APP_ENVIRONMENT') environment: AppEnvironment,
    private router: Router
  ) {
    super(environment);
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Check for existing session
      const {
        data: { session },
        error: sessionError,
      } = await this.supabase.auth.getSession();

      if (sessionError) throw sessionError;

      // Update current user state
      this.currentUserSubject.next(session?.user ?? null);

      // If user is already authenticated (auto-auth), load data
      if (session?.user) {
        this.logger.logInfo('🔄 User auto-authenticated, loading data');
        this.categoriesStore.checkAndLoadCategories();
        this.productsStore.checkAndLoadProducts();
      }

      // Setup auth state change subscription
      this.supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          this.currentUserSubject.next(session?.user ?? null);
        } else if (event === 'SIGNED_OUT') {
          this.currentUserSubject.next(null);
          await this.router.navigate(['/']);
        } else if (event === 'USER_UPDATED') {
          this.currentUserSubject.next(session?.user ?? null);
        }
      });
    } catch (error) {
      this.logger.logError(error as HttpErrorResponse, 'Error initializing auth');
      this.currentUserSubject.next(null);
    }
  }

  validateSession(): Observable<boolean> {
    return from(this.supabase.auth.getSession()).pipe(
      switchMap(({ data: { session }, error }) => {
        if (error) {
          this.currentUserSubject.next(null);
          return of(false);
        }

        if (!session) {
          this.currentUserSubject.next(null);
          return of(false);
        }

        // Session exists; no manual expiration re-check needed
        this.currentUserSubject.next(session.user);
        return of(true);
      }),
      catchError(error => {
        this.logger.logError(error, 'Error validating session');
        this.notification.showError('Failed to validate session');
        this.currentUserSubject.next(null);
        return of(false);
      })
    );
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
        this.logger.logError(error, 'Registration error');
        this.notification.showError(this.getErrorMessage(error));
        throw error;
      })
    );
  }

  login(email: string, password: string, returnUrl?: string): Observable<User> {
    return from(this.signInWithPassword(email, password)).pipe(
      switchMap((response: AuthResponse) => {
        if (response.error) throw response.error;
        const user = response.data.user;
        if (!user) throw new Error('No user returned from auth response');
        this.currentUserSubject.next(user);
        this.notification.showSuccess('Zalogowano pomyślnie');

        // Load both categories and products after successful login
        this.categoriesStore.checkAndLoadCategories();
        this.productsStore.checkAndLoadProducts();

        const target = returnUrl && returnUrl !== '/auth/login' ? returnUrl : '/app/lists';
        return from(this.router.navigateByUrl(target)).pipe(map(() => user));
      }),
      catchError(error => {
        this.logger.logError(error, 'Login error');
        this.notification.showError(this.getErrorMessage(error));
        throw error;
      })
    );
  }

  logout(): Observable<void> {
    return from(this.signOut()).pipe(
      map(() => void 0),
      tap(() => {
        this.currentUserSubject.next(null);
        // Reset stores on logout
        this.categoriesStore.reset();
        this.productsStore.reset();
        this.router.navigate(['/']);
      }),
      catchError(error => {
        this.logger.logError(error, 'Logout error');
        this.notification.showError('Failed to logout');
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
        this.logger.logError(error, 'Reset password error');
        this.notification.showError(this.getErrorMessage(error));
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
        this.logger.logError(error, 'Handle reset token error');
        this.notification.showError(this.getErrorMessage(error));
        throw error;
      })
    );
  }

  updatePassword(newPassword: string): Observable<void> {
    return from(this.supabase.auth.updateUser({ password: newPassword })).pipe(
      map(() => void 0),
      catchError(error => {
        this.logger.logError(error, 'Update password error');
        this.notification.showError(this.getErrorMessage(error));
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
