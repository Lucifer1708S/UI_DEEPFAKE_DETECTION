import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-API-Key",
};

async function validateApiKey(supabase: any, apiKey: string) {
  const keyHash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(apiKey)
  );
  const hashArray = Array.from(new Uint8Array(keyHash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const { data, error } = await supabase
    .from('api_keys')
    .select('*, user:profiles(*)')
    .eq('key_hash', hashHex)
    .eq('active', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  await supabase
    .from('api_keys')
    .update({
      requests_count: data.requests_count + 1,
      last_used_at: new Date().toISOString()
    })
    .eq('id', data.id);

  if (data.rate_limit && data.requests_count >= data.rate_limit) {
    return null;
  }

  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const apiKey = req.headers.get('X-API-Key');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required. Include X-API-Key header.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const apiKeyData = await validateApiKey(supabase, apiKey);

    if (!apiKeyData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired API key' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const url = new URL(req.url);
    const pathname = url.pathname;

    if (req.method === 'POST' && pathname.endsWith('/analyze')) {
      const contentType = req.headers.get('Content-Type') || '';

      if (!contentType.includes('multipart/form-data')) {
        return new Response(
          JSON.stringify({ error: 'Content-Type must be multipart/form-data' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const formData = await req.formData();
      const file = formData.get('file') as File;
      const analysisType = (formData.get('analysis_type') as string) || 'full';

      if (!file) {
        return new Response(
          JSON.stringify({ error: 'File is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        return new Response(
          JSON.stringify({ error: 'File size must be less than 100MB' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${apiKeyData.user_id}/${Date.now()}.${fileExt}`;
      const filePath = `media/${fileName}`;

      const fileBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('media-files')
        .upload(filePath, fileBuffer, {
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const getFileType = (mimeType: string): 'image' | 'video' | 'audio' => {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        return 'image';
      };

      const fileType = getFileType(file.type);

      const { data: mediaFile, error: mediaError } = await supabase
        .from('media_files')
        .insert({
          user_id: apiKeyData.user_id,
          file_name: file.name,
          file_type: fileType,
          file_size: file.size,
          storage_path: filePath,
          mime_type: file.type,
          metadata: {
            source: 'api',
            api_key_id: apiKeyData.id
          },
        })
        .select()
        .single();

      if (mediaError) {
        throw mediaError;
      }

      const { data: analysis, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          media_file_id: mediaFile.id,
          user_id: apiKeyData.user_id,
          status: 'pending',
          analysis_type: analysisType,
        })
        .select()
        .single();

      if (analysisError) {
        throw analysisError;
      }

      await supabase
        .from('audit_logs')
        .insert({
          user_id: apiKeyData.user_id,
          action: 'api_analysis_requested',
          resource_type: 'analysis',
          resource_id: analysis.id,
          details: {
            api_key_id: apiKeyData.id,
            file_name: file.name,
            file_size: file.size
          }
        });

      fetch(`${supabaseUrl}/functions/v1/analyze-media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          media_file_id: mediaFile.id,
          analysis_type: analysisType,
        }),
      }).catch(console.error);

      return new Response(
        JSON.stringify({
          success: true,
          analysis_id: analysis.id,
          media_file_id: mediaFile.id,
          status: 'pending',
          message: 'Analysis started. Use GET /api-analyze/status/{analysis_id} to check progress.'
        }),
        {
          status: 202,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'GET' && pathname.includes('/status/')) {
      const analysisId = pathname.split('/status/')[1];

      const { data: analysis, error: analysisError } = await supabase
        .from('analyses')
        .select(`
          *,
          media_file:media_files(*),
          indicators:detection_indicators(*),
          certificate:content_certificates(*)
        `)
        .eq('id', analysisId)
        .eq('user_id', apiKeyData.user_id)
        .maybeSingle();

      if (analysisError || !analysis) {
        return new Response(
          JSON.stringify({ error: 'Analysis not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const trustScore = analysis.is_authentic
        ? analysis.confidence_score
        : 100 - analysis.confidence_score;

      return new Response(
        JSON.stringify({
          analysis_id: analysis.id,
          status: analysis.status,
          media_file: {
            id: analysis.media_file.id,
            file_name: analysis.media_file.file_name,
            file_type: analysis.media_file.file_type,
          },
          result: analysis.status === 'completed' ? {
            trust_score: trustScore,
            is_authentic: analysis.is_authentic,
            is_manipulated: analysis.is_manipulated,
            confidence_score: analysis.confidence_score,
            manipulation_types: analysis.manipulation_types,
            processing_time_ms: analysis.processing_time_ms,
            indicators: analysis.indicators,
            certificate: analysis.certificate?.[0] || null,
          } : null,
          created_at: analysis.created_at,
          completed_at: analysis.completed_at,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'GET' && pathname.endsWith('/analyses')) {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      const { data: analyses, error: analysesError } = await supabase
        .from('analyses')
        .select('*, media_file:media_files(*)')
        .eq('user_id', apiKeyData.user_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (analysesError) {
        throw analysesError;
      }

      return new Response(
        JSON.stringify({
          analyses: analyses.map(a => ({
            analysis_id: a.id,
            status: a.status,
            file_name: a.media_file.file_name,
            is_authentic: a.is_authentic,
            confidence_score: a.confidence_score,
            created_at: a.created_at,
            completed_at: a.completed_at,
          })),
          limit,
          offset,
          count: analyses.length,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Not found',
        available_endpoints: {
          'POST /api-analyze/analyze': 'Submit media file for analysis',
          'GET /api-analyze/status/{analysis_id}': 'Check analysis status and results',
          'GET /api-analyze/analyses': 'List all analyses (paginated)'
        }
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('API error:', error);

    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
