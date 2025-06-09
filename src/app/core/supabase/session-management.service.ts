import { Injectable, signal, computed, effect, inject, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable, fromEvent, merge, timer, EMPTY, from } from 'rxjs';
import { throttleTime, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { AppEnvironment } from '@app/app.config';

// Session management configuration constants
const SESSION_CONFIG = {
  TIMEOUTS_MS: {
    WARNING_THRESHOLD: 5 * 60 * 1000, // 5 minutes
    ACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    REFRESH_THRESHOLD: 10 * 60 * 1000, // 10 minutes
    ACTIVITY_THROTTLE: 30 * 1000, // 30 seconds
    DEFAULT_SESSION_DURATION: 3600 * 1000, // 1 hour
    CHECK_INTERVAL: 60000, // 1 minute
    WARNING_AUTO_DISMISS: 2 * 60 * 1000, // 2 minutes
    INACTIVITY_GRACE_PERIOD: 30000, // 30 seconds
  },
  SNACKBAR_DURATIONS_MS: {
    SUCCESS: 3000,
    ERROR: 5000,
    WARNING: 5000,
  },
} as const;

interface SessionInfo {
  expiresAt: number;
  issuedAt: number;
  refreshToken: string;
  userId: string;
}

@Injectable({
  providedIn: 'root',
})
export class SessionManagementService extends SupabaseService {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  // Session state signals
  private readonly sessionInfo = signal<SessionInfo | null>(null);
  private readonly lastActivity = signal<number>(Date.now());
  private readonly isSessionWarningShown = signal<boolean>(false);
  private readonly autoRefreshEnabled = signal<boolean>(true);

  // Computed signals
  readonly sessionTimeRemaining = computed(() => {
    const session = this.sessionInfo();
    if (!session) return 0;
    return Math.max(0, session.expiresAt - Date.now());
  });

  readonly isSessionExpiringSoon = computed(() => {
    const timeRemaining = this.sessionTimeRemaining();
    return timeRemaining > 0 && timeRemaining < SESSION_CONFIG.TIMEOUTS_MS.WARNING_THRESHOLD;
  });

  readonly isSessionExpired = computed(() => {
    return this.sessionTimeRemaining() <= 0;
  });

  readonly sessionStatus = computed(() => {
    if (this.isSessionExpired()) return 'expired';
    if (this.isSessionExpiringSoon()) return 'expiring';
    return 'active';
  });

  // Configuration
  private readonly WARNING_THRESHOLD = SESSION_CONFIG.TIMEOUTS_MS.WARNING_THRESHOLD;
  private readonly ACTIVITY_TIMEOUT = SESSION_CONFIG.TIMEOUTS_MS.ACTIVITY_TIMEOUT;
  private readonly REFRESH_THRESHOLD = SESSION_CONFIG.TIMEOUTS_MS.REFRESH_THRESHOLD;
  private readonly ACTIVITY_THROTTLE = SESSION_CONFIG.TIMEOUTS_MS.ACTIVITY_THROTTLE;

  constructor(@Inject('APP_ENVIRONMENT') environment: AppEnvironment) {
    super(environment);
    this.initializeSessionManagement();
  }

  private initializeSessionManagement(): void {
    // Monitor session changes
    effect(() => {
      this.authService.currentUser$;
      this.updateSessionInfo();
    });

    // Monitor session expiration warnings
    effect(() => {
      if (this.isSessionExpiringSoon() && !this.isSessionWarningShown()) {
        this.showSessionWarning();
      }
    });

    // Monitor for expired sessions
    effect(() => {
      if (this.isSessionExpired() && this.sessionInfo()) {
        this.handleSessionExpiry();
      }
    });

    // Setup activity monitoring
    this.setupActivityMonitoring();

    // Setup automatic session refresh
    this.setupAutoRefresh();
  }

  private async updateSessionInfo(): Promise<void> {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

      if (error) {
        console.error('Failed to get session info:', error);
        this.sessionInfo.set(null);
        return;
      }

      if (session) {
        this.sessionInfo.set({
          expiresAt: session.expires_at
            ? session.expires_at * 1000
            : Date.now() + SESSION_CONFIG.TIMEOUTS_MS.DEFAULT_SESSION_DURATION,
          issuedAt: Date.now(), // Use current time as issued_at is not available in Supabase session
          refreshToken: session.refresh_token,
          userId: session.user.id,
        });
      } else {
        this.sessionInfo.set(null);
      }
    } catch (error) {
      console.error('Error updating session info:', error);
      this.sessionInfo.set(null);
    }
  }

  private setupActivityMonitoring(): void {
    // Monitor user activity
    const activityEvents = merge(
      fromEvent(document, 'mousedown'),
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keypress'),
      fromEvent(document, 'scroll'),
      fromEvent(document, 'touchstart'),
      fromEvent(document, 'click')
    );

    activityEvents
      .pipe(
        throttleTime(this.ACTIVITY_THROTTLE),
        tap(() => this.updateLastActivity())
      )
      .subscribe();

    // Check for inactivity
    timer(0, SESSION_CONFIG.TIMEOUTS_MS.CHECK_INTERVAL)
      .pipe(tap(() => this.checkForInactivity()))
      .subscribe();
  }

  private setupAutoRefresh(): void {
    timer(0, SESSION_CONFIG.TIMEOUTS_MS.CHECK_INTERVAL)
      .pipe(
        switchMap(() => {
          if (!this.autoRefreshEnabled() || !this.sessionInfo()) {
            return EMPTY;
          }

          const timeRemaining = this.sessionTimeRemaining();

          // Refresh if within threshold and not expired
          if (timeRemaining > 0 && timeRemaining < this.REFRESH_THRESHOLD) {
            return this.refreshSession();
          }

          return EMPTY;
        })
      )
      .subscribe();
  }

  private updateLastActivity(): void {
    this.lastActivity.set(Date.now());
  }

  private checkForInactivity(): void {
    const timeSinceActivity = Date.now() - this.lastActivity();

    if (timeSinceActivity > this.ACTIVITY_TIMEOUT && this.sessionInfo()) {
      this.handleInactivity();
    }
  }

  private showSessionWarning(): void {
    this.isSessionWarningShown.set(true);

    const timeRemaining = Math.ceil(this.sessionTimeRemaining() / 1000 / 60);

    const snackBarRef = this.snackBar.open(
      `Sesja wygaśnie za ${timeRemaining} minut. Czy chcesz przedłużyć?`,
      'Przedłuż',
      {
        duration: 0, // Don't auto-dismiss
        panelClass: ['warning-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top',
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.refreshSession().subscribe();
      this.isSessionWarningShown.set(false);
    });

    // Auto-dismiss warning after configured time
    timer(SESSION_CONFIG.TIMEOUTS_MS.WARNING_AUTO_DISMISS).subscribe(() => {
      snackBarRef.dismiss();
      this.isSessionWarningShown.set(false);
    });
  }

  private handleSessionExpiry(): void {
    this.snackBar.open('Sesja wygasła. Proszę zalogować się ponownie.', 'OK', {
      duration: SESSION_CONFIG.SNACKBAR_DURATIONS_MS.ERROR,
      panelClass: ['error-snackbar'],
    });

    this.authService.logout().subscribe();
  }

  private handleInactivity(): void {
    this.snackBar.open(
      'Wykryto długotrwałą nieaktywność. Zostaniesz wylogowany ze względów bezpieczeństwa.',
      'OK',
      {
        duration: SESSION_CONFIG.SNACKBAR_DURATIONS_MS.WARNING,
        panelClass: ['warning-snackbar'],
      }
    );

    // Give user configured grace period to react before logging out
    timer(SESSION_CONFIG.TIMEOUTS_MS.INACTIVITY_GRACE_PERIOD).subscribe(() => {
      if (Date.now() - this.lastActivity() > this.ACTIVITY_TIMEOUT) {
        this.authService.logout().subscribe();
      }
    });
  }

  refreshSession(): Observable<boolean> {
    const session = this.sessionInfo();
    if (!session) {
      return from(Promise.resolve(false));
    }

    return from(this.supabase.auth.refreshSession({ refresh_token: session.refreshToken })).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Failed to refresh session:', error);
          return false;
        }

        if (data.session) {
          this.updateSessionInfo();
          this.snackBar.open('Sesja została przedłużona', 'OK', {
            duration: SESSION_CONFIG.SNACKBAR_DURATIONS_MS.SUCCESS,
          });
          return true;
        }

        return false;
      })
    );
  }

  enableAutoRefresh(): void {
    this.autoRefreshEnabled.set(true);
  }

  disableAutoRefresh(): void {
    this.autoRefreshEnabled.set(false);
  }

  getSessionInfo(): SessionInfo | null {
    return this.sessionInfo();
  }

  forceSessionCheck(): void {
    this.updateSessionInfo();
  }
}
