import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { CategoryService } from '@core/supabase/category.service';
import { AuthService } from '@core/supabase/auth.service';
import { NavListComponent } from '@app/layout/nav-list/nav-list.component';
import { NavLink } from '@types';
import { MatTabsModule } from '@angular/material/tabs';
import { OfflineBannerComponent } from '@app/shared/ui/offline-banner/offline-banner.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    OfflineBannerComponent,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AsyncPipe,
    NavListComponent,
    MatTabsModule,
  ],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent implements OnInit {
  private readonly _breakpointObserver = inject(BreakpointObserver);
  private readonly _categoryService = inject(CategoryService);
  private readonly _authService = inject(AuthService);

  readonly isWeb$: Observable<boolean> = this._breakpointObserver
    .observe([Breakpoints.Large, Breakpoints.XLarge])
    .pipe(
      map(result => result.matches),
      shareReplay(1)
    );

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

  readonly sidenavMode$: Observable<'over' | 'side' | 'push'> = this.isWeb$.pipe(
    map(isWeb => (isWeb ? 'over' : 'over'))
  );

  readonly sidenavClosed$ = this.isTabletOrMobile$;

  readonly categories$ = this._categoryService.categories$;
  readonly currentUser$ = this._authService.currentUser$;
  readonly isAuthenticated$ = this._authService.isAuthenticated$;

  readonly navigationLinks: NavLink[] = [
    { label: 'Listy zakupowe', path: '/lists', icon: 'view_list' },
    { label: 'Generuj listę', path: '/generate', icon: 'auto_fix_high' },
    { label: 'Kategorie', path: '/categories', icon: 'widgets' },
    { label: 'Ustawienia', path: '/settings', icon: 'settings' },
  ];

  readonly desktopNavigationLinks: NavLink[] = [
    { label: 'Listy zakupowe', path: '/lists', icon: 'view_list' },
    { label: 'Generuj listę', path: '/generate', icon: 'auto_fix_high' },
    { label: 'Kategorie', path: '/categories', icon: 'widgets' },
  ];

  ngOnInit(): void {
    this._categoryService.preload();
  }

  onLogout(): void {
    this._authService.logout().subscribe();
  }
}
