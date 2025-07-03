import { Injectable } from '@angular/core';
import { FormType, StepStatus, StepContext, GenerationStep } from './shared-types';

export interface StepDefinition {
  id: string;
  label: string;
  statusCondition: (context: StepContext) => StepStatus;
}

@Injectable({
  providedIn: 'root',
})
export class StepConfigurationService {
  private readonly stepDefinitions: Record<FormType, StepDefinition[]> = {
    text: [
      {
        id: 'content',
        label: 'Wprowadzono tekst przepisu',
        statusCondition: ctx => (ctx.hasContent ? 'completed' : 'pending'),
      },
      {
        id: 'generating',
        label: 'Generowanie listy zakupów',
        statusCondition: ctx => this.getGenerationStatus(ctx),
      },
      {
        id: 'completed',
        label: 'Lista zakupów została wygenerowana',
        statusCondition: ctx => (ctx.generationStatus === 'completed' ? 'completed' : 'pending'),
      },
    ],

    scraping: [
      {
        id: 'scraping',
        label: 'Pobieranie przepisu z URL',
        statusCondition: ctx => this.getSimpleStatus(ctx.scrapingStatus, 'scraping', 'success'),
      },
      {
        id: 'scraped',
        label: 'Przepis został pobrany i przygotowany',
        statusCondition: ctx =>
          ctx.scrapingStatus === 'success' && ctx.isContentReady
            ? 'completed'
            : ctx.scrapingStatus === 'success'
              ? 'active'
              : 'pending',
      },
      {
        id: 'generating',
        label: 'Generowanie listy zakupów',
        statusCondition: ctx => this.getGenerationStatus(ctx),
      },
      {
        id: 'completed',
        label: 'Lista zakupów została wygenerowana',
        statusCondition: ctx => (ctx.generationStatus === 'completed' ? 'completed' : 'pending'),
      },
    ],

    image: [
      {
        id: 'image-upload',
        label: 'Przesyłanie zdjęcia przepisu',
        statusCondition: ctx => (ctx.hasContent ? 'completed' : 'pending'),
      },
      {
        id: 'image-processing',
        label: 'Rozpoznawanie tekstu z obrazu (AI)',
        statusCondition: ctx =>
          this.getSimpleStatus(ctx.imageProcessingStatus, 'processing', 'completed'),
      },
      {
        id: 'text-extraction',
        label: 'Tekst przepisu został wyekstraktowany',
        statusCondition: ctx =>
          ctx.imageProcessingStatus === 'completed' ? 'completed' : 'pending',
      },
      {
        id: 'content-ready',
        label: 'Przepis gotowy do przetworzenia',
        statusCondition: ctx =>
          ctx.imageProcessingStatus === 'completed' && ctx.isContentReady ? 'completed' : 'pending',
      },
      {
        id: 'generating',
        label: 'Generowanie listy zakupów',
        statusCondition: ctx => this.getGenerationStatus(ctx),
      },
      {
        id: 'completed',
        label: 'Lista zakupów została wygenerowana',
        statusCondition: ctx => (ctx.generationStatus === 'completed' ? 'completed' : 'pending'),
      },
    ],
  };

  /**
   * Generates steps for a specific form type and context
   */
  generateSteps(context: StepContext): GenerationStep[] {
    const definitions = this.stepDefinitions[context.formType];

    return definitions.map(definition => ({
      id: definition.id,
      label: definition.label,
      status: definition.statusCondition(context),
    }));
  }

  /**
   * Gets the current progress percentage (0-100)
   */
  getProgress(context: StepContext): number {
    const steps = this.generateSteps(context);
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / steps.length) * 100);
  }

  /**
   * Gets the current active step if any
   */
  getCurrentStep(context: StepContext): GenerationStep | null {
    const steps = this.generateSteps(context);
    return steps.find(step => step.status === 'active') || null;
  }

  /**
   * Checks if the workflow is complete
   */
  isWorkflowComplete(context: StepContext): boolean {
    return context.generationStatus === 'completed';
  }

  // Private helper methods
  private getGenerationStatus(ctx: StepContext): StepStatus {
    if (ctx.generationStatus === 'completed') return 'completed';
    if (ctx.isGenerating || ctx.generationStatus === 'generating') return 'active';
    if (ctx.isContentReady) return 'pending';
    return 'pending';
  }

  private getSimpleStatus(
    currentStatus: string,
    activeValue: string,
    completedValue: string
  ): StepStatus {
    if (currentStatus === completedValue) return 'completed';
    if (currentStatus === activeValue) return 'active';
    return 'pending';
  }
}
