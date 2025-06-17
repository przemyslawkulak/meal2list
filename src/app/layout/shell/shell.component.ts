import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthService } from '@core/supabase/auth.service';

import { NavLink } from '@types';
import { MatTabsModule } from '@angular/material/tabs';
import { OfflineBannerComponent } from '@app/shared/ui/offline-banner/offline-banner.component';
import { ThemeToggleComponent } from '@app/shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    OfflineBannerComponent,
    ThemeToggleComponent,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AsyncPipe,

    MatTabsModule,
  ],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly _breakpointObserver = inject(BreakpointObserver);
  private readonly _authService = inject(AuthService);

  readonly isTabletOrMobile$: Observable<boolean> = this._breakpointObserver
    .observe([
      Breakpoints.Small,
      Breakpoints.XSmall,
      Breakpoints.Medium,
      Breakpoints.HandsetLandscape,
      Breakpoints.HandsetPortrait,
      Breakpoints.TabletLandscape,
      Breakpoints.TabletPortrait,
    ])
    .pipe(
      map(result => result.matches),
      shareReplay(1)
    );

  readonly isAuthenticated$ = this._authService.isAuthenticated$;

  readonly navigationLinks: NavLink[] = [
    { label: 'Listy', path: '/lists', icon: 'list_alt' },
    { label: 'Generuj', path: '/generate', icon: 'add_circle' },
    { label: 'Kategorie', path: '/categories', icon: 'category' },
  ];

  onLogout(): void {
    this._authService.logout().subscribe();
  }
}
