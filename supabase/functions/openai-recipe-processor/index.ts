import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user';
    content:
      | string
      | Array<{
          type: 'text' | 'image_url';
          text?: string;
          image_url?: { url: string };
        }>;
  }>;
  response_format: any;
  temperature: number;
  max_tokens: number;
  top_p: number;
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Parse request body
    const openaiRequest: OpenAIRequest = await req.json();

    // Validate required fields
    if (!openaiRequest.model || !openaiRequest.messages) {
      throw new Error('Missing required fields: model, messages');
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPEN_AI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Prepare OpenAI API request
    const openaiApiUrl = 'https://api.openai.com/v1/chat/completions';
    const openaiHeaders = {
      Authorization: `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    };

    // Log request for debugging (remove in production)
    console.log('OpenAI Request:', {
      model: openaiRequest.model,
      messageCount: openaiRequest.messages.length,
      hasResponseFormat: !!openaiRequest.response_format,
    });

    // Make request to OpenAI API
    const openaiResponse = await fetch(openaiApiUrl, {
      method: 'POST',
      headers: openaiHeaders,
      body: JSON.stringify({
        model: openaiRequest.model,
        messages: openaiRequest.messages,
        response_format: openaiRequest.response_format,
        temperature: openaiRequest.temperature,
        max_tokens: openaiRequest.max_tokens,
        top_p: openaiRequest.top_p,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API Error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${errorText}`);
    }

    const openaiData = await openaiResponse.json();

    // Log successful response
    console.log('OpenAI Response received:', {
      usage: openaiData.usage,
      finishReason: openaiData.choices?.[0]?.finish_reason,
    });

    // Usage logging removed - uncomment and create table if needed for monitoring

    return new Response(JSON.stringify(openaiData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Edge function error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
