import { Component, Input, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, catchError, of } from 'rxjs';
import { UserLimitService, LimitStatus } from '@core/services/user-limit';
import { SupabaseService } from '@core/supabase/supabase.service';

@Component({
  selector: 'app-limit-status',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule, MatIconModule, MatTooltipModule, DatePipe],
  template: `
    <div class="limit-status-container" *ngIf="limitStatus()">
      <div class="limit-header">
        <mat-icon class="limit-icon">{{ getLimitIcon() }}</mat-icon>
        <span class="limit-title">Miesięczny limit generacji</span>
      </div>

      <div class="limit-progress">
        <mat-progress-bar
          [value]="getProgressValue()"
          [color]="getProgressColor()"
          [matTooltip]="getTooltipText()"
        >
        </mat-progress-bar>

        <div class="limit-text">
          <span class="usage-text">
            {{ limitStatus()?.currentUsage }} / {{ limitStatus()?.monthlyLimit }} wykorzystane
          </span>
          <span class="remaining-text" [class.warning]="isWarningLevel()">
            {{ limitStatus()?.remainingGenerations }} pozostało
          </span>
        </div>
      </div>

      <div class="reset-info">
        <small class="reset-text">
          <mat-icon class="reset-icon">schedule</mat-icon>
          Odnawia się {{ limitStatus()?.resetDate | date: 'd MMM y' : '' : 'pl-PL' }}
        </small>
      </div>
    </div>
  `,
  styleUrls: ['./limit-status.component.scss'],
})
export class LimitStatusComponent implements OnInit, OnDestroy {
  @Input() userId?: string;
  @Input() showDetails: boolean = true;
  @Input() compact: boolean = false;

  limitStatus = signal<LimitStatus | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  private destroy$ = new Subject<void>();

  // Computed values
  progressValue = computed(() => {
    const status = this.limitStatus();
    if (!status) return 0;
    return (status.currentUsage / status.monthlyLimit) * 100;
  });

  canProcess = computed(() => this.limitStatus()?.canProcess ?? false);
  isWarningLevel = computed(() => this.progressValue() >= 80);
  isLimitReached = computed(() => this.progressValue() >= 100);

  constructor(
    private userLimitService: UserLimitService,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit(): void {
    this.loadLimitStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLimitStatus(): void {
    this.loading.set(true);
    this.error.set(null);

    const userId$ = this.userId ? of(this.userId) : this.supabaseService.getUserId();

    userId$
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => {
          this.error.set('Nie udało się pobrać informacji o użytkowniku');
          return of(null);
        })
      )
      .subscribe(userId => {
        if (!userId) {
          this.loading.set(false);
          return;
        }

        this.userLimitService
          .checkUserLimit(userId)
          .pipe(
            takeUntil(this.destroy$),
            catchError(() => {
              this.error.set('Nie udało się załadować statusu limitów');
              return of(null);
            })
          )
          .subscribe(status => {
            this.limitStatus.set(status);
            this.loading.set(false);
          });
      });
  }

  getProgressValue(): number {
    return this.progressValue();
  }

  getProgressColor(): 'primary' | 'accent' | 'warn' {
    if (this.isLimitReached()) return 'warn';
    if (this.isWarningLevel()) return 'accent';
    return 'primary';
  }

  getLimitIcon(): string {
    if (this.isLimitReached()) return 'block';
    if (this.isWarningLevel()) return 'warning';
    return 'check_circle';
  }

  getTooltipText(): string {
    const status = this.limitStatus();
    if (!status) return '';

    if (status.remainingGenerations === 0) {
      return `Osiągnięto miesięczny limit. Odnawia się ${status.resetDate.toLocaleDateString('pl-PL')}`;
    }

    if (this.isWarningLevel()) {
      return `Ostrzeżenie: Pozostało tylko ${status.remainingGenerations} generacji w tym miesiącu`;
    }

    return `${status.remainingGenerations} generacji pozostało w tym miesiącu`;
  }

  refreshStatus(): void {
    this.loadLimitStatus();
  }
}
