import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-character-counter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './character-counter.component.html',
  styleUrls: ['./character-counter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterCounterComponent {
  length = input.required<number>();
  max = input.required<number>();
}
