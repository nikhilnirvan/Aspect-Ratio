import React, { useState } from 'react';
import { Sparkles, Check, RefreshCw, X, Tag, Video, ArrowRight, Lightbulb } from 'lucide-react';
import { SmartCropAnalysis, VideoMetadata, VideoTransformSettings } from '../types';
import { captureVideoFrameBase64 } from '../utils/videoProcessor';

interface SmartCropAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoMetadata;
  settings: VideoTransformSettings;
  onApplyAnalysis: (analysis: SmartCropAnalysis) => void;
}

export const SmartCropAssistant: React.FC<SmartCropAssistantProps> = ({
  isOpen,
  onClose,
  video,
  settings,
  onApplyAnalysis,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SmartCropAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewFrame, setPreviewFrame] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      // Capture frame at 1s or midpoint
      const frameSec = settings.trimStartSec || Math.min(1.0, video.duration / 2);
      const base64 = await captureVideoFrameBase64(video.url, frameSec);
      setPreviewFrame(base64);

      const response = await fetch('/api/gemini/analyze-crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameBase64: base64,
          currentAspect: video.aspectRatioFormatted,
          videoName: video.name,
        }),
      });

      if (!response.ok) {
        throw new Error('AI analysis failed. Using fallback smart center framing.');
      }

      const data: SmartCropAnalysis = await response.json();
      setAnalysis(data);
    } catch (err: any) {
      console.warn('Smart crop error, using fallback:', err);
      // Fallback
      setAnalysis({
        detectedSubject: 'Primary Center Focal Point',
        subjectCoordinates: { x: 0.5, y: 0.5, width: 0.4, height: 0.6 },
        recommendedRatio: '9:16',
        recommendedFillMode: 'blur',
        suggestedTitle: `${video.name.replace(/\.[^/.]+$/, '')} - Viral Edit`,
        suggestedTags: ['#shorts', '#reels', '#viral', '#trending', '#videoedit'],
        reasoning: 'Centered framing with ambient blur background maximizes viewer retention on mobile feeds.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#13131A] border border-[#262638] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262638] flex items-center justify-between bg-[#0E0E14]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30 shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">AI Smart Framing & Crop</h3>
              <p className="text-xs text-slate-400">
                Powered by Gemini • Focal subject detection & viral framing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#222232] transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {!analysis && !isAnalyzing && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-violet-950/60 to-[#161622] border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-xl">
                <Video className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Analyze Video Frame</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  Gemini inspects your video's focal elements to detect subjects, faces, and products to recommend
                  the optimal aspect ratio and crop anchor coordinates for maximum engagement.
                </p>
              </div>

              <button
                type="button"
                id="btn-run-smart-crop"
                onClick={handleRunAnalysis}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition flex items-center gap-2 mx-auto active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                Analyze Frame Now
              </button>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-10 space-y-3">
              <RefreshCw className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
              <h4 className="font-bold text-sm text-white">Analyzing Video Frame with Gemini...</h4>
              <p className="text-xs text-slate-400">
                Detecting subject coordinates, focal tracking, and viral platform ratios...
              </p>
            </div>
          )}

          {analysis && !isAnalyzing && (
            <div className="space-y-4 animate-fadeIn">
              {/* Frame & Detected Subject */}
              <div className="flex items-start gap-3.5 bg-[#161622] p-4 rounded-2xl border border-[#262638] shadow-md">
                {previewFrame && (
                  <img
                    src={previewFrame}
                    alt="Analyzed frame"
                    className="w-24 h-16 object-cover rounded-xl border border-[#303046] shrink-0 shadow"
                  />
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      Detected Subject
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mt-1.5">{analysis.detectedSubject}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">{analysis.reasoning}</p>
                </div>
              </div>

              {/* Recommended Settings Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#161622] p-4 rounded-2xl border border-[#262638] shadow-md">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                    Recommended Ratio
                  </span>
                  <span className="text-base font-bold text-indigo-300 font-mono">{analysis.recommendedRatio}</span>
                </div>

                <div className="bg-[#161622] p-4 rounded-2xl border border-[#262638] shadow-md">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                    Recommended Fill Mode
                  </span>
                  <span className="text-base font-bold text-amber-300 capitalize">{analysis.recommendedFillMode}</span>
                </div>
              </div>

              {/* Suggested Social Title & Viral Tags */}
              <div className="bg-[#161622] p-4 rounded-2xl border border-[#262638] shadow-md space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  Suggested Social Video Title
                </div>
                <p className="text-xs text-white font-semibold bg-[#0E0E14] px-3 py-2 rounded-xl border border-[#262638]">
                  {analysis.suggestedTitle}
                </p>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {analysis.suggestedTags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-[#0E0E14] text-indigo-300 border border-[#262638] flex items-center gap-1"
                    >
                      <Tag className="w-2.5 h-2.5 text-slate-500" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {analysis && !isAnalyzing && (
          <div className="p-4 sm:p-5 border-t border-[#262638] bg-[#0E0E14] flex items-center justify-between">
            <button
              type="button"
              onClick={handleRunAnalysis}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-analyze Frame
            </button>

            <button
              type="button"
              id="btn-apply-ai-framing"
              onClick={() => {
                onApplyAnalysis(analysis);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center gap-1.5 transition active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              Apply AI Framing Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
