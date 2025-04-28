import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ContentChild,
  TemplateRef,
  AfterContentInit,
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
  @Input() appearance: MatCardAppearance = 'outlined'; // or 'raised'

  /**
   * Optional title for the card, used if `[card-title]` is not projected.
   */
  @Input() cardTitle: string = '';

  /**
   * Optional subtitle for the card, used if `[card-subtitle]` is not projected.
   */
  @Input() cardSubtitle: string = '';

  /**
   * Controls the visibility of the header section.
   */
  @Input() showHeader: boolean = true;

  /**
   * Controls the visibility of the actions section.
   */
  @Input() showActions: boolean = true;

  /**
   * Controls the alignment of actions ('start' or 'end').
   */
  @Input() actionsAlign: 'start' | 'end' = 'start';

  /**
   * Controls the visibility of the footer section.
   */
  @Input() showFooter: boolean = false;
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
