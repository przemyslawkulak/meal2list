/**
 * Shared types for the list generation feature
 */

export type FormType = 'text' | 'scraping' | 'image';
export type StepStatus = 'pending' | 'active' | 'completed';

export interface FormState {
  selectedFormType: FormType;
  activeFormType: FormType | null;
  hasContent: boolean;
  isContentReady: boolean;
}

export interface ScrapingState {
  content: string;
  originalUrl: string;
  status: 'idle' | 'scraping' | 'success' | 'error';
  errorMessage: string | null;
}

export interface ImageProcessingState {
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
  hasUploaded: boolean;
}

export interface StepContext {
  formType: FormType;
  hasContent: boolean;
  isGenerating: boolean;
  isContentReady: boolean;
  scrapingStatus: 'idle' | 'scraping' | 'success' | 'error';
  generationStatus: 'idle' | 'generating' | 'adding' | 'completed' | 'error';
  imageProcessingStatus: 'idle' | 'processing' | 'completed' | 'error';
  processingProgress: number;
}

export interface GenerationStep {
  id: string;
  label: string;
  status: StepStatus;
}
