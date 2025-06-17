import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'app-theme-mode';

  // Theme mode signal
  private readonly _themeMode = signal<ThemeMode>(this.getStoredThemeMode());

  // Current effective theme signal (computed based on system preference when auto)
  private readonly _currentTheme = signal<'light' | 'dark'>('light');

  // Public readonly signals
  readonly themeMode = this._themeMode.asReadonly();
  readonly currentTheme = this._currentTheme.asReadonly();

  constructor() {
    // Effect to handle theme changes
    effect(() => {
      this.applyTheme(this._themeMode());
    });

    // Listen for system theme changes
    this.setupSystemThemeListener();

    // Initialize theme
    this.applyTheme(this._themeMode());
  }

  /**
   * Set the theme mode
   */
  setThemeMode(mode: ThemeMode): void {
    this._themeMode.set(mode);
    this.storeThemeMode(mode);
  }

  /**
   * Get CSS custom property value for current theme
   */
  getCssCustomProperty(property: string): string {
    return getComputedStyle(this.document.documentElement).getPropertyValue(property).trim();
  }

  /**
   * Get Material Design 3 system color
   */
  getMd3Color(colorName: string): string {
    return this.getCssCustomProperty(`--md-sys-color-${colorName}`);
  }

  private applyTheme(mode: ThemeMode): void {
    const body = this.document.body;
    const html = this.document.documentElement;

    // Remove existing theme classes
    body.classList.remove('light-theme', 'dark-theme');

    let effectiveTheme: 'light' | 'dark';

    if (mode === 'auto') {
      // Use system preference
      effectiveTheme = this.getSystemThemePreference();
      // Don't add manual theme classes, let CSS media queries handle it
    } else {
      // Use manual theme
      effectiveTheme = mode;
      body.classList.add(`${mode}-theme`);
    }

    // Update current theme signal
    this._currentTheme.set(effectiveTheme);

    // Set color-scheme for better browser integration
    html.style.colorScheme = mode === 'auto' ? 'light dark' : effectiveTheme;

    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(effectiveTheme);
  }

  private getSystemThemePreference(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  private setupSystemThemeListener(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      mediaQuery.addEventListener('change', () => {
        if (this._themeMode() === 'auto') {
          const newTheme = this.getSystemThemePreference();
          this._currentTheme.set(newTheme);
          this.updateMetaThemeColor(newTheme);
        }
      });
    }
  }

  private updateMetaThemeColor(theme: 'light' | 'dark'): void {
    // Update after a brief delay to ensure CSS has been applied
    setTimeout(() => {
      const metaThemeColor = this.document.querySelector(
        'meta[name="theme-color"]'
      ) as HTMLMetaElement;
      if (metaThemeColor) {
        const backgroundColor =
          theme === 'dark'
            ? this.getMd3Color('surface-container-low')
            : this.getMd3Color('surface-container-low');
        metaThemeColor.setAttribute('content', backgroundColor || '#ffffff');
      }
    }, 10);
  }

  private getStoredThemeMode(): ThemeMode {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(this.storageKey);
      if (stored === 'light' || stored === 'dark' || stored === 'auto') {
        return stored as ThemeMode;
      }
    }
    return 'auto'; // Default to auto
  }

  private storeThemeMode(mode: ThemeMode): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.storageKey, mode);
    }
  }
}
