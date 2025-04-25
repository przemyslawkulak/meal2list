import { Injectable, Inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { CategoryDto } from '../../../types';
import { SupabaseService } from './supabase.service';
import { AppEnvironment } from '../../app.config';

@Injectable({
  providedIn: 'root',
})
export class CategoryService extends SupabaseService {
  constructor(@Inject('APP_ENVIRONMENT') environment: AppEnvironment) {
    super(environment);
  }

  getCategories(): Observable<CategoryDto[]> {
    return from(this.supabase.from('categories').select('id, name').order('name')).pipe(
      map(result => {
        if (result.error) throw result.error;
        return result.data;
      })
    );
  }
}
