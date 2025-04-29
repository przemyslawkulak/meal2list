export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
}

export interface ModelParameters {
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface ChatConfig {
  model: string;
  model_params?: ModelParameters;
  response_format?: ResponseFormat;
}

export interface ChatCompletionResponse {
  data: unknown;
  model: string;
  created: number;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  config?: ChatConfig;
}

export class OpenrouterError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'OpenrouterError';
  }
}

export class OpenrouterAuthError extends OpenrouterError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR');
    this.name = 'OpenrouterAuthError';
  }
}

export class OpenrouterRateLimitError extends OpenrouterError {
  constructor(message: string) {
    super(message, 'RATE_LIMIT');
    this.name = 'OpenrouterRateLimitError';
  }
}
