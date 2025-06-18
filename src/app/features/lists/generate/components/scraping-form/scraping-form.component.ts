import { ChangeDetectionStrategy, Component, input, output, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ScrapingService } from '../../../../../core/supabase/scraping.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-scraping-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './scraping-form.component.html',
  styleUrls: ['./scraping-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrapingFormComponent {
  private readonly scrapingService = inject(ScrapingService);
  private readonly fb = inject(FormBuilder);

  // Inputs
  disabled = input<boolean>(false);
  scrapedContent = input<string>('');
  scrapingStatus = input<'idle' | 'scraping' | 'success' | 'error'>('idle');
  errorMessage = input<string | null>(null);

  // Outputs
  scrapingStart = output<void>();
  scrapingSuccess = output<{ url: string; content: string }>();
  scrapingError = output<string>();
  contentChange = output<boolean>();

  readonly form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      url: ['', [Validators.required, this.urlValidator]],
    });

    // Watch for form changes to emit contentChange
    effect(() => {
      const hasUrl = !!this.form.get('url')?.value?.trim();
      const hasContent = !!this.scrapedContent()?.trim();
      this.contentChange.emit(hasUrl || hasContent);
    });

    // Update form disabled state based on input and loading state
    effect(() => {
      const isDisabled = this.disabled() || this.isLoading;
      const urlControl = this.form.get('url');

      if (isDisabled) {
        urlControl?.disable();
      } else {
        urlControl?.enable();
      }
    });
  }

  onScrape(): void {
    if (!this.form.valid) return;

    const url = this.form.get('url')?.value?.trim();
    if (!url) return;

    this.scrapingStart.emit();

    this.scrapingService
      .scrapeUrl(url)
      .pipe(
        tap(content => {
          this.scrapingSuccess.emit({ url, content });
        }),
        catchError(error => {
          const message =
            error instanceof Error
              ? error.message
              : 'Scraping failed. Please check the URL and try again.';
          this.scrapingError.emit(message);
          return of(null);
        })
      )
      .subscribe();
  }

  onClear(): void {
    this.form.reset();
    this.scrapingSuccess.emit({ url: '', content: '' });
  }

  get isLoading(): boolean {
    return this.scrapingStatus() === 'scraping';
  }

  get hasSuccess(): boolean {
    return this.scrapingStatus() === 'success';
  }

  get hasError(): boolean {
    return this.scrapingStatus() === 'error';
  }

  private urlValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    try {
      const url = new URL(control.value);
      return ['http:', 'https:'].includes(url.protocol) ? null : { invalidUrl: true };
    } catch {
      return { invalidUrl: true };
    }
  };
}
