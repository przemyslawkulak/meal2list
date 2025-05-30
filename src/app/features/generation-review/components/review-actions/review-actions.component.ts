import { Component, output, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-review-actions',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './review-actions.component.html',
  styleUrl: './review-actions.component.scss',
})
export class ReviewActionsComponent {
  // Inputs using new Angular 19 syntax
  hasValidItems = input.required<boolean>();
  isProcessing = input.required<boolean>();
  includedItemsCount = input.required<number>();

  // Outputs using new Angular 19 syntax
  backClick = output<void>();
  confirmClick = output<void>();

  onBackClick(): void {
    this.backClick.emit();
  }

  onConfirmClick(): void {
    this.confirmClick.emit();
  }
}
