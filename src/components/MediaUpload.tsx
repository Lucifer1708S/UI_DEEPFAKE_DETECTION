import { useState, useRef } from 'react';
import { Upload, X, FileVideo, FileAudio, Image, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type MediaUploadProps = {
  onComplete: () => void;
  onCancel: () => void;
};

export function MediaUpload({ onComplete, onCancel }: MediaUploadProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState<'full' | 'visual_only' | 'audio_only' | 'metadata_only'>('full');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const maxSize = 100 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        setError('File size must be less than 100MB');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const maxSize = 100 * 1024 * 1024;
      if (droppedFile.size > maxSize) {
        setError('File size must be less than 100MB');
        return;
      }
      setFile(droppedFile);
      setError('');
    }
  };

  const getFileType = (mimeType: string): 'image' | 'video' | 'audio' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'image';
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `media/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const fileType = getFileType(file.type);

      const { data: mediaFile, error: mediaError } = await supabase
        .from('media_files')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: fileType,
          file_size: file.size,
          storage_path: filePath,
          mime_type: file.type,
          metadata: {},
        })
        .select()
        .single();

      if (mediaError) throw mediaError;

      const { error: analysisError } = await supabase
        .from('analyses')
        .insert({
          media_file_id: mediaFile.id,
          user_id: user.id,
          status: 'pending',
          analysis_type: analysisType,
        });

      if (analysisError) throw analysisError;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-media`;

      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          media_file_id: mediaFile.id,
          analysis_type: analysisType,
        }),
      }).catch(console.error);

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="w-12 h-12" />;
    if (file.type.startsWith('video/')) return <FileVideo className="w-12 h-12" />;
    if (file.type.startsWith('audio/')) return <FileAudio className="w-12 h-12" />;
    return <Image className="w-12 h-12" />;
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Upload Media for Analysis</h1>
            <p className="text-slate-400">Supported formats: Images (JPG, PNG), Videos (MP4, MOV), Audio (MP3, WAV)</p>
          </div>
          <button
            onClick={onCancel}
            disabled={uploading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 space-y-6">
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-slate-900/50 transition-all"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="text-slate-400">
                  {getFileIcon()}
                </div>
                <div>
                  <p className="text-lg font-medium text-white mb-1">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-slate-400">
                    Maximum file size: 100MB
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center text-slate-300">
                  {getFileIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-sm text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!uploading && (
                  <button
                    onClick={() => setFile(null)}
                    className="flex-shrink-0 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-900/50 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Analysis Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAnalysisType('full')}
                disabled={uploading}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  analysisType === 'full'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <p className="font-medium text-white mb-1">Full Analysis</p>
                <p className="text-xs text-slate-400">Complete multi-modal detection</p>
              </button>
              <button
                type="button"
                onClick={() => setAnalysisType('visual_only')}
                disabled={uploading}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  analysisType === 'visual_only'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <p className="font-medium text-white mb-1">Visual Only</p>
                <p className="text-xs text-slate-400">Image and video analysis</p>
              </button>
              <button
                type="button"
                onClick={() => setAnalysisType('audio_only')}
                disabled={uploading}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  analysisType === 'audio_only'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <p className="font-medium text-white mb-1">Audio Only</p>
                <p className="text-xs text-slate-400">Voice and sound analysis</p>
              </button>
              <button
                type="button"
                onClick={() => setAnalysisType('metadata_only')}
                disabled={uploading}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  analysisType === 'metadata_only'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <p className="font-medium text-white mb-1">Metadata Only</p>
                <p className="text-xs text-slate-400">Forensic metadata check</p>
              </button>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Uploading and Starting Analysis...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Start Analysis
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
