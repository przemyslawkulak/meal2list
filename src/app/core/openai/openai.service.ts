import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from '@core/supabase/supabase.service';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  ChatMessage,
  ChatCompletionResponse,
  ResponseFormat,
  ModelParameters,
  OpenrouterAuthError,
  OpenrouterRateLimitError,
  OpenrouterError,
  ChatCompletionRequest,
} from './openai.models';
import { SupabaseError } from '@types';

@Injectable({
  providedIn: 'root',
})
export class OpenrouterService extends SupabaseService {
  private readonly systemMessage = signal<string>('');
  private readonly currentModel = signal<string>('');
  private readonly modelParameters = signal<ModelParameters>({});
  private readonly responseFormat = signal<ResponseFormat | undefined>(undefined);

  readonly currentConfig = computed(() => ({
    model: this.currentModel(),
    model_params: this.modelParameters(),
    response_format: this.responseFormat(),
  }));

  setSystemMessage(message: string): void {
    this.systemMessage.set(message);
  }

  setModel(name: string, parameters: ModelParameters = {}): void {
    this.currentModel.set(name);
    this.modelParameters.set(parameters);
  }

  setResponseFormat(schema: ResponseFormat): void {
    this.responseFormat.set(schema);
  }

  private handleError(error: SupabaseError): Observable<never> {
    if (error?.message?.includes('unauthorized')) {
      return throwError(() => new OpenrouterAuthError('Invalid API key or unauthorized access'));
    }
    if (error?.message?.includes('rate limit')) {
      return throwError(() => new OpenrouterRateLimitError('Rate limit exceeded'));
    }
    if (error?.message?.includes('server error')) {
      return throwError(() => new OpenrouterError('Server error occurred', 'SERVER_ERROR'));
    }
    return throwError(() => new OpenrouterError('An unexpected error occurred'));
  }

  sendChatMessage(userMessage: string): Observable<ChatCompletionResponse> {
    const messages: ChatMessage[] = [];

    const systemMsg = this.systemMessage();
    if (systemMsg) {
      messages.push({ role: 'system', content: systemMsg });
    }

    messages.push({ role: 'user', content: userMessage });

    const request: ChatCompletionRequest = {
      messages,
      config: this.currentConfig(),
    };

    return from(
      this.supabase.functions.invoke('openai', {
        body: request,
      })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data as ChatCompletionResponse;
      }),
      catchError(this.handleError)
    );
  }

  getAvailableModels(): Observable<string[]> {
    return from(this.supabase.functions.invoke('openrouter-models')).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data as string[];
      }),
      catchError(this.handleError)
    );
  }
}
