import { Injectable, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { User, AuthResponse } from '@supabase/supabase-js';
import { AppEnvironment } from '@app/app.config';
import { SupabaseService } from './supabase.service';

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

      // If we have a session, navigate to lists
      if (session?.user) {
        this.router.navigate(['/lists']);
      }

      // Setup auth state change subscription
      this.supabase.auth.onAuthStateChange((event, session) => {
        this.currentUserSubject.next(session?.user ?? null);

        if (event === 'SIGNED_OUT') {
          this.router.navigate(['/auth/login']);
        }
      });
    });
  }

  login(email: string, password: string): Observable<User> {
    return from(this.signInWithPassword(email, password)).pipe(
      map((response: AuthResponse) => {
        if (response.error) throw response.error;

        const user = response.data.user;
        if (!user) throw new Error('No user returned from auth response');

        this.currentUserSubject.next(user);

        return user;
      }),
      tap(() => {
        this.snackBar.open('Logged in successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/lists']);
      }),
      catchError(error => {
        console.error('Login error:', error);
        this.snackBar.open(this.getErrorMessage(error), 'Close', {
          duration: 5000,
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

  private getErrorMessage(error: { message?: string }): string {
    if (error.message) {
      switch (error.message) {
        case 'Invalid login credentials':
          return 'Invalid email or password';
        case 'Email not confirmed':
          return 'Please confirm your email address';
        default:
          return error.message;
      }
    }
    return 'An unexpected error occurred';
  }
}
