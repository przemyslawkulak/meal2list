import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { CategoryService } from '@core/supabase/category.service';
import { AuthService } from '@core/supabase/auth.service';
import { NavListComponent } from '@app/layout/nav-list/nav-list.component';
import { MobileMenuToggleComponent } from '@app/layout/mobile-menu-toggle/mobile-menu-toggle.component';
import { NavLink } from '@types';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    RouterOutlet,
    AsyncPipe,
    NavListComponent,
    MobileMenuToggleComponent,
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
      Breakpoints.Medium,
      Breakpoints.HandsetLandscape,
      Breakpoints.HandsetPortrait,
    ])
    .pipe(
      map(result => result.matches),
      shareReplay(1)
    );

  readonly sidenavMode$: Observable<'over' | 'side'> = this.isWeb$.pipe(
    map(isWeb => (isWeb ? 'side' : 'over'))
  );

  readonly sidenavClosed$ = this.isTabletOrMobile$;

  readonly categories$ = this._categoryService.categories$;
  readonly currentUser$ = this._authService.currentUser$;
  readonly isAuthenticated$ = this._authService.isAuthenticated$;

  readonly navigationLinks: NavLink[] = [
    { label: 'Listy zakupowe', path: '/lists', icon: 'list' },
    { label: 'Generuj listę', path: '/generate', icon: 'add_shopping_cart' },
    { label: 'Kategorie', path: '/categories', icon: 'category' },
    // { label: 'Kitchen Sink', path: '/kitchen-sink', icon: 'kitchen' },
  ];

  ngOnInit(): void {
    this._categoryService.preload();
  }

  onLogout(): void {
    this._authService.logout().subscribe();
  }
}
