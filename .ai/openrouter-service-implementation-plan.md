# OpenRouter Service Implementation Plan

## 1. Service Description

The goal of `OpenrouterService` is to abstract communication with the OpenRouter.ai API (Chat Completions). It allows building message sequences (system, user, assistant), defining response format (JSON Schema), choosing a model and model parameters, and complex error handling.

**Tech Stack:**

- Frontend: Angular 19, TypeScript 5, Angular Material
- Reactive: RxJS (no Promises)
- Backend (Edge Function): Supabase (secret management, hosting Edge Functions)
- AI: OpenRouter.ai (cost limiting, model selection)
- CI/CD & Hosting: GitHub Actions, DigitalOcean
- Code Quality: ESLint (@angular-eslint, @typescript-eslint), Prettier, Husky + lint-staged

Implementation principles are based on modular Angular architecture, DI, early returns (guard clauses), and responsive RxJS stream handling.

## 2. Constructor Description

```ts
// src/app/core/openrouter/openrouter.service.ts
environment{
  providedIn: 'root'
}
constructor(
  private http: HttpClient,
  @Inject('OPENROUTER_API_URL') private baseUrl: string,
  @Inject('OPENROUTER_API_KEY') private apiKey: string
) {}
```

- `HttpClient` for HTTP communication
- DI tokens (`baseUrl`, `apiKey`) defined in `app.module.ts` or a dedicated module
- `providedIn: 'root'` ensures a singleton across the entire application

## 3. Public Methods and Fields

- setSystemMessage(message: string): void
  - Sets the system prompt for subsequent chat messages.
- setUserMessage(message: string): void
  - Stores the user message before sending.
- setResponseFormat(schema: JSONSchema): void
  - Configures the JSON Schema for structured responses (`response_format`).
- setModel(name: string, parameters: ModelParameters): void
  - Chooses the model (`model`) and sets its parameters (`temperature`, `top_p`, `frequency_penalty`, `presence_penalty`).
- sendChatMessage(userMessage: string): Promise<ChatCompletionResponse>
  - Sends the given user message along with the configured system message, model, and response format to the API and returns a Promise of the completion response.
- getAvailableModels(): Observable<string[]> (optional)
  - Fetches a list of supported model names from the API.

## 4. Private Methods and Fields

- `private buildPayload(messages: ChatMessage[], config?: ChatConfig): ChatRequestPayload`
- `private handleError(err: HttpErrorResponse): Observable<never>`
  - Distinguishes network errors, HTTP errors (401, 429, 5xx), parsing errors

## 5. Error Handling

1. Network error (offline, timeout)
2. Authorization error (401 Unauthorized)
3. Rate limit error (429 Too Many Requests)
4. Server error (5xx)
5. Invalid response format (JSON parsing)

**Approach:**

- Guard clauses at the beginning of the method
- Throwing specialized errors (e.g. `OpenrouterAuthError`, `OpenrouterRateLimitError`)
- Global `ErrorInterceptor` for logging and displaying user-friendly UI

## 6. Security Considerations

- API key stored in Supabase Edge Function or `environment.ts` (not in frontend bundle)
- HTTPS / TLS
- Limited CORS on the backend
- Rate limiting and retry with backoff in Edge Function
- Validation of response_format and schema strict

## 7. Step-by-step Deployment Plan

1. Create a directory `src/app/core/openrouter`
2. Add `openrouter.models.ts` with interfaces:
   ```ts
   export interface ChatMessage {
     role: 'system' | 'user' | 'assistant';
     content: string;
   }
   export interface ResponseFormat {
     type: 'json_schema';
     json_schema: { name: string; strict: boolean; schema: Record<string, any> };
   }
   export interface ChatConfig {
     model: string;
     model_params?: Record<string, any>;
     response_format?: ResponseFormat;
   }
   export interface ChatCompletionResponse {
     data: any;
   }
   ```
3. Create `openrouter.service.ts`:
   - Inject `HttpClient`, `OPENROUTER_API_URL`, and `OPENROUTER_API_KEY`
   - Implement public methods:
     - `setSystemMessage(message: string)`
     - `setUserMessage(message: string)`
     - `setResponseFormat(schema: JSONSchema)`
     - `setModel(name: string, parameters: ModelParameters)`
     - `sendChatMessage(userMessage: string)` (returns a Promise)
     - `getAvailableModels()`
   - Use RxJS and `lastValueFrom` where converting Observables to Promise for `sendChatMessage` implementation
4. Register tokens and `HttpClientModule` in `app.module.ts`
5. Example usage in a component:
   ```ts
   this.openrouterService
     .sendMessage(
       [
         { role: 'system', content: 'You are a helpful assistant.' },
         { role: 'user', content: 'Hello, how are you?' },
       ],
       {
         model: 'gpt-4',
         model_params: { temperature: 0.7, top_p: 0.9 },
         response_format: {
           type: 'json_schema',
           json_schema: {
             name: 'chatResponseSchema',
             strict: true,
             schema: { reply: { type: 'string' }, sentiment: { type: 'number' } },
           },
         },
       }
     )
     .subscribe(response => console.log(response.data));
   ```

### Numbered integration examples

1. System message:
   ```ts
   { role: 'system', content: 'You are an AI assistant that translates text.' }
   ```
2. User message:
   ```ts
   { role: 'user', content: 'Translate "Hello" to French.' }
   ```
3. Structured responses (response_format):
   ```ts
   response_format = {
     type: 'json_schema',
     json_schema: {
       name: 'translationSchema',
       strict: true,
       schema: { original: { type: 'string' }, translated: { type: 'string' } },
     },
   };
   ```
4. Model name:
   ```ts
   model: 'gpt-4';
   ```
5. Model parameters:
   ```ts
   model_params = { temperature: 0.3, top_p: 0.8 };
   ```
