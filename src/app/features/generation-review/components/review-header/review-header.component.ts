import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-review-header',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './review-header.component.html',
  styleUrl: './review-header.component.scss',
})
export class ReviewHeaderComponent {}
