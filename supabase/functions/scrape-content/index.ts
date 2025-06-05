import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { load } from 'https://esm.sh/cheerio@1.0.0-rc.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapingRequest {
  url: string;
  options: {
    maxTokens?: number;
    extractMetadata?: boolean;
    cleanContent?: boolean;
    respectRateLimit?: boolean;
    userAgent?: string;
    contentSelector?: string;
    excludeSelectors?: string[];
    includeSelectors?: string[];
    preserveFormatting?: boolean;
  };
}

interface ScrapingResult {
  content: string;
  metadata: {
    title?: string;
    description?: string;
    author?: string;
    publishDate?: string;
    keywords?: string[];
    contentType?: string;
    language?: string;
  };
  url: string;
  scrapedAt: string;
  success: boolean;
  contentSelector?: string;
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, options }: ScrapingRequest = await req.json();

    if (!url || !isValidUrl(url)) {
      return new Response(JSON.stringify({ error: 'Invalid URL provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Respect rate limiting
    if (options.respectRateLimit) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const userAgent = options.userAgent || 'Mozilla/5.0 (compatible; DataExtractor/1.0)';

    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = load(html);

    // Extract metadata first
    const metadata = extractMetadata($);

    // Extract content using optimized selectors
    let content = '';

    if (options.contentSelector) {
      // Use specific content selector (e.g., "#block-system-main" for kwestiasmaku.com)
      const contentElement = $(options.contentSelector);
      if (contentElement.length > 0) {
        content = extractContentFromElement(contentElement, options, $);
      } else {
        console.warn(
          `Content selector "${options.contentSelector}" not found, falling back to body`
        );
        content = extractContentFromElement($('body'), options, $);
      }
    } else if (options.includeSelectors && options.includeSelectors.length > 0) {
      // Use include selectors to target specific elements
      content = options.includeSelectors
        .map(selector => extractContentFromElement($(selector), options, $))
        .filter(text => text.trim().length > 0)
        .join('\n\n');
    } else {
      // Default: extract from body with exclusions
      content = extractContentFromElement($('body'), options, $);
    }

    // Remove excluded elements
    if (options.excludeSelectors && options.excludeSelectors.length > 0) {
      const tempDiv = load(`<div>${content}</div>`);
      options.excludeSelectors.forEach(selector => {
        tempDiv(selector).remove();
      });
      content = tempDiv.text();
    }

    // Clean content if requested
    if (options.cleanContent) {
      content = cleanText(content);
    }

    const result: ScrapingResult = {
      content,
      metadata,
      url,
      scrapedAt: new Date().toISOString(),
      success: true,
      contentSelector: options.contentSelector,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Scraping error:', error);

    return new Response(
      JSON.stringify({
        error: (error as Error).message,
        success: false,
        scrapedAt: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

function extractMetadata($: ReturnType<typeof load>) {
  return {
    title: $('title').text() || $('meta[property="og:title"]').attr('content') || '',
    description:
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '',
    author:
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') ||
      '',
    publishDate:
      $('meta[property="article:published_time"]').attr('content') ||
      $('time[datetime]').attr('datetime') ||
      '',
    keywords:
      $('meta[name="keywords"]')
        .attr('content')
        ?.split(',')
        .map((k: string) => k.trim()) || [],
    contentType: $('meta[property="og:type"]').attr('content') || 'article',
    language:
      $('html').attr('lang') || $('meta[http-equiv="content-language"]').attr('content') || 'en',
  };
}

function extractContentFromElement(
  element: ReturnType<ReturnType<typeof load>>,
  options: ScrapingRequest['options'],
  $: ReturnType<typeof load>
): string {
  if (options.preserveFormatting) {
    // Preserve structure for recipes and structured content
    return element
      .find('h1, h2, h3, h4, h5, h6, p, li, div.recipe-step, .ingredient, .instruction')
      .map(function (this: any) {
        const tagName = this.tagName?.toLowerCase();
        const text = $(this).text().trim();

        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
          return `\n## ${text}\n`;
        } else if (tagName === 'li') {
          return `• ${text}`;
        } else if (text.length > 0) {
          return text;
        }
        return '';
      })
      .get()
      .filter((text: string) => text.trim().length > 0)
      .join('\n');
  } else {
    // Simple text extraction
    return element.text();
  }
}

function cleanText(text: string): string {
  return (
    text
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove multiple newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove leading/trailing whitespace
      .trim()
      // Remove common noise patterns
      .replace(/\s*(Kliknij, aby udostępnić|Share|Tweet|Pin|Like)\s*/gi, '')
      .replace(/\s*(Advertisement|Reklama|Sponsored)\s*/gi, '')
      .replace(/\s*(Cookie|Privacy Policy|Terms of Service)\s*/gi, '')
  );
}
