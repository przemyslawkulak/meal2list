import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-overlay',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayComponent {
  isVisible = input<boolean>(false);
  showCloseButton = input<boolean>(false);
  backdropClick = input<boolean>(true); // Allow clicking backdrop to close

  closeOverlay = output<void>();

  onBackdropClick(): void {
    if (this.backdropClick()) {
      this.closeOverlay.emit();
    }
  }

  onBackdropKeydown(event: KeyboardEvent): void {
    if ((event.key === 'Enter' || event.key === ' ') && this.backdropClick()) {
      event.preventDefault();
      this.closeOverlay.emit();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeOverlay.emit();
    }
  }

  onCloseClick(): void {
    this.closeOverlay.emit();
  }

  onContentClick(event: Event): void {
    // Prevent backdrop click when clicking on content
    event.stopPropagation();
  }

  onContentKeydown(event: KeyboardEvent): void {
    // Prevent backdrop keydown when focusing on content
    event.stopPropagation();

    // Allow Escape key to close overlay
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeOverlay.emit();
    }
  }
}
