import { Injectable } from '@angular/core';
import { from } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class CategoryService extends SupabaseService {
  private readonly _categories$ = from(
    this.supabase.from('categories').select('id, name, created_at, updated_at').order('name')
  ).pipe(
    map(response => {
      if (response.error) throw response.error;
      return response.data;
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  get categories$() {
    return this._categories$;
  }

  preload() {
    this._categories$.subscribe({
      error: error => {
        console.error('Failed to preload categories:', error);
        // Here we could inject MatSnackBar and show error message
      },
    });
  }
}
