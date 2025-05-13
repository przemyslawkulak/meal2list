import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CategoryService } from '../../core/supabase/category.service';
import { CategoryIconComponent } from '../../shared/category-icon/category-icon.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    AsyncPipe,
    MatListModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    CategoryIconComponent,
  ],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent {
  private readonly _categoryService = inject(CategoryService);
  readonly categories$ = this._categoryService.categories$;

  constructor() {}
}
