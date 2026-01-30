/**
 * OpenRouter API Client
 *
 * Provides a thin wrapper around the OpenRouter API for chat completions.
 * Handles authentication, error handling, and graceful degradation.
 */

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  timeout?: number;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

/**
 * Check if OpenRouter API is configured and available
 */
export function isOpenRouterAvailable(): boolean {
  return !!process.env.OPENROUTER_API_KEY &&
         process.env.OPENROUTER_API_KEY !== 'sk-or-v1-placeholder-key';
}

/**
 * Create a chat completion using OpenRouter API
 */
export async function createChatCompletion(
  messages: Message[],
  options: ChatCompletionOptions = {}
): Promise<ChatCompletionResponse> {
  // Check if API key is available
  if (!isOpenRouterAvailable()) {
    throw new OpenRouterError(
      'OpenRouter API key is not configured',
      503,
      'API_KEY_MISSING'
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY!;
  const model = options.model || 'anthropic/claude-3.5-sonnet';
  const timeout = options.timeout || 30000; // 30 seconds default

  const requestBody = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 1000,
    top_p: options.topP ?? 1.0,
  };

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002',
        'X-Title': 'AI Help Desk',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new OpenRouterError(
          'Invalid OpenRouter API key',
          401,
          'INVALID_API_KEY'
        );
      }

      if (response.status === 429) {
        throw new OpenRouterError(
          'Rate limit exceeded. Please try again later.',
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }

      if (response.status === 503) {
        throw new OpenRouterError(
          'Model is currently unavailable. Please try again later.',
          503,
          'MODEL_UNAVAILABLE'
        );
      }

      throw new OpenRouterError(
        errorData.error?.message || `API request failed with status ${response.status}`,
        response.status,
        'API_ERROR'
      );
    }

    const data = await response.json();
    return data as ChatCompletionResponse;

  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort/timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new OpenRouterError(
        'Request timeout - the API took too long to respond',
        408,
        'TIMEOUT'
      );
    }

    // Re-throw OpenRouterError as-is
    if (error instanceof OpenRouterError) {
      throw error;
    }

    // Handle network errors
    throw new OpenRouterError(
      'Network error - unable to connect to OpenRouter API',
      0,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Test OpenRouter API connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await createChatCompletion([
      { role: 'user', content: 'Hello' }
    ], {
      maxTokens: 10,
      timeout: 5000,
    });
    return true;
  } catch (error) {
    console.error('OpenRouter connection test failed:', error);
    return false;
  }
}

/**
 * Extract text content from completion response
 */
export function extractContent(response: ChatCompletionResponse): string {
  return response.choices[0]?.message?.content || '';
}
