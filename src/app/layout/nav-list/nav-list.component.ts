import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavLink } from '@types';

@Component({
  selector: 'app-nav-list',
  standalone: true,
  imports: [MatListModule, MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './nav-list.component.html',
  styleUrls: ['./nav-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavListComponent {
  @Input({ required: true }) links!: NavLink[];
}
