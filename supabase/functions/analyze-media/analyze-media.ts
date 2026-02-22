import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisRequest {
  media_file_id: string;
  analysis_type: 'full' | 'visual_only' | 'audio_only' | 'metadata_only';
}

interface DetectionIndicator {
  indicator_type: 'visual_artifact' | 'audio_inconsistency' | 'temporal_anomaly' | 'metadata_mismatch';
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  location_data: Record<string, unknown>;
  evidence_data: Record<string, unknown>;
}

function generateMockAnalysis(fileType: string, analysisType: string): {
  isAuthentic: boolean;
  confidenceScore: number;
  manipulationTypes: string[];
  indicators: DetectionIndicator[];
} {
  const random = Math.random();
  const isManipulated = random > 0.6;

  const indicators: DetectionIndicator[] = [];
  const manipulationTypes: string[] = [];

  if (isManipulated) {
    if (fileType === 'video' || fileType === 'image') {
      if (Math.random() > 0.5) {
        manipulationTypes.push('face_swap');
        indicators.push({
          indicator_type: 'visual_artifact',
          category: 'facial',
          severity: 'high',
          confidence: 85 + Math.random() * 10,
          description: 'Facial boundary inconsistencies detected - unnatural blending at jaw and neck regions',
          location_data: { regions: ['face', 'neck'], frames: [23, 45, 67] },
          evidence_data: { artifact_score: 0.87, boundary_sharpness: 0.92 }
        });
      }

      if (Math.random() > 0.6) {
        manipulationTypes.push('synthetic_generation');
        indicators.push({
          indicator_type: 'visual_artifact',
          category: 'lighting',
          severity: 'medium',
          confidence: 78 + Math.random() * 12,
          description: 'Lighting direction mismatch between subject and background',
          location_data: { regions: ['subject', 'background'] },
          evidence_data: { light_vector_angle: 45.3, consistency_score: 0.65 }
        });
      }

      if (fileType === 'video' && Math.random() > 0.7) {
        indicators.push({
          indicator_type: 'temporal_anomaly',
          category: 'facial',
          severity: 'critical',
          confidence: 91 + Math.random() * 8,
          description: 'Temporal inconsistency in facial expressions - non-biological movement patterns',
          location_data: { frame_range: [100, 250], affected_features: ['eyes', 'mouth'] },
          evidence_data: { temporal_coherence: 0.54, motion_smoothness: 0.61 }
        });
      }
    }

    if (fileType === 'audio' || (fileType === 'video' && analysisType !== 'visual_only')) {
      if (Math.random() > 0.5) {
        manipulationTypes.push('voice_clone');
        indicators.push({
          indicator_type: 'audio_inconsistency',
          category: 'voice',
          severity: 'high',
          confidence: 83 + Math.random() * 12,
          description: 'Voice spectrogram shows synthetic generation artifacts in formant structure',
          location_data: { time_ranges: [[2.3, 4.1], [7.8, 9.2]], frequency_bands: ['2-4kHz'] },
          evidence_data: { formant_consistency: 0.71, prosody_naturalness: 0.68 }
        });
      }

      if (Math.random() > 0.7) {
        indicators.push({
          indicator_type: 'audio_inconsistency',
          category: 'background',
          severity: 'medium',
          confidence: 76 + Math.random() * 10,
          description: 'Background noise profile inconsistent with claimed recording environment',
          location_data: { time_segments: [[0, 5], [10, 15]] },
          evidence_data: { noise_profile_match: 0.58, ambient_consistency: 0.63 }
        });
      }
    }

    if (analysisType === 'full' || analysisType === 'metadata_only') {
      if (Math.random() > 0.6) {
        indicators.push({
          indicator_type: 'metadata_mismatch',
          category: 'compression',
          severity: 'medium',
          confidence: 81 + Math.random() * 10,
          description: 'Multiple compression cycles detected - file has been re-encoded several times',
          location_data: { compression_layers: 3 },
          evidence_data: { compression_history: ['h264', 'vp9', 'h264'], quality_degradation: 0.34 }
        });
      }
    }
  } else {
    if (Math.random() > 0.8) {
      indicators.push({
        indicator_type: 'visual_artifact',
        category: 'compression',
        severity: 'low',
        confidence: 45 + Math.random() * 15,
        description: 'Minor compression artifacts present - typical of standard video encoding',
        location_data: { regions: ['high_frequency_areas'] },
        evidence_data: { artifact_level: 0.23, encoding_quality: 0.89 }
      });
    }
  }

  const confidenceScore = isManipulated
    ? 75 + Math.random() * 20
    : 80 + Math.random() * 15;

  return {
    isAuthentic: !isManipulated,
    confidenceScore,
    manipulationTypes: [...new Set(manipulationTypes)],
    indicators
  };
}

async function generateCertificate(supabase: any, mediaFileId: string, userId: string, isAuthentic: boolean) {
  const certificateHash = crypto.randomUUID().replace(/-/g, '');
  const blockchainTxid = `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)).join('')}`;

  const { error } = await supabase
    .from('content_certificates')
    .insert({
      media_file_id: mediaFileId,
      certificate_hash: certificateHash,
      blockchain_txid: blockchainTxid,
      blockchain_network: 'ethereum-sepolia',
      issuer_id: userId,
      certificate_type: isAuthentic ? 'verified_authentic' : 'verified_manipulated',
      certificate_data: {
        verification_method: 'multi_modal_analysis',
        timestamp: new Date().toISOString(),
        signature_algorithm: 'ECDSA-secp256k1'
      },
      valid_from: new Date().toISOString(),
    });

  if (error) {
    console.error('Error creating certificate:', error);
  }
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

    const { media_file_id, analysis_type }: AnalysisRequest = await req.json();

    if (!media_file_id) {
      return new Response(
        JSON.stringify({ error: 'media_file_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: mediaFile, error: mediaError } = await supabase
      .from('media_files')
      .select('*')
      .eq('id', media_file_id)
      .single();

    if (mediaError || !mediaFile) {
      return new Response(
        JSON.stringify({ error: 'Media file not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: existingAnalysis } = await supabase
      .from('analyses')
      .select('id')
      .eq('media_file_id', media_file_id)
      .maybeSingle();

    if (!existingAnalysis) {
      return new Response(
        JSON.stringify({ error: 'Analysis not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const startTime = Date.now();

    await supabase
      .from('analyses')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .eq('id', existingAnalysis.id);

    await supabase
      .from('audit_logs')
      .insert({
        user_id: mediaFile.user_id,
        action: 'analysis_started',
        resource_type: 'analysis',
        resource_id: existingAnalysis.id,
        details: { media_file_id, analysis_type }
      });

    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    const analysisResult = generateMockAnalysis(mediaFile.file_type, analysis_type);
    const processingTime = Date.now() - startTime;

    const { error: updateError } = await supabase
      .from('analyses')
      .update({
        status: 'completed',
        confidence_score: analysisResult.confidenceScore,
        is_authentic: analysisResult.isAuthentic,
        is_manipulated: !analysisResult.isAuthentic,
        manipulation_types: analysisResult.manipulationTypes,
        processing_time_ms: processingTime,
        completed_at: new Date().toISOString(),
      })
      .eq('id', existingAnalysis.id);

    if (updateError) {
      throw updateError;
    }

    for (const indicator of analysisResult.indicators) {
      await supabase
        .from('detection_indicators')
        .insert({
          analysis_id: existingAnalysis.id,
          ...indicator
        });
    }

    await generateCertificate(
      supabase,
      media_file_id,
      mediaFile.user_id,
      analysisResult.isAuthentic
    );

    await supabase
      .from('audit_logs')
      .insert({
        user_id: mediaFile.user_id,
        action: 'analysis_completed',
        resource_type: 'analysis',
        resource_id: existingAnalysis.id,
        details: {
          confidence_score: analysisResult.confidenceScore,
          is_authentic: analysisResult.isAuthentic,
          indicators_count: analysisResult.indicators.length
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        analysis_id: existingAnalysis.id,
        result: analysisResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Analysis error:', error);

    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
