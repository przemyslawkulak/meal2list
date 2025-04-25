import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AsyncPipe, DatePipe } from '@angular/common';
import { Observable, catchError, map, of, startWith, switchMap } from 'rxjs';
import { ShoppingListService } from '../../../core/supabase/shopping-list.service';
import { ShoppingListResponseDto } from '../../../../types';

interface ShoppingListState {
  loading: boolean;
  data: ShoppingListResponseDto | null;
}

@Component({
  selector: 'app-shopping-list-detail',
  standalone: true,
  imports: [
    MatCardModule,
    MatListModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    AsyncPipe,
    DatePipe,
  ],
  templateUrl: './shopping-list-detail.component.html',
  styleUrls: ['./shopping-list-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShoppingListDetailComponent {
  shoppingListState$: Observable<ShoppingListState>;

  constructor(
    private route: ActivatedRoute,
    private shoppingListService: ShoppingListService
  ) {
    this.shoppingListState$ = this.route.params.pipe(
      map(params => params['id']),
      switchMap(id =>
        this.shoppingListService.getShoppingListById(id).pipe(
          map(data => ({ loading: false, data })),
          catchError(error => {
            console.error('Error loading shopping list:', error);
            return of({ loading: false, data: null });
          }),
          startWith({ loading: true, data: null })
        )
      )
    );
  }
}
