import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RobotsRequest {
  url: string;
}

interface RobotsResponse {
  allowed: boolean;
  robotsUrl: string;
  userAgent: string;
  reason?: string;
  crawlDelay?: number;
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url }: RobotsRequest = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL is required and must be a string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await checkRobotsPermission(url);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Robots check error:', error);

    return new Response(
      JSON.stringify({
        error: (error as Error).message,
        allowed: true, // Default to allowed if check fails
        reason: 'robots.txt check failed',
      }),
      {
        status: 200, // Return 200 to allow fallback
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function checkRobotsPermission(url: string): Promise<RobotsResponse> {
  try {
    const parsedUrl = new URL(url);
    const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`;
    const userAgent = 'DataExtractor';

    // Fetch robots.txt with timeout
    const response = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'DataExtractor/1.0 (compatible bot)',
      },
    });

    if (!response.ok) {
      // If robots.txt doesn't exist, assume allowed
      return {
        allowed: true,
        robotsUrl,
        userAgent,
        reason: 'robots.txt not found - defaulting to allowed',
      };
    }

    const robotsText = await response.text();
    const permission = parseRobotsTxt(robotsText, userAgent, parsedUrl.pathname);

    return {
      allowed: permission.allowed,
      robotsUrl,
      userAgent,
      reason: permission.reason,
      crawlDelay: permission.crawlDelay,
    };
  } catch (error) {
    // On any error, default to allowed but with warning
    return {
      allowed: true,
      robotsUrl: '',
      userAgent: 'DataExtractor',
      reason: `Error checking robots.txt: ${(error as Error).message}`,
    };
  }
}

interface RobotsPermission {
  allowed: boolean;
  reason: string;
  crawlDelay?: number;
}

function parseRobotsTxt(robotsText: string, userAgent: string, path: string): RobotsPermission {
  const lines = robotsText.split('\n').map(line => line.trim().toLowerCase());
  let currentUserAgent = '';
  let isRelevantSection = false;
  let crawlDelay: number | undefined;
  const disallowedPaths: string[] = [];
  const allowedPaths: string[] = [];

  for (const line of lines) {
    if (line.startsWith('#') || line === '') {
      continue; // Skip comments and empty lines
    }

    if (line.startsWith('user-agent:')) {
      currentUserAgent = line.substring(11).trim();
      isRelevantSection =
        currentUserAgent === '*' ||
        currentUserAgent === userAgent.toLowerCase() ||
        currentUserAgent === 'dataextractor';
      continue;
    }

    if (!isRelevantSection) {
      continue;
    }

    if (line.startsWith('disallow:')) {
      const disallowPath = line.substring(9).trim();
      if (disallowPath) {
        disallowedPaths.push(disallowPath);
      }
    } else if (line.startsWith('allow:')) {
      const allowPath = line.substring(6).trim();
      if (allowPath) {
        allowedPaths.push(allowPath);
      }
    } else if (line.startsWith('crawl-delay:')) {
      const delay = parseInt(line.substring(12).trim());
      if (!isNaN(delay)) {
        crawlDelay = delay;
      }
    }
  }

  // Check if path is explicitly allowed (takes precedence)
  for (const allowedPath of allowedPaths) {
    if (pathMatches(path, allowedPath)) {
      return {
        allowed: true,
        reason: `Path explicitly allowed by: Allow: ${allowedPath}`,
        crawlDelay,
      };
    }
  }

  // Check if path is disallowed
  for (const disallowedPath of disallowedPaths) {
    if (pathMatches(path, disallowedPath)) {
      return {
        allowed: false,
        reason: `Path disallowed by: Disallow: ${disallowedPath}`,
        crawlDelay,
      };
    }
  }

  // If no specific rules apply, default to allowed
  return {
    allowed: true,
    reason: 'No matching disallow rules found',
    crawlDelay,
  };
}

function pathMatches(path: string, pattern: string): boolean {
  if (pattern === '/') {
    return true; // Disallow all
  }

  if (pattern === '') {
    return false; // Allow all
  }

  // Handle wildcard patterns
  if (pattern.includes('*')) {
    const regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
      .replace(/\\\*/g, '.*'); // Convert * to .*

    const regex = new RegExp(`^${regexPattern}`);
    return regex.test(path);
  }

  // Simple prefix matching
  return path.startsWith(pattern);
}
