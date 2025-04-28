import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ContentChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, MatListModule, MatRippleModule],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent<T> {
  // Generic type T for items array
  /**
   * Optional array of data items to render in the list.
   * Requires `itemTemplate` to be provided for rendering.
   */
  @Input() items?: T[];

  /**
   * Whether the list should use dense styling.
   */
  @Input() dense: boolean = false;

  /**
   * TemplateRef used to render each item when the `items` input is provided.
   * The template context will contain `$implicit` (the item) and `index`.
   */
  @ContentChild(TemplateRef) itemTemplate?: TemplateRef<unknown>;
}
