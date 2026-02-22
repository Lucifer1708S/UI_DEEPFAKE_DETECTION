import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  organization: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

export type MediaFile = {
  id: string;
  user_id: string;
  file_name: string;
  file_type: 'image' | 'video' | 'audio';
  file_size: number;
  storage_path: string;
  mime_type: string;
  duration: number | null;
  resolution: string | null;
  uploaded_at: string;
  metadata: Record<string, unknown>;
};

export type Analysis = {
  id: string;
  media_file_id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  analysis_type: 'full' | 'visual_only' | 'audio_only' | 'metadata_only';
  confidence_score: number | null;
  is_authentic: boolean | null;
  is_manipulated: boolean | null;
  manipulation_types: string[];
  processing_time_ms: number | null;
  model_version: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type DetectionIndicator = {
  id: string;
  analysis_id: string;
  indicator_type: 'visual_artifact' | 'audio_inconsistency' | 'temporal_anomaly' | 'metadata_mismatch';
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  location_data: Record<string, unknown>;
  evidence_data: Record<string, unknown>;
  created_at: string;
};

export type ContentCertificate = {
  id: string;
  media_file_id: string;
  certificate_hash: string;
  blockchain_txid: string | null;
  blockchain_network: string;
  issuer_id: string;
  certificate_type: 'original' | 'verified_authentic' | 'verified_manipulated';
  certificate_data: Record<string, unknown>;
  valid_from: string;
  valid_until: string | null;
  revoked: boolean;
  created_at: string;
};
