import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, map } from 'rxjs';
import { NavLink } from '@types';

@Component({
  selector: 'app-nav-list',
  standalone: true,
  imports: [MatListModule, MatIconModule, RouterLink, RouterLinkActive, AsyncPipe],
  templateUrl: './nav-list.component.html',
  styleUrls: ['./nav-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavListComponent {
  @Input({ required: true }) links!: NavLink[];

  private breakpointObserver = inject(BreakpointObserver);

  isDesktop$: Observable<boolean> = this.breakpointObserver
    .observe([Breakpoints.Desktop, Breakpoints.Large, Breakpoints.XLarge])
    .pipe(map(result => result.matches));
}
