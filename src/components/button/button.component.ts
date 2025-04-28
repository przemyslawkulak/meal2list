import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ThemePalette } from '@angular/material/core';

@Component({
  selector: 'app-button', // Prefixing with 'app-' is a common convention
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  /**
   * Specifies the Material theme color palette for the button.
   */
  @Input() color: ThemePalette = 'primary';

  /**
   * Whether the button is disabled.
   */
  @Input() disabled: boolean = false;

  /**
   * Event emitter for button click events.
   */
  @Output() buttonClick = new EventEmitter<MouseEvent>();

  /**
   * Handles the click event and emits it.
   * @param event The mouse event.
   */
  onClick(event: MouseEvent): void {
    if (!this.disabled) {
      this.buttonClick.emit(event);
    }
  }
}
