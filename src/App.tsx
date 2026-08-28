/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Video as VideoIcon,
  Ratio,
  Layers,
  Sliders,
  Download,
  Play,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  Bookmark,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import {
  VideoMetadata,
  VideoTransformSettings,
  BatchItem,
  UserPreset,
  SmartCropAnalysis,
} from './types';
import { DEFAULT_TRANSFORM_SETTINGS } from './data/presets';
import { extractVideoMetadata, convertVideoInBrowser } from './utils/videoProcessor';
import { formatBytes, computeOutputDimensions } from './utils/formatters';
import { downloadMedia } from './utils/downloadHelper';

import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { VideoPlayerPreview } from './components/VideoPlayerPreview';
import { RatioSelector } from './components/RatioSelector';
import { FillModeSelector } from './components/FillModeSelector';
import { EditingPanel } from './components/EditingPanel';
import { SmartCropAssistant } from './components/SmartCropAssistant';
import { BatchQueueModal } from './components/BatchQueueModal';
import { PresetsModal } from './components/PresetsModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { HelpModal } from './components/HelpModal';

export default function App() {
  // Video collection
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | undefined>();

  // Transform Settings for current active video
  const [settings, setSettings] = useState<VideoTransformSettings>(DEFAULT_TRANSFORM_SETTINGS);

  // Active Tab: 'ratio' | 'fill' | 'edit' | 'export'
  const [activeTab, setActiveTab] = useState<'ratio' | 'fill' | 'edit' | 'export'>('ratio');

  // Batch Queue & History
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [historyItems, setHistoryItems] = useState<BatchItem[]>(() => {
    try {
      const saved = localStorage.getItem('aspect_studio_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Presets
  const [userPresets, setUserPresets] = useState<UserPreset[]>(() => {
    try {
      const saved = localStorage.getItem('aspect_studio_presets');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'preset-tiktok-viral',
              name: 'TikTok Viral 9:16 Ambient Blur',
              description: '1080x1920 with 25px smooth background blur',
              settings: {
                ...DEFAULT_TRANSFORM_SETTINGS,
                aspectRatioId: '9:16',
                fillMode: 'blur',
                blurAmount: 25,
                quality: '1080p',
              },
              createdAt: Date.now(),
            },
            {
              id: 'preset-yt-widescreen',
              name: 'YouTube 16:9 Master Clean',
              description: '1920x1080 Full HD with black letterbox and 60fps',
              settings: {
                ...DEFAULT_TRANSFORM_SETTINGS,
                aspectRatioId: '16:9',
                customRatioW: 16,
                customRatioH: 9,
                fillMode: 'letterbox',
                quality: '1080p',
                fps: 60,
              },
              createdAt: Date.now(),
            },
          ];
    } catch {
      return [];
    }
  });
  const [activePresetName, setActivePresetName] = useState<string | undefined>();

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionMessage, setConversionMessage] = useState('');
  const [activeOutputUrl, setActiveOutputUrl] = useState<string | null>(null);
  const [activeOutputSize, setActiveOutputSize] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modals state
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Active Video
  const activeVideo = videos.find((v) => v.id === activeVideoId) || videos[0];

  // Save history & presets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aspect_studio_history', JSON.stringify(historyItems.slice(0, 30)));
    } catch {}
  }, [historyItems]);

  useEffect(() => {
    try {
      localStorage.setItem('aspect_studio_presets', JSON.stringify(userPresets));
    } catch {}
  }, [userPresets]);

  // Handler: Add Video Files
  const handleAddVideos = async (files: File[]) => {
    setIsLoadingVideo(true);
    setUploadError(null);
    try {
      const newVids: VideoMetadata[] = [];
      for (const file of files) {
        const meta = await extractVideoMetadata(file);
        newVids.push(meta);

        // Upload in background to server so conversion is instant
        const formData = new FormData();
        formData.append('video', file);
        fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && data.url) {
              meta.serverUrl = data.url;
            }
          })
          .catch(() => {});
      }

      setVideos((prev) => [...prev, ...newVids]);
      if (!activeVideoId && newVids.length > 0) {
        setActiveVideoId(newVids[0].id);
      }

      // Add to batch queue
      const newItems: BatchItem[] = newVids.map((v) => ({
        id: 'batch_' + Math.random().toString(36).substring(2, 9),
        video: v,
        settings: { ...settings },
        status: 'idle',
        progress: 0,
      }));
      setBatchItems((prev) => [...prev, ...newItems]);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse video file');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  // Handler: Add Video from URL
  const handleAddUrl = async (url: string) => {
    setIsLoadingVideo(true);
    setUploadError(null);
    try {
      const meta = await extractVideoMetadata(url);
      setVideos((prev) => [...prev, meta]);
      setActiveVideoId(meta.id);

      setBatchItems((prev) => [
        ...prev,
        {
          id: 'batch_' + Math.random().toString(36).substring(2, 9),
          video: meta,
          settings: { ...settings },
          status: 'idle',
          progress: 0,
        },
      ]);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to load video from URL. Check if URL allows CORS.');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  // Handler: Remove Video
  const handleRemoveVideo = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    setBatchItems((prev) => prev.filter((i) => i.video.id !== id));
    if (activeVideoId === id) {
      const remaining = videos.filter((v) => v.id !== id);
      setActiveVideoId(remaining.length > 0 ? remaining[0].id : undefined);
    }
  };

  // Handler: Update Settings
  const handleUpdateSettings = (updates: Partial<VideoTransformSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    setActivePresetName(undefined);

    // Sync to active batch item
    if (activeVideo) {
      setBatchItems((prev) =>
        prev.map((item) =>
          item.video.id === activeVideo.id ? { ...item, settings: { ...item.settings, ...updates } } : item
        )
      );
    }
  };

  // Handler: AI Smart Crop Apply
  const handleApplyAIAnalysis = (analysis: SmartCropAnalysis) => {
    handleUpdateSettings({
      aspectRatioId: analysis.recommendedRatio,
      customRatioW: analysis.recommendedRatio === '9:16' ? 9 : analysis.recommendedRatio === '1:1' ? 1 : 16,
      customRatioH: analysis.recommendedRatio === '9:16' ? 16 : analysis.recommendedRatio === '1:1' ? 1 : 9,
      fillMode: analysis.recommendedFillMode,
      cropXPercent: Math.round(analysis.subjectCoordinates.x * 100),
      cropYPercent: Math.round(analysis.subjectCoordinates.y * 100),
    });
  };

  // Handler: Single or Batch Conversion
  const handleStartConversion = async (singleItemId?: string) => {
    if (videos.length === 0) return;
    setIsProcessing(true);
    setConversionProgress(0);
    setConversionMessage('Starting conversion engine...');
    setActiveOutputUrl(null);

    const itemsToProcess = singleItemId
      ? batchItems.filter((i) => i.id === singleItemId)
      : batchItems.filter((i) => i.status !== 'completed');

    try {
      for (const item of itemsToProcess) {
        // Update batch item status to processing
        setBatchItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'processing', progress: 5 } : i))
        );

        let convertedUrl: string | null = null;
        let convertedSize: number | undefined = undefined;

        // Compute output dimensions accurately
        const { width: targetW, height: targetH } = computeOutputDimensions(
          item.settings.customRatioW,
          item.settings.customRatioH,
          item.settings.quality,
          item.video.width,
          item.video.height
        );

        // 1. Primary: Server-side native FFmpeg for exact frame timing, lossless sync, and 0 extra duration
        try {
          let serverInputUrl = item.video.serverUrl;

          // If local file object, ensure it's uploaded to server
          if (!serverInputUrl && item.video.file) {
            setConversionMessage('Uploading video to processing pipeline...');
            const formData = new FormData();
            formData.append('video', item.video.file);
            const uploadRes = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });
            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              serverInputUrl = uploadData.url;
              item.video.serverUrl = uploadData.url;
            }
          }

          if (!serverInputUrl && !item.video.url.startsWith('blob:')) {
            serverInputUrl = item.video.url;
          }

          if (!serverInputUrl) {
            throw new Error('No server input path available for native conversion');
          }

          setConversionMessage('Encoding with native FFmpeg engine...');
          const response = await fetch('/api/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inputUrl: serverInputUrl,
              targetWidth: targetW,
              targetHeight: targetH,
              fillMode: item.settings.fillMode,
              fillColor: item.settings.fillColor,
              blurAmount: item.settings.blurAmount,
              cropXPercent: item.settings.cropXPercent,
              cropYPercent: item.settings.cropYPercent,
              trimStartSec: item.settings.trimStartSec,
              trimEndSec: item.settings.trimEndSec,
              rotation: item.settings.rotation,
              flipH: item.settings.flipH,
              flipV: item.settings.flipV,
              playbackSpeed: item.settings.playbackSpeed,
              brightness: item.settings.brightness,
              contrast: item.settings.contrast,
              saturation: item.settings.saturation,
              audioMode: item.settings.audioMode,
              audioGain: item.settings.audioGain,
              watermarkEnabled: item.settings.watermarkEnabled,
              watermarkText: item.settings.watermarkText,
              watermarkPosition: item.settings.watermarkPosition,
              container: item.settings.container,
              fps: item.settings.fps || item.video.fps || 0,
            }),
          });

          if (!response.ok) throw new Error('Server conversion endpoint error');
          const { jobId } = await response.json();

          // Poll job status
          let isDone = false;
          while (!isDone) {
            await new Promise((r) => setTimeout(r, 600));
            const statusRes = await fetch(`/api/jobs/${jobId}`);
            if (!statusRes.ok) break;
            const jobData = await statusRes.json();

            setConversionProgress(jobData.progress || 50);
            setConversionMessage(jobData.message || 'Encoding frames...');
            setBatchItems((prev) =>
              prev.map((i) =>
                i.id === item.id
                  ? { ...i, progress: jobData.progress || 50, statusMessage: jobData.message }
                  : i
              )
            );

            if (jobData.status === 'completed') {
              isDone = true;
              convertedUrl = jobData.outputUrl;
              convertedSize = jobData.outputSize;
            } else if (jobData.status === 'failed') {
              throw new Error(jobData.error || 'Server FFmpeg processing error');
            }
          }
        } catch (serverErr) {
          console.warn('Server FFmpeg conversion fell back to client converter:', serverErr);
          // 2. Fallback: High-precision client-side canvas converter with duration bounds
          const { url, size } = await convertVideoInBrowser(
            item.video,
            item.settings,
            (pct, msg) => {
              setConversionProgress(pct);
              setConversionMessage(msg);
              setBatchItems((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, progress: pct, statusMessage: msg } : i))
              );
            }
          );
          convertedUrl = url;
          convertedSize = size;
        }

        if (convertedUrl) {
          // Mark completed
          setBatchItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    status: 'completed',
                    progress: 100,
                    outputBlobUrl: convertedUrl!,
                    outputSize: convertedSize,
                    endTime: Date.now(),
                  }
                : i
            )
          );

          if (item.video.id === activeVideo?.id) {
            setActiveOutputUrl(convertedUrl);
            if (convertedSize) setActiveOutputSize(convertedSize);
          }

          // Add to History
          const historyEntry: BatchItem = {
            ...item,
            status: 'completed',
            progress: 100,
            outputBlobUrl: convertedUrl,
            outputSize: convertedSize,
          };
          setHistoryItems((prev) => [historyEntry, ...prev]);
        }
      }

      // Trigger celebratory confetti on completion
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('Conversion execution error:', err);
      setConversionMessage(`Conversion error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };


  // Handler: Apply settings to all batch items
  const handleApplySettingsToAll = () => {
    setBatchItems((prev) =>
      prev.map((item) => ({
        ...item,
        settings: { ...settings },
      }))
    );
  };

  // Handler: Save Preset
  const handleSavePreset = (name: string, description: string) => {
    const newPreset: UserPreset = {
      id: 'preset_' + Date.now(),
      name,
      description,
      settings: { ...settings },
      createdAt: Date.now(),
    };
    setUserPresets((prev) => [newPreset, ...prev]);
    setActivePresetName(name);
  };

  // Handler: Load Preset
  const handleLoadPreset = (preset: UserPreset) => {
    setSettings(preset.settings);
    setActivePresetName(preset.name);
  };

  // Handler: Copy Link
  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0E0E14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Header */}
      <Header
        batchCount={batchItems.length}
        onOpenQueue={() => setIsQueueOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenAI={() => setIsAIOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        activePresetName={activePresetName}
        isProcessing={isProcessing}
      />

      {/* 2. Main Studio Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* Upload Zone & Batch Carousel */}
        <UploadZone
          videos={videos}
          activeVideoId={activeVideo?.id}
          onSelectVideo={(id) => setActiveVideoId(id)}
          onAddVideos={handleAddVideos}
          onAddUrl={handleAddUrl}
          onRemoveVideo={handleRemoveVideo}
          isLoading={isLoadingVideo}
          error={uploadError}
        />

        {/* Studio Canvas & Controls Grid */}
        {activeVideo && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Interactive Real-Time Preview Stage (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <VideoPlayerPreview
                video={activeVideo}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onOpenAI={() => setIsAIOpen(true)}
                isProcessing={isProcessing}
              />

              {/* Converted Output Card when complete */}
              {activeOutputUrl && (
                <div className="bg-[#161622] border border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xl animate-fadeIn">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-md">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Conversion Complete!</h4>
                      <p className="text-xs text-slate-400 font-mono">
                        {settings.aspectRatioId} • {settings.quality} •{' '}
                        {activeOutputSize ? formatBytes(activeOutputSize) : 'Ready for download'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeOutputUrl && activeVideo) {
                          const safeRatio = (settings.aspectRatioId || 'custom').replace(/:/g, '-');
                          const safeBaseName = activeVideo.name.replace(/\.[^/.]+$/, '');
                          downloadMedia(
                            activeOutputUrl,
                            `Converted_${safeRatio}_${safeBaseName}`,
                            settings.container || 'mp4'
                          );
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download Video
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyShareLink}
                      className="p-2.5 rounded-xl bg-[#222232] hover:bg-[#2A2A3E] text-slate-300 border border-[#303046] transition active:scale-95"
                      title="Share link"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Studio Inspector & Controls (5 Cols) */}
            <div className="lg:col-span-5 bg-[#13131A] border border-[#262638] rounded-3xl p-5 shadow-2xl space-y-5">
              {/* Tabs Bar */}
              <div className="grid grid-cols-4 gap-1.5 bg-[#0E0E14] p-1.5 rounded-2xl border border-[#262638] text-xs font-bold">
                <button
                  type="button"
                  id="tab-ratio"
                  onClick={() => setActiveTab('ratio')}
                  className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 ${
                    activeTab === 'ratio' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Ratio className="w-3.5 h-3.5" />
                  <span>Ratio</span>
                </button>

                <button
                  type="button"
                  id="tab-fill"
                  onClick={() => setActiveTab('fill')}
                  className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 ${
                    activeTab === 'fill' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Fill</span>
                </button>

                <button
                  type="button"
                  id="tab-edit"
                  onClick={() => setActiveTab('edit')}
                  className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 ${
                    activeTab === 'edit' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  id="tab-export"
                  onClick={() => setActiveTab('export')}
                  className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 ${
                    activeTab === 'export' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>

              {/* Tab 1: Ratio & Format */}
              {activeTab === 'ratio' && (
                <RatioSelector
                  settings={settings}
                  video={activeVideo}
                  onUpdateSettings={handleUpdateSettings}
                />
              )}

              {/* Tab 2: Content Handling / Fill */}
              {activeTab === 'fill' && (
                <FillModeSelector
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onOpenAI={() => setIsAIOpen(true)}
                />
              )}

              {/* Tab 3: Editing, Trimmer, Color & Audio */}
              {activeTab === 'edit' && (
                <EditingPanel
                  settings={settings}
                  video={activeVideo}
                  onUpdateSettings={handleUpdateSettings}
                />
              )}

              {/* Tab 4: Export & Conversion Trigger */}
              {activeTab === 'export' && (
                <div className="space-y-4">
                  <div className="bg-[#161622] border border-[#262638] rounded-2xl p-4 space-y-3 shadow-md">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                      Conversion Summary
                    </h4>
                    <div className="space-y-1.5 text-xs text-slate-300 divide-y divide-[#262638]">
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">Source Video</span>
                        <span className="font-bold text-white truncate max-w-[180px]">{activeVideo.name}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">Target Aspect Ratio</span>
                        <span className="font-bold text-indigo-400">{settings.aspectRatioId}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">Output Dimensions</span>
                        <span className="font-mono text-slate-200 font-bold">
                          {settings.targetWidth} × {settings.targetHeight} px ({settings.quality})
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">Content Fill Method</span>
                        <span className="font-bold text-amber-300 capitalize">{settings.fillMode}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">Format & Codec</span>
                        <span className="text-slate-200 font-mono uppercase">
                          {settings.container} • {settings.codec}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar if processing */}
                  {isProcessing && (
                    <div className="bg-[#161622] border border-indigo-500/40 rounded-2xl p-4 space-y-2 animate-pulse shadow-lg">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-indigo-300">{conversionMessage}</span>
                        <span className="text-white font-mono">{conversionProgress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#0E0E14] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-500 transition-all duration-300"
                          style={{ width: `${conversionProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Export Button */}
                  <button
                    type="button"
                    id="btn-convert-video"
                    disabled={isProcessing}
                    onClick={() => handleStartConversion()}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Converting Video...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Convert Video Now
                      </>
                    )}
                  </button>

                  {/* Batch Queue Shortcut */}
                  {batchItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setIsQueueOpen(true)}
                      className="w-full py-2.5 px-3 rounded-2xl bg-[#222232] hover:bg-[#2A2A3E] text-slate-300 text-xs font-bold border border-[#303046] flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      View Batch Queue ({batchItems.length} Videos)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 3. Modals & Drawers */}
      {activeVideo && (
        <SmartCropAssistant
          isOpen={isAIOpen}
          onClose={() => setIsAIOpen(false)}
          video={activeVideo}
          settings={settings}
          onApplyAnalysis={handleApplyAIAnalysis}
        />
      )}

      <BatchQueueModal
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        batchItems={batchItems}
        currentSettings={settings}
        onApplySettingsToAll={handleApplySettingsToAll}
        onStartConversion={handleStartConversion}
        onRemoveItem={(id) => setBatchItems((prev) => prev.filter((i) => i.id !== id))}
        onClearCompleted={() => setBatchItems((prev) => prev.filter((i) => i.status !== 'completed'))}
        isProcessing={isProcessing}
      />

      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        presets={userPresets}
        currentSettings={settings}
        onSaveCurrentAsPreset={handleSavePreset}
        onLoadPreset={handleLoadPreset}
        onDeletePreset={(id) => setUserPresets((prev) => prev.filter((p) => p.id !== id))}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyItems={historyItems}
        onClearHistory={() => setHistoryItems([])}
        onRemoveItem={(id) => setHistoryItems((prev) => prev.filter((i) => i.id !== id))}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
