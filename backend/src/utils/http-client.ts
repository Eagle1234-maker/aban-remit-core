/**
 * HTTP Client with Retry Logic
 * 
 * Provides a reusable HTTP client with built-in retry logic, timeout handling,
 * correlation ID tracking, and comprehensive logging with sensitive data redaction.
 */

import { randomUUID } from 'crypto';

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retryConfig?: RetryConfig;
  correlationId?: string;
}

export interface RetryConfig {
  maxRetries: number;
  retryableStatusCodes: number[];
  backoffMultiplier: number;
  initialDelayMs: number;
}

export interface HTTPResponse<T = any> {
  status: number;
  headers: Record<string, string>;
  data: T;
  duration: number;
}

export class HTTPError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: any,
    public readonly correlationId?: string
  ) {
    super(message);
    this.name = 'HTTPError';
  }
}

export class TimeoutError extends Error {
  constructor(
    message: string,
    public readonly timeout: number,
    public readonly correlationId?: string
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryableStatusCodes: [401, 429, 500, 502, 503, 504],
  backoffMultiplier: 2,
  initialDelayMs: 1000,
};

/**
 * Sensitive field patterns to redact in logs
 */
const SENSITIVE_PATTERNS = [
  /authorization/i,
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /bearer/i,
  /passkey/i,
];

/**
 * HTTP Client class
 */
export class HTTPClient {
  /**
   * Make HTTP request with retry logic
   */
  async request<T = any>(config: RequestConfig): Promise<HTTPResponse<T>> {
    const correlationId = config.correlationId || randomUUID();
    const retryConfig = config.retryConfig || DEFAULT_RETRY_CONFIG;
    const startTime = Date.now();

    // Log request
    this.logRequest(config, correlationId);

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= retryConfig.maxRetries) {
      try {
        const response = await this.executeRequest<T>(config, correlationId, attempt);
        const duration = Date.now() - startTime;

        // Log successful response
        this.logResponse(response, duration, correlationId, attempt);

        return { ...response, duration };
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Check if error is retryable
        if (attempt > retryConfig.maxRetries) {
          // Max retries exhausted
          this.logRetryExhaustion(error as Error, correlationId, attempt - 1);
          throw error;
        }

        const shouldRetry = this.shouldRetry(error as Error, retryConfig);
        if (!shouldRetry) {
          // Non-retryable error
          this.logNonRetryableError(error as Error, correlationId);
          throw error;
        }

        // Calculate delay for exponential backoff
        const delay = this.calculateBackoffDelay(attempt, retryConfig);
        this.logRetryAttempt(error as Error, correlationId, attempt, delay);

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Execute single HTTP request
   */
  private async executeRequest<T>(
    config: RequestConfig,
    correlationId: string,
    attempt: number
  ): Promise<HTTPResponse<T>> {
    const controller = new AbortController();
    const timeout = config.timeout || 30000;

    // Set timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
        ...config.headers,
      };

      const fetchConfig: RequestInit = {
        method: config.method,
        headers,
        signal: controller.signal,
      };

      if (config.body && (config.method === 'POST' || config.method === 'PUT')) {
        fetchConfig.body = JSON.stringify(config.body);
      }

      const response = await fetch(config.url, fetchConfig);

      // Parse response
      let data: T;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as any;
      }

      // Convert headers to object
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Check for HTTP errors
      if (!response.ok) {
        throw new HTTPError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data,
          correlationId
        );
      }

      return {
        status: response.status,
        headers: responseHeaders,
        data,
        duration: 0, // Will be set by caller
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(
          `Request timeout after ${timeout}ms`,
          timeout,
          correlationId
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if error should be retried
   */
  private shouldRetry(error: Error, retryConfig: RetryConfig): boolean {
    // Retry on timeout
    if (error instanceof TimeoutError) {
      return true;
    }

    // Retry on specific HTTP status codes
    if (error instanceof HTTPError && error.statusCode) {
      return retryConfig.retryableStatusCodes.includes(error.statusCode);
    }

    // Retry on network errors
    if (error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('fetch failed')) {
      return true;
    }

    return false;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(attempt: number, retryConfig: RetryConfig): number {
    return retryConfig.initialDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log HTTP request
   */
  private logRequest(config: RequestConfig, correlationId: string): void {
    console.log(JSON.stringify({
      level: 'info',
      type: 'http_request',
      correlationId,
      timestamp: new Date().toISOString(),
      method: config.method,
      url: config.url,
      headers: this.redactSensitiveData(config.headers || {}),
      body: this.redactSensitiveData(config.body),
    }));
  }

  /**
   * Log HTTP response
   */
  private logResponse(
    response: HTTPResponse,
    duration: number,
    correlationId: string,
    attempt: number
  ): void {
    console.log(JSON.stringify({
      level: 'info',
      type: 'http_response',
      correlationId,
      timestamp: new Date().toISOString(),
      status: response.status,
      duration,
      attempt,
      headers: this.redactSensitiveData(response.headers),
      body: this.redactSensitiveData(response.data),
    }));
  }

  /**
   * Log retry attempt
   */
  private logRetryAttempt(
    error: Error,
    correlationId: string,
    attempt: number,
    delay: number
  ): void {
    console.log(JSON.stringify({
      level: 'warn',
      type: 'http_retry',
      correlationId,
      timestamp: new Date().toISOString(),
      attempt,
      delay,
      error: error.message,
      errorType: error.name,
    }));
  }

  /**
   * Log non-retryable error
   */
  private logNonRetryableError(error: Error, correlationId: string): void {
    console.log(JSON.stringify({
      level: 'error',
      type: 'http_error_non_retryable',
      correlationId,
      timestamp: new Date().toISOString(),
      error: error.message,
      errorType: error.name,
      statusCode: (error as HTTPError).statusCode,
    }));
  }

  /**
   * Log retry exhaustion
   */
  private logRetryExhaustion(error: Error, correlationId: string, attempts: number): void {
    console.log(JSON.stringify({
      level: 'error',
      type: 'http_retry_exhausted',
      correlationId,
      timestamp: new Date().toISOString(),
      attempts,
      error: error.message,
      errorType: error.name,
      statusCode: (error as HTTPError).statusCode,
    }));
  }

  /**
   * Redact sensitive data from logs
   */
  private redactSensitiveData(data: any): any {
    if (!data) return data;

    if (typeof data === 'string') {
      return this.maskString(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.redactSensitiveData(item));
    }

    if (typeof data === 'object') {
      const redacted: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveField(key)) {
          redacted[key] = this.maskString(String(value));
        } else if (typeof value === 'object') {
          redacted[key] = this.redactSensitiveData(value);
        } else {
          redacted[key] = value;
        }
      }
      return redacted;
    }

    return data;
  }

  /**
   * Check if field name is sensitive
   */
  private isSensitiveField(fieldName: string): boolean {
    return SENSITIVE_PATTERNS.some(pattern => pattern.test(fieldName));
  }

  /**
   * Mask string showing only first and last 4 characters
   */
  private maskString(value: string): string {
    if (!value || value.length <= 8) {
      return '****';
    }
    const first4 = value.substring(0, 4);
    const last4 = value.substring(value.length - 4);
    return `${first4}...${last4}`;
  }
}

/**
 * Create singleton HTTP client instance
 */
export const httpClient = new HTTPClient();
