import { useState, useEffect } from 'react';
import { Upload, FileVideo, FileAudio, Image, Search, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { supabase, MediaFile, Analysis } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MediaUpload } from './MediaUpload';
import { AnalysisResults } from './AnalysisResults';

export function Dashboard() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<(Analysis & { media_file: MediaFile })[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadAnalyses();
  }, [user]);

  const loadAnalyses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('analyses')
        .select(`
          *,
          media_file:media_files(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error loading analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <FileVideo className="w-5 h-5" />;
      case 'audio':
        return <FileAudio className="w-5 h-5" />;
      default:
        return <Image className="w-5 h-5" />;
    }
  };

  const getTrustScore = (analysis: Analysis) => {
    if (!analysis.confidence_score) return null;
    if (analysis.is_authentic) return analysis.confidence_score;
    return 100 - analysis.confidence_score;
  };

  const getTrustLevel = (score: number | null) => {
    if (score === null) return { label: 'Analyzing', color: 'text-slate-400', bg: 'bg-slate-700' };
    if (score >= 85) return { label: 'Highly Trusted', color: 'text-green-400', bg: 'bg-green-900/30' };
    if (score >= 70) return { label: 'Trusted', color: 'text-green-400', bg: 'bg-green-900/30' };
    if (score >= 50) return { label: 'Uncertain', color: 'text-yellow-400', bg: 'bg-yellow-900/30' };
    if (score >= 30) return { label: 'Suspicious', color: 'text-orange-400', bg: 'bg-orange-900/30' };
    return { label: 'Highly Suspicious', color: 'text-red-400', bg: 'bg-red-900/30' };
  };

  if (selectedAnalysis) {
    return (
      <AnalysisResults
        analysisId={selectedAnalysis}
        onBack={() => {
          setSelectedAnalysis(null);
          loadAnalyses();
        }}
      />
    );
  }

  if (showUpload) {
    return (
      <MediaUpload
        onComplete={() => {
          setShowUpload(false);
          loadAnalyses();
        }}
        onCancel={() => setShowUpload(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analysis Dashboard</h1>
            <p className="text-slate-400">Review and manage your media authenticity analyses</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload Media
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : analyses.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-full mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No analyses yet</h3>
            <p className="text-slate-400 mb-6">Upload your first media file to start detecting deepfakes</p>
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Upload className="w-5 h-5" />
              Upload Media
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analyses.map((analysis) => {
              const trustScore = getTrustScore(analysis);
              const trustLevel = getTrustLevel(trustScore);

              return (
                <button
                  key={analysis.id}
                  onClick={() => setSelectedAnalysis(analysis.id)}
                  className="bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-2xl p-6 text-left transition-all hover:transform hover:scale-[1.02]"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center text-slate-300">
                      {getFileTypeIcon(analysis.media_file.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white mb-1 truncate">
                        {analysis.media_file.file_name}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {new Date(analysis.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusIcon(analysis.status)}
                    </div>
                  </div>

                  {analysis.status === 'completed' && trustScore !== null && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Trust Score</span>
                        <span className={`text-2xl font-bold ${trustLevel.color}`}>
                          {trustScore.toFixed(0)}%
                        </span>
                      </div>

                      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            trustScore >= 70
                              ? 'bg-green-500'
                              : trustScore >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${trustScore}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${trustLevel.bg} ${trustLevel.color}`}>
                          {trustLevel.label}
                        </span>
                        {analysis.manipulation_types.length > 0 && (
                          <span className="inline-flex items-center gap-1.5 text-orange-400">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-medium">
                              {analysis.manipulation_types.length} issue{analysis.manipulation_types.length > 1 ? 's' : ''} detected
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {analysis.status === 'processing' && (
                    <div className="flex items-center gap-2 text-blue-400">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Analysis in progress...</span>
                    </div>
                  )}

                  {analysis.status === 'failed' && (
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">Analysis failed</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
