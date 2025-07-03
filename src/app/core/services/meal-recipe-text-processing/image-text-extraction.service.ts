import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, switchMap, catchError, timeout, retry } from 'rxjs/operators';
import { SupabaseService } from '../../supabase/supabase.service';
import { PROCESSING_ERRORS } from './models';
import { ImageValidationService } from './image-validation.service';

// Type definitions for OpenAI API responses
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChoice {
  message: OpenAIMessage;
  finish_reason: string;
  index: number;
}

interface OpenAIResponse {
  choices?: OpenAIChoice[];
  content?: string;
  usage?: Record<string, unknown>;
  model?: string;
  created?: number;
}

type SupabaseFunctionResult = {
  data: OpenAIResponse | null;
  error: { message: string } | null;
};

interface OpenAIImageMessage {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

@Injectable({
  providedIn: 'root',
})
export class ImageTextExtractionService extends SupabaseService {
  private readonly processingTimeout = 30000; // 30 seconds
  private readonly retryAttempts = 3;
  private readonly validationService = inject(ImageValidationService);

  /**
   * Extract text from image file
   */
  extractTextFromImage(imageFile: File): Observable<string> {
    this.logger.logInfo(`Starting text extraction: ${imageFile.name} (${imageFile.size} bytes)`);

    return this.validationService.validate(imageFile).pipe(
      switchMap(() => this.convertImageToBase64(imageFile)),
      switchMap(base64Image => this.callOpenAIEdgeFunction(base64Image)),
      map(response => this.extractTextFromResponse(response)),
      timeout(this.processingTimeout),
      retry(this.retryAttempts),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Convert image file to base64 format
   */
  private convertImageToBase64(file: File): Observable<string> {
    return new Observable<string>(observer => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];

          if (!base64Data) {
            throw new Error('Failed to extract base64 data from image');
          }

          observer.next(base64Data);
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      };

      reader.onerror = () => observer.error(new Error('Failed to read image file'));
      reader.onabort = () => observer.error(new Error('Image reading was aborted'));

      reader.readAsDataURL(file);
    }).pipe(
      timeout(10000),
      catchError(error => {
        this.logger.logWarning('Image conversion failed', error?.message);
        return throwError(() => new Error('IMAGE_CONVERSION_FAILED'));
      })
    );
  }

  /**
   * Call OpenAI API through Supabase Edge Function
   */
  private callOpenAIEdgeFunction(imageBase64: string): Observable<OpenAIResponse> {
    const payload = {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: this.buildSystemMessage() },
        { role: 'user', content: this.buildUserMessage(imageBase64) },
      ],
      temperature: 0.1,
      max_tokens: 2000,
      top_p: 0.9,
    };

    return from(
      this.supabase.functions.invoke('openai-recipe-processor', {
        body: payload,
      })
    ).pipe(
      map(result => {
        const typedResult = result as SupabaseFunctionResult;
        if (typedResult.error) {
          throw new Error(`API_ERROR: ${typedResult.error.message}`);
        }

        if (!typedResult.data) {
          throw new Error('API_ERROR: No data received from OpenAI');
        }

        return typedResult.data;
      }),
      catchError(error => {
        this.logger.logWarning('OpenAI API call failed', error?.message);
        return throwError(() => new Error('API_SERVICE_UNAVAILABLE'));
      })
    );
  }

  /**
   * Extract text from OpenAI response
   */
  private extractTextFromResponse(data: OpenAIResponse): string {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid AI response format');
    }

    const textContent = data.choices?.[0]?.message?.content || data.content || '';

    if (!textContent || typeof textContent !== 'string') {
      throw new Error('No text content found in response');
    }

    if (textContent.trim().length === 0) {
      throw new Error('No text detected in image');
    }

    return this.cleanExtractedText(textContent);
  }

  /**
   * Clean up extracted text
   */
  private cleanExtractedText(text: string): string {
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 5000); // Limit length
  }

  /**
   * Handle extraction errors
   */
  private handleError(error: Error): Observable<never> {
    const errorMessage = this.getErrorMessage(error);
    this.logger.logError(error, 'Text extraction failed');
    this.notification.showError(errorMessage);
    return throwError(() => error);
  }

  private getErrorMessage(error: Error): string {
    const message = error?.message || '';

    if (message.includes('VALIDATION') || message.includes('INVALID_FILE')) {
      return PROCESSING_ERRORS.INVALID_FILE;
    }

    if (message.includes('timeout') || message.includes('TIMEOUT')) {
      return PROCESSING_ERRORS.TIMEOUT;
    }

    if (message.includes('API') || message.includes('SERVICE_UNAVAILABLE')) {
      return PROCESSING_ERRORS.API_ERROR;
    }

    if (message.includes('network') || message.includes('NETWORK')) {
      return PROCESSING_ERRORS.NETWORK_ERROR;
    }

    return PROCESSING_ERRORS.API_ERROR; // Default fallback
  }

  /**
   * Build system message for OpenAI
   */
  private buildSystemMessage(): string {
    return `You are an expert text recognition assistant. Extract all visible text from the image accurately and format it as clean, readable markdown.

Instructions:
- Extract ALL visible text from the image, including titles, ingredients, instructions, notes, etc.
- Format the text using proper markdown syntax (headings, lists, etc.)
- Preserve the original structure and organization when possible
- Use Polish formatting conventions
- For recipes: use ## for title, - for ingredient lists, numbered lists for instructions
- Clean up any OCR artifacts or unclear text
- If text is unclear or partially obscured, indicate this with [unclear text] or [partially visible]
- If no meaningful text is found, respond with "Nie znaleziono tekstu w obrazie"

Return only the formatted markdown text, no additional commentary.`;
  }

  /**
   * Build user message with image for OpenAI
   */
  private buildUserMessage(imageBase64: string): OpenAIImageMessage[] {
    const prompt =
      'Please extract all visible text from this image and format it as clean markdown.';

    return [
      { type: 'text', text: prompt },
      {
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
      },
    ];
  }
}
