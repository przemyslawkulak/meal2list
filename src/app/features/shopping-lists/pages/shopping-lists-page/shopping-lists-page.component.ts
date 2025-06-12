import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { catchError, delay, finalize, of, tap } from 'rxjs';
import { ShoppingListResponseDto } from '../../../../../types';
import { ShoppingListService } from '../../../../core/supabase/shopping-list.service';
import { DeleteConfirmDialogComponent } from '../../components/delete-confirm-dialog/delete-confirm-dialog.component';
import { NewShoppingListDialogComponent } from '../../components/new-shopping-list-dialog/new-shopping-list-dialog.component';
import { ShoppingListItemComponent } from '../../components/shopping-list-item/shopping-list-item.component';
import { NotificationService } from '@app/shared/services/notification.service';
import { LoggerService } from '@app/shared/services/logger.service';

@Component({
  selector: 'app-shopping-lists-page',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatToolbarModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    NgxSkeletonLoaderModule,
    ShoppingListItemComponent,
  ],
  templateUrl: './shopping-lists-page.component.html',
  styleUrls: ['./shopping-lists-page.component.scss'],
})
export class ShoppingListsPageComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);
  private readonly logger = inject(LoggerService);
  private readonly shoppingListService = inject(ShoppingListService);
  private readonly router = inject(Router);

  readonly lists = signal<ShoppingListResponseDto[]>([]);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.loadLists();
  }

  openNew(): void {
    const dialogRef = this.dialog.open(NewShoppingListDialogComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((result: string | undefined) => {
      if (result) {
        this.shoppingListService
          .createShoppingList({ name: result })
          .pipe(
            tap(newList => {
              this.lists.update(currentLists => [...currentLists, newList]);
              this.notification.showSuccess('Lista zakupowa została utworzona');
            }),
            catchError(error => {
              this.logger.logError(error, 'Error creating shopping list');
              this.notification.showError('Wystąpił błąd podczas tworzenia listy');
              return of(null);
            })
          )
          .subscribe();
      }
    });
  }

  openDelete(list: ShoppingListResponseDto): void {
    const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, {
      width: '400px',
      data: { listId: list.id },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.shoppingListService
          .deleteShoppingList(list.id)
          .pipe(
            tap(() => {
              this.lists.update(currentLists => currentLists.filter(l => l.id !== list.id));
              this.notification.showSuccess('Lista zakupowa została usunięta');
            }),
            catchError(error => {
              this.logger.logError(error, 'Error deleting shopping list');
              this.notification.showError('Wystąpił błąd podczas usuwania listy');
              return of(null);
            })
          )
          .subscribe();
      }
    });
  }

  onGenerate(list: ShoppingListResponseDto): void {
    console.log('onGenerate', list);
    this.router.navigate(['/app/generate'], { queryParams: { listId: list.id } });
  }

  private loadLists(): void {
    this.isLoading.set(true);
    this.shoppingListService
      .getShoppingLists()
      .pipe(
        delay(300),
        tap(lists => this.lists.set(lists)),
        catchError(error => {
          this.logger.logError(error, 'Error loading shopping lists');
          this.notification.showError('Wystąpił błąd podczas ładowania list');
          return of([]);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }
}
