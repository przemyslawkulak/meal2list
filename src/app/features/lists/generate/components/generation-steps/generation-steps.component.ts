import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
}

@Component({
  selector: 'app-generation-steps',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './generation-steps.component.html',
  styleUrls: ['./generation-steps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerationStepsComponent {
  formType = input.required<'text' | 'scraping'>();
  hasContent = input.required<boolean>();
  isGenerating = input.required<boolean>();
  isContentReady = input.required<boolean>(); // For scraped content ready
  scrapingStatus = input.required<'idle' | 'scraping' | 'success' | 'error'>();
  generationStatus = input.required<'idle' | 'generating' | 'adding' | 'completed' | 'error'>();

  steps = computed(() => {
    const formType = this.formType();
    const hasContent = this.hasContent();
    const isGenerating = this.isGenerating();
    const isContentReady = this.isContentReady();
    const scrapingStatus = this.scrapingStatus();
    const generationStatus = this.generationStatus();

    const allSteps: GenerationStep[] = [];

    // For scraping - show scraping step first
    if (formType === 'scraping') {
      allSteps.push({
        id: 'scraping',
        label: 'Pobieranie przepisu z URL',
        status:
          scrapingStatus === 'scraping'
            ? 'active'
            : scrapingStatus === 'success'
              ? 'completed'
              : 'pending',
      });

      // Add content processing step after successful scraping
      allSteps.push({
        id: 'scraped',
        label: 'Przepis został pobrany i przygotowany',
        status:
          scrapingStatus === 'success' && isContentReady
            ? 'completed'
            : scrapingStatus === 'success'
              ? 'active'
              : 'pending',
      });
    }

    // For text - show content input step
    if (formType === 'text') {
      allSteps.push({
        id: 'content',
        label: 'Wprowadzono tekst przepisu',
        status: hasContent ? 'completed' : 'pending',
      });
    }

    // Add generation step - now properly tracks completion
    allSteps.push({
      id: 'generating',
      label: 'Generowanie listy zakupów',
      status:
        generationStatus === 'completed'
          ? 'completed'
          : isGenerating || generationStatus === 'generating'
            ? 'active'
            : 'pending',
    });

    // Return all steps - don't filter out pending ones
    return allSteps;
  });
}
