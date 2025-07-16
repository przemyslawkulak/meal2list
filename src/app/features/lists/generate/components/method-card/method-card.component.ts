import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface MethodOption {
  id: 'text' | 'scraping' | 'image';
  title: string;
  description: string;
  icon: string;
  ariaLabel: string;
}

@Component({
  selector: 'app-method-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './method-card.component.html',
  styleUrls: ['./method-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MethodCardComponent {
  method = input.required<MethodOption>();
  isActive = input<boolean>(false);
  disabled = input<boolean>(false);

  selected = output<string>();

  onSelect(): void {
    if (this.disabled()) {
      return;
    }
    this.selected.emit(this.method().id);
  }
}
