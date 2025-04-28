import {
  Component,
  ChangeDetectionStrategy,
  ContentChild,
  TemplateRef,
  AfterContentInit,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule, MatCardAppearance } from '@angular/material/card';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent implements AfterContentInit {
  /**
   * Specifies the Material card appearance style.
   */
  appearance = input<MatCardAppearance>('outlined');

  /**
   * Optional title for the card, used if `[card-title]` is not projected.
   */
  cardTitle = input('');

  /**
   * Optional subtitle for the card, used if `[card-subtitle]` is not projected.
   */
  cardSubtitle = input('');

  /**
   * Controls the visibility of the header section.
   */
  showHeader = input(true);

  /**
   * Controls the visibility of the actions section.
   */
  showActions = input(true);

  /**
   * Controls the alignment of actions ('start' or 'end').
   */
  actionsAlign = input<'start' | 'end'>('start');

  /**
   * Controls the visibility of the footer section.
   */
  showFooter = input(false);

  // Check if content is projected for specific slots
  @ContentChild('[card-title]') projectedTitle?: TemplateRef<unknown>;
  @ContentChild('[card-subtitle]') projectedSubtitle?: TemplateRef<unknown>;

  hasProjectedTitle = false;
  hasProjectedSubtitle = false;

  ngAfterContentInit(): void {
    this.hasProjectedTitle = !!this.projectedTitle;
    this.hasProjectedSubtitle = !!this.projectedSubtitle;
  }
}
