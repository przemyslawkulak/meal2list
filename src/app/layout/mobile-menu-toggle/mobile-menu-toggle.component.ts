import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-mobile-menu-toggle',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './mobile-menu-toggle.component.html',
  styleUrls: ['./mobile-menu-toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileMenuToggleComponent {
  menuToggled = output<void>();
}
