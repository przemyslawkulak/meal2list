import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService, type ThemeMode } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
  template: `
    <button
      mat-icon-button
      [matMenuTriggerFor]="themeMenu"
      [matTooltip]="getTooltipText()"
      class="theme-toggle-button"
    >
      <mat-icon>{{ getThemeIcon() }}</mat-icon>
    </button>

    <mat-menu #themeMenu="matMenu">
      <button
        mat-menu-item
        (click)="setTheme('light')"
        [class.active]="themeService.themeMode() === 'light'"
      >
        <mat-icon>light_mode</mat-icon>
        <span>Light</span>
      </button>

      <button
        mat-menu-item
        (click)="setTheme('dark')"
        [class.active]="themeService.themeMode() === 'dark'"
      >
        <mat-icon>dark_mode</mat-icon>
        <span>Dark</span>
      </button>

      <button
        mat-menu-item
        (click)="setTheme('auto')"
        [class.active]="themeService.themeMode() === 'auto'"
      >
        <mat-icon>settings_brightness</mat-icon>
        <span>System</span>
      </button>
    </mat-menu>
  `,
  styles: [
    `
      .theme-toggle-button {
        color: var(--md-sys-color-on-surface);

        &:hover {
          background-color: var(--md-sys-color-surface-container-highest);
        }
      }

      ::ng-deep .mat-mdc-menu-item {
        &.active {
          background-color: var(--md-sys-color-primary-container);
          color: var(--md-sys-color-on-primary-container);

          .mat-icon {
            color: var(--md-sys-color-on-primary-container);
          }
        }

        .mat-icon {
          margin-right: 8px;
          color: var(--md-sys-color-on-surface-variant);
        }
      }
    `,
  ],
})
export class ThemeToggleComponent {
  protected readonly themeService = inject(ThemeService);

  setTheme(mode: ThemeMode): void {
    this.themeService.setThemeMode(mode);
  }

  getThemeIcon(): string {
    const mode = this.themeService.themeMode();
    const currentTheme = this.themeService.currentTheme();

    switch (mode) {
      case 'light':
        return 'light_mode';
      case 'dark':
        return 'dark_mode';
      case 'auto':
        return currentTheme === 'dark' ? 'dark_mode' : 'light_mode';
    }
  }

  getTooltipText(): string {
    const mode = this.themeService.themeMode();
    const currentTheme = this.themeService.currentTheme();

    switch (mode) {
      case 'light':
        return 'Theme: Light';
      case 'dark':
        return 'Theme: Dark';
      case 'auto':
        return `Theme: System (currently ${currentTheme})`;
    }
  }
}
