import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { ShoppingListResponseDto } from '../../../../../types';

@Component({
  selector: 'app-shopping-list-item',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './shopping-list-item.component.html',
  styleUrls: ['./shopping-list-item.component.scss'],
  host: {
    'attr.role': 'listitem',
    'attr.tabindex': '-1',
  },
})
export class ShoppingListItemComponent {
  list = input.required<ShoppingListResponseDto>();
  delete = output<ShoppingListResponseDto>();
  generate = output<ShoppingListResponseDto>();

  constructor(private readonly router: Router) {}

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.list());
  }

  onGenerate(event: Event): void {
    event.stopPropagation();
    this.generate.emit(this.list());
  }

  openDetails() {
    this.router.navigate(['/app/lists', this.list().id]);
  }
}
