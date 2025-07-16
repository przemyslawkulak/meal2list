import { Injectable, Inject } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SupabaseService } from '../../supabase/supabase.service';
import { AppEnvironment } from '@app/app.config';
import { LoggerService } from '@app/shared/services/logger.service';
import { NotificationService } from '@app/shared/services/notification.service';
import {
  LimitStatus,
  UsageIncrement,
  UsageHistory,
  UserLimit,
  UserLimitInsert,
  UserLimitUpdate,
  MonthPeriod,
  LimitExceededError,
  UserLimitServiceError,
  IncrementUsageResult,
  LimitEventType,
  LimitEventMetadata,
} from './user-limit.models';

@Injectable({
  providedIn: 'root',
})
export class UserLimitService extends SupabaseService {
  private readonly DEFAULT_MONTHLY_LIMIT = 50;

  constructor(
    @Inject('APP_ENVIRONMENT') environment: AppEnvironment,
    private loggerService: LoggerService,
    private notificationService: NotificationService
  ) {
    super(environment);
  }

  // Public methods

  /**
   * Sprawdza aktualny status limitu użytkownika
   */
  checkUserLimit(userId: string): Observable<LimitStatus> {
    if (!userId) {
      return throwError(() => new Error('User ID is required'));
    }

    return from(this.supabase.from('user_limits').select('*').eq('user_id', userId).single()).pipe(
      switchMap(result => {
        if (result.error) {
          // User doesn't have a limit record yet, create one
          if (result.error.code === 'PGRST116') {
            return this.createUserLimit(userId);
          }
          throw result.error;
        }
        return of(result.data);
      }),
      switchMap(userLimit => this.resetLimitIfNeeded(userLimit)),
      map(userLimit => {
        const resetDate = new Date(userLimit.reset_date);
        const canProcess = userLimit.current_usage < userLimit.monthly_limit;
        const remainingGenerations = Math.max(0, userLimit.monthly_limit - userLimit.current_usage);

        const limitStatus: LimitStatus = {
          hasLimit: true,
          currentUsage: userLimit.current_usage,
          monthlyLimit: userLimit.monthly_limit,
          resetDate,
          canProcess,
          remainingGenerations,
        };

        this.logUsageEvent(userId, 'check', {
          currentUsage: userLimit.current_usage,
          monthlyLimit: userLimit.monthly_limit,
          canProcess,
          remainingGenerations,
        });

        return limitStatus;
      }),
      catchError(error => this.handleDatabaseError(error, 'check user limit'))
    );
  }

  /**
   * Zwiększa licznik wykorzystania o 1 po udanym przetworzeniu przepisu
   */
  incrementUsage(userId: string): Observable<UsageIncrement> {
    if (!userId) {
      return throwError(() => new Error('User ID is required'));
    }

    return this.incrementUsageAtomic(userId).pipe(
      map(result => {
        const resetDate = new Date(result.reset_date);
        const usageIncrement: UsageIncrement = {
          newUsage: result.new_usage,
          limitReached: result.limit_reached,
          resetDate,
        };

        this.logUsageEvent(userId, 'increment', {
          newUsage: result.new_usage,
          monthlyLimit: result.monthly_limit,
          limitReached: result.limit_reached,
          resetDate,
        });

        // Show warning if limit is reached
        if (result.limit_reached) {
          this.notificationService.showWarning(
            `You have reached your monthly generation limit of ${result.monthly_limit}. Limit will reset on ${resetDate.toLocaleDateString()}.`
          );
        } else if (result.new_usage >= result.monthly_limit * 0.8) {
          // Show warning when 80% of limit is reached
          const remaining = result.monthly_limit - result.new_usage;
          this.notificationService.showWarning(
            `You have ${remaining} generations remaining this month.`
          );
        }

        return usageIncrement;
      }),
      catchError(error => this.handleDatabaseError(error, 'increment usage'))
    );
  }

  /**
   * Pobiera historię wykorzystania dla użytkownika
   */
  getUserUsageHistory(userId: string, months: number = 12): Observable<UsageHistory[]> {
    if (!userId) {
      return throwError(() => new Error('User ID is required'));
    }

    if (months < 1 || months > 24) {
      return throwError(() => new Error('Months parameter must be between 1 and 24'));
    }

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    return from(
      this.supabase
        .from('usage_history')
        .select('*')
        .eq('user_id', userId)
        .gte('period_start', cutoffDate.toISOString())
        .order('period_start', { ascending: false })
    ).pipe(
      map(result => {
        if (result.error) {
          throw result.error;
        }

        this.logUsageEvent(userId, 'check', {
          action: 'get_usage_history',
          months,
          recordCount: result.data.length,
        });

        return result.data;
      }),
      catchError(error => this.handleDatabaseError(error, 'get usage history'))
    );
  }

  // Private methods

  /**
   * Tworzy nowy rekord limitu dla użytkownika przy pierwszym użyciu
   */
  private createUserLimit(userId: string): Observable<UserLimit> {
    const { end } = this.getCurrentMonthPeriod();
    const resetDate = end.toISOString();

    const newLimit: UserLimitInsert = {
      user_id: userId,
      monthly_limit: this.DEFAULT_MONTHLY_LIMIT,
      current_usage: 0,
      reset_date: resetDate,
    };

    return from(this.supabase.from('user_limits').insert(newLimit).select().single()).pipe(
      map(result => {
        if (result.error) {
          throw result.error;
        }
        this.logUsageEvent(userId, 'reset', {
          action: 'create_new_limit',
          monthlyLimit: this.DEFAULT_MONTHLY_LIMIT,
        });
        return result.data;
      }),
      catchError(error => this.handleDatabaseError(error, 'create user limit'))
    );
  }

  /**
   * Oblicza okres bieżącego miesiąca dla resetowania limitów
   */
  private getCurrentMonthPeriod(): MonthPeriod {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end };
  }

  /**
   * Sprawdza czy limit powinien zostać zresetowany
   */
  private shouldResetLimit(lastReset: Date): boolean {
    const now = new Date();
    const resetDate = new Date(lastReset);
    return now >= resetDate;
  }

  /**
   * Resetuje limit jeśli minął miesiąc od ostatniego resetu
   */
  private resetLimitIfNeeded(userLimit: UserLimit): Observable<UserLimit> {
    if (!this.shouldResetLimit(new Date(userLimit.reset_date))) {
      return of(userLimit);
    }

    const { end } = this.getCurrentMonthPeriod();
    const newResetDate = end.toISOString();

    const updateData: UserLimitUpdate = {
      current_usage: 0,
      reset_date: newResetDate,
    };

    return from(
      this.supabase
        .from('user_limits')
        .update(updateData)
        .eq('user_id', userLimit.user_id)
        .select()
        .single()
    ).pipe(
      map(result => {
        if (result.error) {
          throw result.error;
        }
        this.logUsageEvent(userLimit.user_id, 'reset', {
          action: 'monthly_reset',
          previousUsage: userLimit.current_usage,
          newUsage: 0,
          resetDate: new Date(newResetDate),
        });
        return result.data;
      }),
      catchError(error => this.handleDatabaseError(error, 'reset user limit'))
    );
  }

  /**
   * Loguje wydarzenia związane z wykorzystaniem limitów
   */
  private logUsageEvent(
    userId: string,
    eventType: LimitEventType,
    metadata?: Partial<LimitEventMetadata>
  ): void {
    const eventMetadata: LimitEventMetadata = {
      userId,
      eventType,
      timestamp: new Date(),
      ...metadata,
    };

    this.loggerService.logInfo(`User limit event: ${eventType}`, JSON.stringify(eventMetadata));
  }

  /**
   * Obsługuje błąd przekroczenia limitu
   */
  private handleLimitExceeded(userId: string, limit: UserLimit): Observable<never> {
    const error: LimitExceededError = {
      code: 'LIMIT_EXCEEDED',
      message: `Monthly generation limit of ${limit.monthly_limit} exceeded`,
      resetDate: new Date(limit.reset_date),
      currentUsage: limit.current_usage,
      monthlyLimit: limit.monthly_limit,
    };

    this.logUsageEvent(userId, 'exceeded', {
      currentUsage: limit.current_usage,
      monthlyLimit: limit.monthly_limit,
    });
    this.notificationService.showError(error.message);

    return throwError(() => error);
  }

  /**
   * Waliduje wartość limitu
   */
  private validateLimitValue(limit: number): boolean {
    return limit >= 0 && limit <= 1000;
  }

  /**
   * Obsługuje błędy bazy danych
   */
  private handleDatabaseError(error: Error | unknown, operation: string): Observable<never> {
    this.loggerService.logError(error, `Database error during ${operation}`);

    const userLimitError: UserLimitServiceError = {
      code: 'DATABASE_CONNECTION_ERROR',
      message: `Database operation failed: ${operation}`,
      originalError: error,
    };

    return throwError(() => userLimitError);
  }

  /**
   * Używa funkcji bazy danych do atomowego zwiększenia użycia
   */
  private incrementUsageAtomic(userId: string): Observable<IncrementUsageResult> {
    return from(this.supabase.rpc('increment_user_usage', { user_uuid: userId })).pipe(
      map(result => {
        if (result.error) {
          throw result.error;
        }
        if (!result.data || result.data.length === 0) {
          throw new Error('No data returned from increment_user_usage function');
        }
        return result.data[0];
      }),
      catchError(error => this.handleDatabaseError(error, 'increment usage atomic'))
    );
  }
}
