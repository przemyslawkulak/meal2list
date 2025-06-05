import { Injectable, Inject } from '@angular/core';
import { Observable, from, of, throwError, timer } from 'rxjs';
import { map, catchError, retry, switchMap, retryWhen, tap, concatMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { AppEnvironment } from '@app/app.config';
import {
  ScrapingRequestDto,
  ScrapedContentDto,
  ScrapingOptionsDto,
  OptimizedContentDto,
  ScrapingErrorDto,
  FallbackStrategy,
} from '../../../types';

interface DomainConfig {
  domain: string;
  contentSelector?: string;
  excludeSelectors?: string[];
  includeSelectors?: string[];
  preserveFormatting?: boolean;
  rateLimitMs?: number;
  userAgent?: string;
}

interface RateLimitEntry {
  domain: string;
  lastRequest: number;
  requestCount: number;
  resetTime: number;
}

@Injectable({
  providedIn: 'root',
})
export class ScrapingService extends SupabaseService {
  private readonly MAX_RETRIES = 1;
  private readonly DEFAULT_USER_AGENT = 'Mozilla/5.0 (compatible; DataExtractor/1.0)';
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly MAX_REQUESTS_PER_DOMAIN = 10;

  private fallbackStrategies: FallbackStrategy[] = [
    { name: 'cheerio', priority: 1, enabled: true },
    { name: 'jsdom', priority: 2, enabled: true },
    { name: 'browser_service', priority: 3, enabled: false },
  ];

  private rateLimitMap = new Map<string, RateLimitEntry>();

  // Predefined configurations for known websites
  private domainConfigs: DomainConfig[] = [
    {
      domain: 'kwestiasmaku.com',
      contentSelector: '#block-system-main',
      excludeSelectors: ['.ads', '.social-share', '.navigation', '.footer', '.sidebar'],
      preserveFormatting: true,
      rateLimitMs: 2000,
    },
    {
      domain: 'aniagotuje.pl',
      contentSelector: '.article-content',
      excludeSelectors: ['.advertisement', '.social-icons', '.related-posts'],
      preserveFormatting: true,
      rateLimitMs: 2000,
    },
    {
      domain: 'przepisy.pl',
      contentSelector: '.recipe-content, .post-content',
      excludeSelectors: ['.ads', '.comments', '.social-share'],
      preserveFormatting: true,
      rateLimitMs: 2000,
    },
    {
      domain: 'allrecipes.com',
      contentSelector: '.recipe-card-container, .entry-details',
      excludeSelectors: ['.advertisement', '.social-share', '.comments'],
      preserveFormatting: true,
      rateLimitMs: 1000,
    },
  ];

  constructor(@Inject('APP_ENVIRONMENT') environment: AppEnvironment) {
    super(environment);
  }

  /**
   * Enhanced main method with domain-specific optimizations
   */
  scrapeAndPreprocess(request: ScrapingRequestDto): Observable<ScrapedContentDto> {
    if (!this.isValidUrl(request.url)) {
      return throwError(() =>
        this.createScrapingError(request.url, 'PARSING_ERROR', 'Invalid URL format', 400)
      );
    }

    const domain = this.extractDomain(request.url);
    const domainConfig = this.getDomainConfig(domain);
    const enhancedOptions = this.mergeOptionsWithDomainConfig(request.options, domainConfig);

    // Check rate limiting
    return this.checkRateLimit(domain).pipe(
      switchMap(() => this.checkRobotsPermission(request.url)),
      switchMap(robotsAllowed => {
        if (!robotsAllowed) {
          return throwError(() =>
            this.createScrapingError(request.url, 'BLOCKED', 'Access denied by robots.txt', 403)
          );
        }
        return this.performEnhancedScraping(request.url, enhancedOptions);
      }),
      switchMap(content => this.optimizeContent(content, enhancedOptions)),
      map(optimizedContent => this.buildScrapedContentDto(request.url, optimizedContent)),
      retryWhen(errors => this.exponentialBackoffRetry(errors, this.MAX_RETRIES)),
      catchError(error => this.handleScrapingError(request.url, error))
    );
  }

  /**
   * Batch scraping with intelligent rate limiting
   */
  scrapeMultipleUrls(requests: ScrapingRequestDto[]): Observable<ScrapedContentDto[]> {
    return from(requests).pipe(
      concatMap((request, index) =>
        timer(index * 1000).pipe(
          // 1 second delay between requests
          switchMap(() => this.scrapeAndPreprocess(request))
        )
      ),
      // Collect all results
      map(result => [result]),
      retry(2),
      catchError(error => {
        console.error('Batch scraping error:', error);
        return of([]);
      })
    );
  }

  /**
   * Get suggested selectors for a domain
   */
  getSuggestedSelectors(url: string): Observable<DomainConfig | null> {
    const domain = this.extractDomain(url);
    const config = this.getDomainConfig(domain);
    return of(config);
  }

  /**
   * Add or update domain configuration
   */
  updateDomainConfig(config: DomainConfig): void {
    const existingIndex = this.domainConfigs.findIndex(c => c.domain === config.domain);
    if (existingIndex >= 0) {
      this.domainConfigs[existingIndex] = config;
    } else {
      this.domainConfigs.push(config);
    }
  }

  // Enhanced private methods

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  private getDomainConfig(domain: string): DomainConfig | null {
    return (
      this.domainConfigs.find(
        config => domain.includes(config.domain) || config.domain.includes(domain)
      ) || null
    );
  }

  private mergeOptionsWithDomainConfig(
    options?: ScrapingOptionsDto,
    domainConfig?: DomainConfig | null
  ): Required<ScrapingOptionsDto> {
    const baseOptions = this.mergeDefaultOptions(options);

    if (domainConfig) {
      return {
        ...baseOptions,
        contentSelector: domainConfig.contentSelector || baseOptions.contentSelector,
        excludeSelectors: domainConfig.excludeSelectors || baseOptions.excludeSelectors,
        includeSelectors: domainConfig.includeSelectors || baseOptions.includeSelectors,
        preserveFormatting: domainConfig.preserveFormatting ?? baseOptions.preserveFormatting,
        userAgent: domainConfig.userAgent || baseOptions.userAgent,
      };
    }

    return baseOptions;
  }

  private checkRateLimit(domain: string): Observable<void> {
    const now = Date.now();
    const entry = this.rateLimitMap.get(domain);

    if (!entry) {
      this.rateLimitMap.set(domain, {
        domain,
        lastRequest: now,
        requestCount: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW,
      });
      return of(void 0);
    }

    // Reset counter if window has passed
    if (now > entry.resetTime) {
      entry.requestCount = 1;
      entry.resetTime = now + this.RATE_LIMIT_WINDOW;
      entry.lastRequest = now;
      return of(void 0);
    }

    // Check if rate limit exceeded
    if (entry.requestCount >= this.MAX_REQUESTS_PER_DOMAIN) {
      const waitTime = entry.resetTime - now;
      return throwError(() =>
        this.createScrapingError(
          domain,
          'RATE_LIMIT',
          `Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds`,
          429
        )
      );
    }

    // Enforce minimum delay between requests
    const timeSinceLastRequest = now - entry.lastRequest;
    const minDelay = 1000; // 1 second minimum

    if (timeSinceLastRequest < minDelay) {
      const delayNeeded = minDelay - timeSinceLastRequest;
      return timer(delayNeeded).pipe(
        tap(() => {
          entry.requestCount++;
          entry.lastRequest = Date.now();
        }),
        map(() => void 0)
      );
    }

    entry.requestCount++;
    entry.lastRequest = now;
    return of(void 0);
  }

  private performEnhancedScraping(
    url: string,
    options: Required<ScrapingOptionsDto>
  ): Observable<string> {
    return this.callEdgeFunction('scrape-content', { url, options }).pipe(
      map(response => {
        const data = response.data as { content?: string } | undefined;
        if (!data?.content) {
          throw new Error('No content received from scraping service');
        }
        return data.content;
      }),
      catchError(error => {
        // Try fallback strategies
        return this.tryFallbackStrategies(url, options, error);
      })
    );
  }

  private tryFallbackStrategies(
    url: string,
    options: Required<ScrapingOptionsDto>,
    originalError: Error
  ): Observable<string> {
    const enabledStrategies = this.fallbackStrategies
      .filter(s => s.enabled)
      .sort((a, b) => a.priority - b.priority);

    if (enabledStrategies.length === 0) {
      return throwError(() => originalError);
    }

    // For now, return the original error since fallback implementations
    // would require additional Edge Functions
    return throwError(() => originalError);
  }

  private exponentialBackoffRetry(
    errors: Observable<Error>,
    maxRetries: number
  ): Observable<unknown> {
    return errors.pipe(
      switchMap((error, index) => {
        if (index >= maxRetries) {
          return throwError(() => error);
        }

        const delayTime = Math.min(1000 * Math.pow(2, index), 10000); // Max 10 seconds
        console.warn(`Retry attempt ${index + 1}/${maxRetries} after ${delayTime}ms delay`);

        return timer(delayTime);
      })
    );
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  private mergeDefaultOptions(options?: ScrapingOptionsDto): Required<ScrapingOptionsDto> {
    return {
      maxTokens: options?.maxTokens ?? 4000,
      extractMetadata: options?.extractMetadata ?? true,
      cleanContent: options?.cleanContent ?? true,
      respectRateLimit: options?.respectRateLimit ?? true,
      userAgent: options?.userAgent ?? this.DEFAULT_USER_AGENT,
      contentSelector: options?.contentSelector ?? '',
      excludeSelectors: options?.excludeSelectors ?? [],
      includeSelectors: options?.includeSelectors ?? [],
      preserveFormatting: options?.preserveFormatting ?? false,
    };
  }

  private performScraping(url: string, options: Required<ScrapingOptionsDto>): Observable<string> {
    return this.callEdgeFunction('scrape-content', { url, options }).pipe(
      map(response => {
        const data = response.data as { content?: string } | undefined;
        if (!data?.content) {
          throw new Error('No content received from scraping service');
        }
        return data.content;
      })
    );
  }

  private optimizeContent(
    content: string,
    options: Required<ScrapingOptionsDto>
  ): Observable<OptimizedContentDto> {
    return this.callEdgeFunction('optimize-content', { content, options }).pipe(
      map(response => response.data as OptimizedContentDto)
    );
  }

  private buildScrapedContentDto(
    url: string,
    optimizedContent: OptimizedContentDto
  ): ScrapedContentDto {
    return {
      url,
      title: optimizedContent.metadata.title,
      content: optimizedContent.cleanedContent,
      metadata: optimizedContent.metadata,
      tokenCount: optimizedContent.estimatedTokens,
      scrapedAt: new Date().toISOString(),
      success: true,
    };
  }

  private createScrapingError(
    url: string,
    errorType: ScrapingErrorDto['errorType'],
    message: string,
    statusCode?: number
  ): ScrapingErrorDto {
    return {
      url,
      errorType,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    };
  }

  private handleScrapingError(url: string, error: unknown): Observable<ScrapedContentDto> {
    const scrapingError = this.createScrapingError(
      url,
      this.determineErrorType(error),
      error instanceof Error
        ? error.message
        : error && typeof error === 'object' && 'message' in error
          ? (error as { message: string }).message
          : 'Unknown scraping error',
      error && typeof error === 'object' && 'status' in error
        ? (error as { status: number }).status
        : undefined
    );

    console.error('Scraping failed:', scrapingError);

    return of({
      url,
      content: '',
      scrapedAt: new Date().toISOString(),
      success: false,
      error: scrapingError.message,
    });
  }

  private determineErrorType(error: unknown): ScrapingErrorDto['errorType'] {
    const hasStatus = error && typeof error === 'object' && 'status' in error;
    const hasName = error && typeof error === 'object' && 'name' in error;
    const status = hasStatus ? (error as { status: number }).status : 0;
    const name = hasName ? (error as { name: string }).name : '';

    if (status === 429) return 'RATE_LIMIT';
    if (status === 403 || status === 401) return 'BLOCKED';
    if (name === 'TimeoutError') return 'TIMEOUT';
    if (status >= 400 && status < 500) return 'NETWORK_ERROR';
    return 'PARSING_ERROR';
  }

  private callEdgeFunction(
    functionName: string,
    payload: Record<string, unknown>
  ): Observable<{ data?: unknown; error?: unknown }> {
    return from(
      this.supabase.functions.invoke(functionName, {
        body: payload,
      })
    ).pipe(
      map(response => {
        if (response.error) {
          throw response.error;
        }
        return response;
      })
    );
  }

  /**
   * Get estimated token count for a text
   */
  estimateTokenCount(text: string): Observable<number> {
    return of(Math.ceil(text.length / 4)); // Rough estimate: 1 token ≈ 4 characters
  }

  /**
   * Check if scraping is allowed for a domain
   */
  checkRobotsPermission(url: string): Observable<boolean> {
    return this.callEdgeFunction('check-robots', { url }).pipe(
      map(response => {
        const data = response.data as { allowed?: boolean } | undefined;
        return data?.allowed ?? true;
      }),
      catchError(() => of(true)) // Default to allowed if robots.txt check fails
    );
  }

  /**
   * Simple scraping method for form components - returns cleaned text content
   * This is a simplified wrapper around scrapeAndPreprocess for direct URL-to-text conversion
   */
  scrapeUrl(url: string): Observable<string> {
    const request: ScrapingRequestDto = {
      url,
      options: {
        maxTokens: 10000, // Match the character limit from plan
        cleanContent: true,
        respectRateLimit: true,
        preserveFormatting: false, // Simplified for form usage
      },
    };

    return this.scrapeAndPreprocess(request).pipe(
      map((result: ScrapedContentDto) => {
        if (!result.success || !result.content) {
          throw new Error(result.error || 'Failed to extract content from URL');
        }
        return result.content;
      }),
      catchError(error => {
        // Simplify error handling for form usage
        const message =
          error instanceof Error
            ? error.message
            : 'Scraping failed. Please check the URL and try again.';
        return throwError(() => new Error(message));
      })
    );
  }
}
