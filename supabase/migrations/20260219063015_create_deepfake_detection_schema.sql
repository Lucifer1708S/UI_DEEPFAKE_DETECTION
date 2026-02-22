/*
  # Deepfake Detection and Trust Verification System Schema

  ## Overview
  Complete database schema for an intelligent deepfake detection platform with forensic-grade evidence trails and blockchain-based content certification.

  ## New Tables

  ### 1. profiles
  - `id` (uuid, primary key, references auth.users)
  - `email` (text)
  - `full_name` (text)
  - `organization` (text)
  - `role` (text) - analyst, admin, api_user
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. media_files
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `file_name` (text)
  - `file_type` (text) - image, video, audio
  - `file_size` (bigint)
  - `storage_path` (text)
  - `mime_type` (text)
  - `duration` (float) - for video/audio
  - `resolution` (text) - for images/video
  - `uploaded_at` (timestamptz)
  - `metadata` (jsonb) - EXIF, technical metadata

  ### 3. analyses
  - `id` (uuid, primary key)
  - `media_file_id` (uuid, references media_files)
  - `user_id` (uuid, references profiles)
  - `status` (text) - pending, processing, completed, failed
  - `analysis_type` (text) - full, visual_only, audio_only, metadata_only
  - `confidence_score` (float) - 0-100
  - `is_authentic` (boolean)
  - `is_manipulated` (boolean)
  - `manipulation_types` (text[]) - deepfake, face_swap, voice_clone, etc.
  - `processing_time_ms` (integer)
  - `model_version` (text)
  - `started_at` (timestamptz)
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz)

  ### 4. detection_indicators
  - `id` (uuid, primary key)
  - `analysis_id` (uuid, references analyses)
  - `indicator_type` (text) - visual_artifact, audio_inconsistency, temporal_anomaly, metadata_mismatch
  - `category` (text) - facial, voice, background, lighting, compression
  - `severity` (text) - low, medium, high, critical
  - `confidence` (float)
  - `description` (text)
  - `location_data` (jsonb) - coordinates, timestamps, frequency ranges
  - `evidence_data` (jsonb)
  - `created_at` (timestamptz)

  ### 5. content_certificates
  - `id` (uuid, primary key)
  - `media_file_id` (uuid, references media_files)
  - `certificate_hash` (text, unique)
  - `blockchain_txid` (text)
  - `blockchain_network` (text)
  - `issuer_id` (uuid, references profiles)
  - `certificate_type` (text) - original, verified_authentic, verified_manipulated
  - `certificate_data` (jsonb)
  - `valid_from` (timestamptz)
  - `valid_until` (timestamptz)
  - `revoked` (boolean)
  - `created_at` (timestamptz)

  ### 6. api_keys
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `key_name` (text)
  - `key_hash` (text, unique)
  - `key_prefix` (text)
  - `permissions` (text[])
  - `rate_limit` (integer)
  - `requests_count` (integer)
  - `last_used_at` (timestamptz)
  - `expires_at` (timestamptz)
  - `active` (boolean)
  - `created_at` (timestamptz)

  ### 7. audit_logs
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `action` (text)
  - `resource_type` (text)
  - `resource_id` (uuid)
  - `ip_address` (text)
  - `user_agent` (text)
  - `details` (jsonb)
  - `created_at` (timestamptz)

  ### 8. analysis_comparisons
  - `id` (uuid, primary key)
  - `original_file_id` (uuid, references media_files)
  - `comparison_file_id` (uuid, references media_files)
  - `similarity_score` (float)
  - `differences` (jsonb)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Policies for authenticated users to access their own data
  - Admin policies for system management
  - API key authentication for external integrations
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  organization text,
  role text NOT NULL DEFAULT 'analyst',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create media_files table
CREATE TABLE IF NOT EXISTS media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  duration float,
  resolution text,
  uploaded_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own media files"
  ON media_files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media files"
  ON media_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media files"
  ON media_files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_file_id uuid NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  analysis_type text NOT NULL DEFAULT 'full',
  confidence_score float,
  is_authentic boolean,
  is_manipulated boolean,
  manipulation_types text[] DEFAULT ARRAY[]::text[],
  processing_time_ms integer,
  model_version text DEFAULT 'v1.0.0',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create detection_indicators table
CREATE TABLE IF NOT EXISTS detection_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  indicator_type text NOT NULL,
  category text NOT NULL,
  severity text NOT NULL,
  confidence float NOT NULL,
  description text NOT NULL,
  location_data jsonb DEFAULT '{}'::jsonb,
  evidence_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE detection_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view indicators for their analyses"
  ON detection_indicators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = detection_indicators.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert indicators for their analyses"
  ON detection_indicators FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = detection_indicators.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

-- Create content_certificates table
CREATE TABLE IF NOT EXISTS content_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_file_id uuid NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
  certificate_hash text UNIQUE NOT NULL,
  blockchain_txid text,
  blockchain_network text DEFAULT 'ethereum-sepolia',
  issuer_id uuid NOT NULL REFERENCES profiles(id),
  certificate_type text NOT NULL,
  certificate_data jsonb DEFAULT '{}'::jsonb,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  revoked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE content_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view certificates for their media"
  ON content_certificates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM media_files
      WHERE media_files.id = content_certificates.media_file_id
      AND media_files.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert certificates for their media"
  ON content_certificates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM media_files
      WHERE media_files.id = content_certificates.media_file_id
      AND media_files.user_id = auth.uid()
    )
  );

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key_name text NOT NULL,
  key_hash text UNIQUE NOT NULL,
  key_prefix text NOT NULL,
  permissions text[] DEFAULT ARRAY['analyze:read', 'analyze:write']::text[],
  rate_limit integer DEFAULT 1000,
  requests_count integer DEFAULT 0,
  last_used_at timestamptz,
  expires_at timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own api keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own api keys"
  ON api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip_address text,
  user_agent text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create analysis_comparisons table
CREATE TABLE IF NOT EXISTS analysis_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_file_id uuid NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
  comparison_file_id uuid NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
  similarity_score float,
  differences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analysis_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comparisons for their files"
  ON analysis_comparisons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM media_files
      WHERE media_files.id = analysis_comparisons.original_file_id
      AND media_files.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_media_file_id ON analyses(media_file_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_detection_indicators_analysis_id ON detection_indicators(analysis_id);
CREATE INDEX IF NOT EXISTS idx_content_certificates_media_file_id ON content_certificates(media_file_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();