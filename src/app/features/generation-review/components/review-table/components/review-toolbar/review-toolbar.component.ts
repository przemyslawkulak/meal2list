import { Component, Output, EventEmitter, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SortField, SortDirection } from '../../services/review-data.service';

export type ViewMode = 'table' | 'grouped';

@Component({
  selector: 'app-review-toolbar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatButtonToggleModule, MatTooltipModule],
  templateUrl: './review-toolbar.component.html',
  styleUrl: './review-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewToolbarComponent {
  viewMode = input<ViewMode>('table');
  sortField = input<SortField>('product_name');
  sortDirection = input<SortDirection>('asc');

  @Output() viewModeChange = new EventEmitter<ViewMode>();
  @Output() sortFieldChange = new EventEmitter<SortField>();

  onViewModeChange(value: ViewMode): void {
    this.viewModeChange.emit(value);
  }

  onSortFieldChange(field: SortField): void {
    this.sortFieldChange.emit(field);
  }

  getSortIcon(field: SortField): string {
    if (this.sortField() !== field) return 'unfold_more';
    return this.sortDirection() === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
  }
}
