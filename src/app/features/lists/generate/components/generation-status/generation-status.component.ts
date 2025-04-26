import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { animate, style, transition, trigger } from '@angular/animations';
import { CreateShoppingListItemCommand } from '../../../../../../types';

@Component({
  selector: 'app-generation-status',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule, MatBadgeModule],
  templateUrl: './generation-status.component.html',
  styleUrls: ['./generation-status.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' })),
      ]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerationStatusComponent {
  status = input.required<'idle' | 'generating' | 'adding' | 'completed' | 'error'>();
  items = input.required<CreateShoppingListItemCommand[]>();
  errorMessage = input<string | null>();

  protected readonly statusMessages = {
    idle: '',
    generating: 'Analyzing recipe and generating items...',
    adding: 'Adding items to your shopping list...',
    completed: 'Items have been added to your list!',
    error: 'An error occurred',
  };
}
