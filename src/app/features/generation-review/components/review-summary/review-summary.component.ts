import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { GenerationReviewItemDto } from '../../../../../types';

@Component({
  selector: 'app-review-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card class="summary-card">
      <mat-card-content>
        <div class="summary-stats">
          <div class="stat">
            <mat-icon>shopping_cart</mat-icon>
            <span>{{ includedCount }} produktów do dodania</span>
          </div>
          <div class="stat">
            <mat-icon>remove_circle</mat-icon>
            <span>{{ excludedCount }} produktów wykluczonych</span>
          </div>
        </div>
        @if (errors().length > 0) {
          <div class="errors">
            <mat-icon color="warn">error</mat-icon>
            <ul>
              @for (error of errors(); track error) {
                <li>{{ error }}</li>
              }
            </ul>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .summary-card {
        margin-bottom: 16px;
      }

      .summary-stats {
        display: flex;
        gap: 24px;
        margin-bottom: 16px;
      }

      .stat {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .errors {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        color: #d32f2f;

        ul {
          margin: 0;
          padding-left: 16px;
        }
      }
    `,
  ],
})
export class ReviewSummaryComponent {
  items = input<GenerationReviewItemDto[]>([]);
  errors = input<string[]>([]);

  get includedCount(): number {
    return this.items().filter(item => !item.excluded).length;
  }

  get excludedCount(): number {
    return this.items().filter(item => item.excluded).length;
  }
}
