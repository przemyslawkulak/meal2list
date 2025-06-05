import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptimizeRequest {
  content: string;
  options: {
    maxTokens?: number;
    extractMetadata?: boolean;
    cleanContent?: boolean;
    preserveFormatting?: boolean;
  };
}

interface OptimizedContent {
  originalContent: string;
  cleanedContent: string;
  metadata: {
    title?: string;
    description?: string;
    author?: string;
    publishDate?: string;
    keywords?: string[];
    contentType?: string;
    language?: string;
  };
  tokenReduction: number;
  estimatedTokens: number;
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content, options }: OptimizeRequest = await req.json();

    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Content is required and must be a string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const originalTokens = estimateTokens(content);
    let optimizedContent = content;

    // Apply aggressive cleaning for token optimization
    if (options.cleanContent) {
      optimizedContent = aggressiveCleanText(optimizedContent);
    }

    // Apply token limit if specified
    if (options.maxTokens && options.maxTokens > 0) {
      optimizedContent = truncateToTokenLimit(optimizedContent, options.maxTokens);
    }

    // Extract enhanced metadata from content
    const metadata = extractContentMetadata(optimizedContent);

    const optimizedTokens = estimateTokens(optimizedContent);
    const tokenReduction = Math.round(((originalTokens - optimizedTokens) / originalTokens) * 100);

    const result: OptimizedContent = {
      originalContent: content,
      cleanedContent: optimizedContent,
      metadata,
      tokenReduction,
      estimatedTokens: optimizedTokens,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Content optimization error:', error);

    return new Response(
      JSON.stringify({
        error: (error as Error).message,
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function estimateTokens(text: string): number {
  // More sophisticated token estimation
  // 1 token ≈ 4 characters for most languages
  // Adjust for Polish language characteristics
  const charCount = text.length;

  // Polish has longer words on average, so adjust ratio
  return Math.ceil(charCount / 3.8);
}

function aggressiveCleanText(text: string): string {
  return (
    text
      // Remove common web elements
      .replace(
        /\b(Cookie|Cookies|Privacy Policy|Terms of Service|Subscribe|Newsletter)\b.*$/gim,
        ''
      )
      .replace(/\b(Advertisement|Reklama|Sponsored|Sponsor)\b.*$/gim, '')
      .replace(/\b(Share|Tweet|Pin|Like|Follow|Subscribe)\b.*$/gim, '')

      // Remove social media patterns
      .replace(/\b(Facebook|Twitter|Instagram|YouTube|LinkedIn)\b.*$/gim, '')
      .replace(/@\w+\s*/g, '')
      .replace(/#\w+\s*/g, '')

      // Remove navigation elements
      .replace(/\b(Menu|Navigation|Nav|Home|About|Contact|Blog)\b.*$/gim, '')
      .replace(/\b(Previous|Next|Page \d+|Load more)\b.*$/gim, '')

      // Remove repetitive content
      .replace(/(.{20,}?)(\s+\1){2,}/g, '$1') // Remove content repeated 3+ times

      // Clean whitespace
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()

      // Remove very short lines that are likely navigation/UI elements
      .split('\n')
      .filter(line => line.trim().length > 10 || /[.!?]$/.test(line.trim()))
      .join('\n')
  );
}

function truncateToTokenLimit(text: string, maxTokens: number): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let result = '';
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);
    if (currentTokens + sentenceTokens > maxTokens) {
      break;
    }
    result += sentence.trim() + '. ';
    currentTokens += sentenceTokens;
  }

  return result.trim();
}

function extractContentMetadata(content: string): {
  title?: string;
  description?: string;
  author?: string;
  publishDate?: string;
  keywords?: string[];
  contentType?: string;
  language?: string;
} {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  const firstLine = lines[0] || '';

  // Try to extract title from first line if it looks like a title
  const title = firstLine.length < 100 && firstLine.length > 5 ? firstLine : '';

  // Extract potential ingredients/instructions for recipes
  const hasIngredients = /\b(składniki|ingredients|lista składników)\b/i.test(content);
  const hasInstructions = /\b(wykonanie|przygotowanie|instructions|directions)\b/i.test(content);

  // Detect content type
  let contentType = 'article';
  if (hasIngredients && hasInstructions) {
    contentType = 'recipe';
  }

  // Extract keywords from content
  const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const wordFreq = words.reduce((acc: Record<string, number>, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  const keywords = Object.entries(wordFreq)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([word]) => word);

  return {
    title,
    description: lines.slice(1, 3).join(' ').substring(0, 200),
    contentType,
    keywords,
    language: detectLanguage(content),
  };
}

function detectLanguage(text: string): string {
  // Simple language detection for Polish vs English
  const polishWords = /\b(i|w|na|do|z|się|że|lub|oraz|dla|przez|po|przed|od|o|przy)\b/gi;
  const englishWords = /\b(the|and|in|to|of|a|is|it|you|that|he|was|for|on|are|as|with)\b/gi;

  const polishMatches = (text.match(polishWords) || []).length;
  const englishMatches = (text.match(englishWords) || []).length;

  return polishMatches > englishMatches ? 'pl' : 'en';
}
