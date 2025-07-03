import { Component, input, output, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { Subject, takeUntil, catchError, of } from 'rxjs';

import { MealRecipeImageProcessingService } from '@app/core/services/meal-recipe-text-processing/meal-recipe-image-processing.service';

type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';

@Component({
  selector: 'app-image-upload-form',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatCardModule],
  templateUrl: './image-upload-form.component.html',
  styleUrls: ['./image-upload-form.component.scss'],
})
export class ImageUploadFormComponent implements OnDestroy {
  disabled = input(false);
  imageProcessed = output<string>();
  processingError = output<string>();
  processingStart = output<void>();
  contentChange = output<{ hasContent: boolean }>();

  // Service injection
  private readonly imageProcessingService = inject(MealRecipeImageProcessingService);
  private readonly destroy$ = new Subject<void>();

  // Signals for reactive state management
  selectedFile = signal<File | null>(null);
  processingStatus = signal<ProcessingStatus>('idle');
  progressValue = signal<number>(0);
  progressMessage = signal<string>('Ready to process');
  errorMessage = signal<string>('');
  dragOver = signal<boolean>(false);
  imagePreviewUrl = signal<string | null>(null);

  // Computed properties
  isProcessing = computed(() => this.processingStatus() === 'processing');
  isSuccess = computed(() => this.processingStatus() === 'completed');
  isError = computed(() => this.processingStatus() === 'error');
  hasSelectedFile = computed(() => this.selectedFile() !== null);
  isFormDisabled = computed(() => this.disabled() || this.isProcessing());
  hasImagePreview = computed(() => this.imagePreviewUrl() !== null);

  // File validation constants
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up preview URL to prevent memory leaks
    const currentPreviewUrl = this.imagePreviewUrl();
    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isFormDisabled()) {
      this.dragOver.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);

    if (this.isFormDisabled()) {
      return;
    }

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onProcessImage(): void {
    const file = this.selectedFile();
    if (!file || this.isFormDisabled()) {
      return;
    }

    this.clearError();
    this.processingStatus.set('processing');
    this.progressValue.set(0);
    this.progressMessage.set('Starting image processing...');
    this.processingStart.emit();

    // Simple progress indication
    this.progressValue.set(50);
    this.progressMessage.set('Processing image...');

    // Process the image
    this.imageProcessingService
      .processRecipeImage(file)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.handleProcessingError(error);
          return of(null);
        })
      )
      .subscribe(result => {
        if (result) {
          this.handleProcessingSuccess(result);
        }
      });
  }

  onClearFile(): void {
    // Clean up preview URL to prevent memory leaks
    const currentPreviewUrl = this.imagePreviewUrl();
    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
    }

    this.selectedFile.set(null);
    this.imagePreviewUrl.set(null);
    this.clearError();
    this.processingStatus.set('idle');
    this.progressValue.set(0);
    this.progressMessage.set('Ready to process');
    this.contentChange.emit({ hasContent: false });

    // Reset file input
    const fileInput = document.getElementById('imageFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onImageLoad(): void {
    // Image loaded successfully - could be used for analytics or logging
    console.log('Image preview loaded successfully');
  }

  onImageError(): void {
    // Handle image loading error
    console.error('Failed to load image preview');
    this.errorMessage.set('Nie udało się załadować podglądu obrazu');
  }

  private handleFile(file: File): void {
    if (!this.validateFile(file)) {
      return;
    }

    // Clean up previous preview URL if it exists
    const currentPreviewUrl = this.imagePreviewUrl();
    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
    }

    // Generate new preview URL
    const previewUrl = URL.createObjectURL(file);

    this.selectedFile.set(file);
    this.imagePreviewUrl.set(previewUrl);
    this.clearError();
    this.processingStatus.set('idle');
    this.contentChange.emit({ hasContent: true });
  }

  private validateFile(file: File): boolean {
    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.errorMessage.set('Dozwolone są tylko pliki JPEG, PNG i WebP');
      this.processingError.emit(this.errorMessage());
      return false;
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      this.errorMessage.set('Plik jest za duży. Maksymalny rozmiar to 10MB');
      this.processingError.emit(this.errorMessage());
      return false;
    }

    return true;
  }

  private clearError(): void {
    this.errorMessage.set('');
  }

  private handleProcessingSuccess(result: string): void {
    this.processingStatus.set('completed');

    // Emit the extracted text directly (already formatted as markdown)
    this.imageProcessed.emit(result);
  }

  private handleProcessingError(error: Error): void {
    this.processingStatus.set('error');

    // Extract user-friendly error message
    const errorMessage = this.extractErrorMessage(error);
    this.errorMessage.set(errorMessage);
    this.processingError.emit(errorMessage);
  }

  private extractErrorMessage(error: Error): string {
    if (error?.message) {
      // Handle specific error codes
      if (error.message.includes('INVALID_FILE_FORMAT')) {
        return 'Nieprawidłowy format pliku. Użyj pliku JPEG, PNG lub WebP.';
      }
      if (error.message.includes('FILE_TOO_LARGE')) {
        return 'Plik jest za duży. Maksymalny rozmiar to 10MB.';
      }
      if (error.message.includes('NO_TEXT_DETECTED')) {
        return 'Nie wykryto tekstu na tym obrazie. Spróbuj z innym zdjęciem.';
      }
      if (error.message.includes('API_ERROR')) {
        return 'Błąd usługi AI. Spróbuj ponownie za chwilę.';
      }
      if (error.message.includes('PROCESSING_TIMEOUT')) {
        return 'Przekroczono czas przetwarzania. Spróbuj z mniejszym obrazem.';
      }
    }

    return 'Wystąpił błąd podczas przetwarzania obrazu. Spróbuj ponownie.';
  }
}
