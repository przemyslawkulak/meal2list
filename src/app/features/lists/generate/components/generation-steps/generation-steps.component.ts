import { ChangeDetectionStrategy, Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StepConfigurationService } from '../../services/step-configuration.service';
import { FormType, StepContext } from '../../services/shared-types';

@Component({
  selector: 'app-generation-steps',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './generation-steps.component.html',
  styleUrls: ['./generation-steps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerationStepsComponent {
  private readonly stepService = inject(StepConfigurationService);

  // Input signals
  formType = input.required<FormType>();
  hasContent = input.required<boolean>();
  isGenerating = input.required<boolean>();
  isContentReady = input.required<boolean>();
  scrapingStatus = input.required<'idle' | 'scraping' | 'success' | 'error'>();
  generationStatus = input.required<'idle' | 'generating' | 'adding' | 'completed' | 'error'>();
  imageProcessingStatus = input<'idle' | 'processing' | 'completed' | 'error'>('idle');
  processingProgress = input<number>(0);

  // Context signal for the step service
  private readonly stepContext = computed(
    (): StepContext => ({
      formType: this.formType(),
      hasContent: this.hasContent(),
      isGenerating: this.isGenerating(),
      isContentReady: this.isContentReady(),
      scrapingStatus: this.scrapingStatus(),
      generationStatus: this.generationStatus(),
      imageProcessingStatus: this.imageProcessingStatus(),
      processingProgress: this.processingProgress(),
    })
  );

  // Computed properties using the step service
  steps = computed(() => this.stepService.generateSteps(this.stepContext()));

  progress = computed(() => this.stepService.getProgress(this.stepContext()));

  currentStep = computed(() => this.stepService.getCurrentStep(this.stepContext()));

  isComplete = computed(() => this.stepService.isWorkflowComplete(this.stepContext()));
}
