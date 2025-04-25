import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { CategoryService } from '../../core/supabase/category.service';
import { CategoryDto } from '../../../types';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
// TODO: to delete after testing categories
@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatListModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent {
  categories$: Observable<CategoryDto[]>;

  constructor(private categoryService: CategoryService) {
    this.categories$ = this.categoryService.getCategories().pipe(
      catchError(error => {
        console.error('Error fetching categories:', error);
        throw error;
      })
    );
  }
}
