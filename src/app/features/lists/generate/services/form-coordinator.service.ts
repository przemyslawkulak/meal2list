import { Injectable, signal, computed } from '@angular/core';
import { FormType } from './shared-types';

@Injectable({
  providedIn: 'root',
})
export class FormCoordinatorService {
  // Form selection and state
  private readonly _selectedFormType = signal<FormType>('scraping');
  private readonly _activeFormType = signal<FormType | null>(null);
  private readonly _isContentReady = signal<boolean>(false);

  // Text form state
  private readonly _initialRecipeText = signal<string>('');

  // Scraping form state
  private readonly _scrapedContent = signal<string>('');
  private readonly _originalUrl = signal<string>('');
  private readonly _scrapingStatus = signal<'idle' | 'scraping' | 'success' | 'error'>('idle');
  private readonly _scrapingErrorMessage = signal<string | null>(null);

  // Image processing state
  private readonly _imageProcessingStatus = signal<'idle' | 'processing' | 'completed' | 'error'>(
    'idle'
  );
  private readonly _imageProcessingProgress = signal<number>(0);
  private readonly _hasImageUploaded = signal<boolean>(false);

  // Public readonly signals
  readonly selectedFormType = this._selectedFormType.asReadonly();
  readonly activeFormType = this._activeFormType.asReadonly();
  readonly isContentReady = this._isContentReady.asReadonly();
  readonly initialRecipeText = this._initialRecipeText.asReadonly();
  readonly scrapedContent = this._scrapedContent.asReadonly();
  readonly originalUrl = this._originalUrl.asReadonly();
  readonly scrapingStatus = this._scrapingStatus.asReadonly();
  readonly scrapingErrorMessage = this._scrapingErrorMessage.asReadonly();
  readonly imageProcessingStatus = this._imageProcessingStatus.asReadonly();
  readonly imageProcessingProgress = this._imageProcessingProgress.asReadonly();
  readonly hasImageUploaded = this._hasImageUploaded.asReadonly();

  // Computed properties
  readonly hasAnyContent = computed(() => this._activeFormType() !== null);

  readonly hasContent = computed(() => {
    const activeForm = this._activeFormType();
    switch (activeForm) {
      case 'text':
        return !!this._initialRecipeText();
      case 'scraping':
        return !!this._scrapedContent();
      case 'image':
        return this._hasImageUploaded() || !!this._initialRecipeText();
      default:
        return false;
    }
  });

  readonly canGenerate = computed(() => {
    const activeForm = this._activeFormType();
    const isContentReady = this._isContentReady();

    return (
      ((activeForm === 'text' && !!this._initialRecipeText()) ||
        (activeForm === 'scraping' &&
          this._scrapingStatus() === 'success' &&
          !!this._scrapedContent()) ||
        (activeForm === 'image' && isContentReady)) &&
      isContentReady
    );
  });

  // Form type management
  setFormType(formType: FormType): void {
    this._selectedFormType.set(formType);
    this._clearInactiveForms(formType);
    this._activeFormType.set(null);
    this._isContentReady.set(false);
  }

  // Text form methods
  setInitialRecipeText(text: string): void {
    this._initialRecipeText.set(text);
    this._updateActiveFormAndContentReady('text', !!text);
  }

  // Scraping form methods
  setScrapingStart(): void {
    this._scrapingStatus.set('scraping');
    this._scrapingErrorMessage.set(null);
    this._isContentReady.set(false);
  }

  setScrapingSuccess(content: string, url: string): void {
    this._scrapedContent.set(content);
    this._originalUrl.set(url);
    this._scrapingStatus.set('success');
    this._scrapingErrorMessage.set(null);
    this._updateActiveFormAndContentReady('scraping', true);
  }

  setScrapingError(error: string): void {
    this._scrapingStatus.set('error');
    this._scrapingErrorMessage.set(error);
    this._scrapedContent.set('');
    this._originalUrl.set('');
    this._isContentReady.set(false);
  }

  // Image processing methods
  setImageProcessingStart(): void {
    this._imageProcessingStatus.set('processing');
    this._imageProcessingProgress.set(0);
    this._isContentReady.set(false);
  }

  setImageProcessingProgress(progress: number): void {
    this._imageProcessingProgress.set(progress);
  }

  setImageProcessingCompleted(extractedText: string): void {
    this._imageProcessingStatus.set('completed');
    this._imageProcessingProgress.set(100);
    this._initialRecipeText.set(extractedText);

    // Keep image form type but mark content as ready
    this._updateActiveFormAndContentReady('image', true);
  }

  setImageProcessingError(): void {
    this._imageProcessingStatus.set('error');
    this._imageProcessingProgress.set(0);
    this._isContentReady.set(false);
  }

  setImageUploaded(hasUploaded: boolean): void {
    this._hasImageUploaded.set(hasUploaded);
    this._updateActiveFormAndContentReady('image', hasUploaded);
  }

  // Form coordination methods
  onTextFormChange(hasContent: boolean): void {
    if (this._selectedFormType() === 'text') {
      this._updateActiveFormAndContentReady('text', hasContent);
    }
  }

  onScrapingFormChange(hasContent: boolean): void {
    if (this._selectedFormType() === 'scraping') {
      this._updateActiveFormAndContentReady('scraping', hasContent);
    }
  }

  onImageFormChange(hasContent: boolean): void {
    if (this._selectedFormType() === 'image') {
      this._updateActiveFormAndContentReady('image', hasContent);
    }
  }

  // Clear all forms
  clearAllForms(): void {
    this._clearTextForm();
    this._clearScrapingForm();
    this._clearImageForm();
    this._activeFormType.set(null);
    this._selectedFormType.set('scraping');
    this._isContentReady.set(false);
  }

  // Private helper methods
  private _updateActiveFormAndContentReady(formType: FormType, hasContent: boolean): void {
    if (hasContent && this._selectedFormType() === formType) {
      this._activeFormType.set(formType);
      this._isContentReady.set(true);
    } else if (!hasContent && this._activeFormType() === formType) {
      this._activeFormType.set(null);
      this._isContentReady.set(false);
    }
  }

  private _clearInactiveForms(activeFormType: FormType): void {
    if (activeFormType !== 'text') {
      this._clearTextForm();
    }
    if (activeFormType !== 'scraping') {
      this._clearScrapingForm();
    }
    if (activeFormType !== 'image') {
      this._clearImageForm();
    }
  }

  private _clearTextForm(): void {
    this._initialRecipeText.set('');
  }

  private _clearScrapingForm(): void {
    this._scrapedContent.set('');
    this._originalUrl.set('');
    this._scrapingStatus.set('idle');
    this._scrapingErrorMessage.set(null);
  }

  private _clearImageForm(): void {
    this._imageProcessingStatus.set('idle');
    this._imageProcessingProgress.set(0);
    this._hasImageUploaded.set(false);
  }
}
