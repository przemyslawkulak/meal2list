import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GenerationFormComponent } from './components/generation-form/generation-form.component';
import { ScrapingFormComponent } from './components/scraping-form/scraping-form.component';
import { GenerationStepsComponent } from './components/generation-steps/generation-steps.component';
import { ImageUploadFormComponent } from './components/image-upload-form/image-upload-form.component';
import { MethodCardComponent, MethodOption } from './components/method-card/method-card.component';
import { OverlayComponent } from '../../../shared/ui/overlay/overlay.component';
import { LimitStatusComponent } from '../../../shared/ui/limit-status/limit-status.component';
import { FormCoordinatorService } from './services/form-coordinator.service';
import { GenerationStateService } from './services/generation-state.service';
import { NewShoppingListDialogComponent } from '../../shopping-lists/components/new-shopping-list-dialog/new-shopping-list-dialog.component';
import { ShoppingListService } from '@app/core/supabase/shopping-list.service';
import { UserLimitService, LimitStatus } from '@app/core/services/user-limit';
import { NotificationService } from '@app/shared/services/notification.service';
import { LoggerService } from '@app/shared/services/logger.service';
import { SupabaseService } from '@app/core/supabase/supabase.service';
import { catchError, of, tap, switchMap } from 'rxjs';

@Component({
  selector: 'app-generate-list-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    FormsModule,
    MatDialogModule,
    GenerationFormComponent,
    ScrapingFormComponent,
    GenerationStepsComponent,
    ImageUploadFormComponent,
    MethodCardComponent,
    OverlayComponent,
    LimitStatusComponent,
  ],
  templateUrl: './generate-list.page.html',
  styleUrls: ['./generate-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerateListPageComponent implements OnInit {
  private readonly formCoordinator = inject(FormCoordinatorService);
  private readonly generationState = inject(GenerationStateService);
  private readonly userLimitService = inject(UserLimitService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly dialog = inject(MatDialog);
  private readonly shoppingListService = inject(ShoppingListService);
  private readonly notification = inject(NotificationService);
  private readonly logger = inject(LoggerService);

  // Method options configuration
  readonly methodOptions: MethodOption[] = [
    {
      id: 'scraping',
      title: 'Wklej linki do przepisów',
      description: 'Wprowadź linki do przepisów z internetu',
      icon: 'link',
      ariaLabel: 'Wybierz metodę: Wklej linki do przepisów',
    },
    {
      id: 'text',
      title: 'Wprowadź tekst przepisu',
      description: 'Wklej lub wpisz przepis bezpośrednio',
      icon: 'article',
      ariaLabel: 'Wybierz metodę: Wprowadź tekst przepisu',
    },
    {
      id: 'image',
      title: 'Prześlij zdjęcie przepisu',
      description: 'Zrób lub prześlij zdjęcie przepisu do rozpoznania',
      icon: 'photo_camera',
      ariaLabel: 'Wybierz metodę: Prześlij zdjęcie przepisu',
    },
  ];

  // Expose service signals to template
  readonly selectedFormType = this.formCoordinator.selectedFormType;
  readonly activeFormType = this.formCoordinator.activeFormType;
  readonly isContentReady = this.formCoordinator.isContentReady;
  readonly initialRecipeText = this.formCoordinator.initialRecipeText;
  readonly scrapedContent = this.formCoordinator.scrapedContent;
  readonly originalUrl = this.formCoordinator.originalUrl;
  readonly scrapingStatus = this.formCoordinator.scrapingStatus;
  readonly scrapingErrorMessage = this.formCoordinator.scrapingErrorMessage;
  readonly imageProcessingStatus = this.formCoordinator.imageProcessingStatus;
  readonly imageProcessingProgress = this.formCoordinator.imageProcessingProgress;
  readonly hasImageUploaded = this.formCoordinator.hasImageUploaded;
  readonly hasAnyContent = this.formCoordinator.hasAnyContent;
  readonly hasContent = this.formCoordinator.hasContent;

  // Limit status signals
  private readonly _limitStatus = signal<LimitStatus | null>(null);
  readonly limitStatus = this._limitStatus.asReadonly();

  readonly isLimitExceeded = computed(() => {
    const status = this._limitStatus();
    return status ? !status.canProcess : false;
  });

  readonly shoppingLists = this.generationState.shoppingLists;
  readonly selectedListId = this.generationState.selectedListId;
  readonly isGenerating = this.generationState.isGenerating;
  readonly generationStatus = this.generationState.generationStatus;
  readonly errorMessage = this.generationState.errorMessage;
  readonly hasGenerationStarted = this.generationState.hasGenerationStarted;

  // Convenience computed property to determine if generation is allowed
  readonly canGenerate = this.generationState.canGenerate;

  ngOnInit(): void {
    // Reset generation state when navigating to generate page
    this.generationState.resetGenerationState();

    // Load user limit status
    this.loadLimitStatus();

    // Check if we're returning from review screen with recipe text
    const recipeText = this.generationState.checkNavigationState();
    if (recipeText) {
      this.formCoordinator.setInitialRecipeText(recipeText);
    }
  }

  private loadLimitStatus(): void {
    this.supabaseService
      .getUserId()
      .pipe(
        switchMap(userId => {
          if (!userId) {
            return of(null);
          }
          return this.userLimitService.checkUserLimit(userId);
        }),
        catchError(error => {
          this.logger.logError(error, 'Failed to load limit status');
          return of(null);
        })
      )
      .subscribe(status => {
        this._limitStatus.set(status);
      });
  }

  // Method selection
  onFormTypeChange(formType: string): void {
    // Prevent method change if limit is exceeded
    if (this.isLimitExceeded()) {
      this.notification.showError('Osiągnięto miesięczny limit generacji');
      return;
    }

    this.formCoordinator.setFormType(formType as 'text' | 'scraping' | 'image');
    this.generationState.resetGenerationState();
  }

  // List selection
  onListSelectionChange(listId: string): void {
    this.generationState.setSelectedListId(listId);
  }

  // Text form events
  onGenerate(recipeText: string): void {
    if (this.isLimitExceeded()) {
      this.notification.showError('Osiągnięto miesięczny limit generacji');
      return;
    }

    this.generationState.startGenerationProcess();
    this.generationState.generateFromContent(recipeText, 'text', 'Przepis tekstowy');
  }

  onTextFormChange(hasContent: boolean): void {
    this.formCoordinator.onTextFormChange(hasContent);
  }

  // Scraping form events
  onScrapingFormChange(hasContent: boolean): void {
    this.formCoordinator.onScrapingFormChange(hasContent);
  }

  onScrapingStart(): void {
    if (this.isLimitExceeded()) {
      this.notification.showError('Osiągnięto miesięczny limit generacji');
      return;
    }

    this.formCoordinator.setScrapingStart();
    this.generationState.startGenerationProcess();
  }

  onScrapingSuccess(result: { url: string; content: string }): void {
    this.formCoordinator.setScrapingSuccess(result.content, result.url);

    // Auto-generate after a brief delay
    setTimeout(() => {
      this.onGenerateFromScraped();
    }, 1000);
  }

  onScrapingError(error: string): void {
    this.formCoordinator.setScrapingError(error);
    this.generationState.resetGenerationState();
  }

  // Image form events
  onImageFormChange(event: { hasContent: boolean }): void {
    this.formCoordinator.onImageFormChange(event.hasContent);
    this.formCoordinator.setImageUploaded(event.hasContent);
  }

  onImageProcessingStart(): void {
    if (this.isLimitExceeded()) {
      this.notification.showError('Osiągnięto miesięczny limit generacji');
      return;
    }

    this.formCoordinator.setImageProcessingStart();
    this.generationState.startGenerationProcess();
  }

  onImageProcessed(extractedText: string): void {
    this.formCoordinator.setImageProcessingCompleted(extractedText);

    // Auto-generate after a brief delay
    setTimeout(() => {
      this.onGenerate(extractedText);
    }, 1000);
  }

  onImageProcessingError(): void {
    this.formCoordinator.setImageProcessingError();
    this.generationState.resetGenerationState();
  }

  // Generation from scraped content
  onGenerateFromScraped(): void {
    if (this.isLimitExceeded()) {
      this.notification.showError('Osiągnięto miesięczny limit generacji');
      return;
    }

    const content = this.scrapedContent();
    const url = this.originalUrl();
    const sourceLabel = url || 'Strona internetowa';

    if (content) {
      this.generationState.generateFromContent(content, 'url', sourceLabel);
    }
  }

  // Form utilities
  clearAllForms(): void {
    this.formCoordinator.clearAllForms();
    this.generationState.resetGenerationState();
  }

  resetToIdle(): void {
    this.generationState.resetToIdle();
  }

  // Computed properties for form states
  readonly isGenerationFormDisabled = computed(
    () => this.selectedFormType() !== 'text' || !this.canGenerate() || this.isLimitExceeded()
  );

  readonly isScrapingFormDisabled = computed(
    () =>
      this.selectedFormType() !== 'scraping' ||
      !this.canGenerate() ||
      this.scrapingStatus() === 'scraping' ||
      this.isLimitExceeded()
  );

  readonly isImageFormDisabled = computed(
    () => this.selectedFormType() !== 'image' || !this.canGenerate() || this.isLimitExceeded()
  );

  // Dialog for creating a new shopping list when none exist
  openNewListDialog(): void {
    if (this.isLimitExceeded()) {
      this.notification.showError('Osiągnięto miesięczny limit generacji');
      return;
    }

    const dialogRef = this.dialog.open(NewShoppingListDialogComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((result: string | undefined) => {
      if (result) {
        this.shoppingListService
          .createShoppingList({ name: result })
          .pipe(
            tap(newList => {
              // Reload lists and select the newly created one automatically
              this.generationState.loadShoppingLists();
              // Ensure the newly created list is selected
              if (newList) {
                this.generationState.setSelectedListId(newList.id);
              }
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
}
