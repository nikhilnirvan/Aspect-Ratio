import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Columns,
  Split,
  Eye,
  Crosshair,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { VideoMetadata, VideoTransformSettings } from '../types';
import { computeOutputDimensions, formatTime } from '../utils/formatters';
import { drawTransformedFrame } from '../utils/videoProcessor';

interface VideoPlayerPreviewProps {
  video: VideoMetadata;
  settings: VideoTransformSettings;
  onUpdateSettings: (updates: Partial<VideoTransformSettings>) => void;
  onOpenAI: () => void;
  isProcessing?: boolean;
}

export const VideoPlayerPreview: React.FC<VideoPlayerPreviewProps> = ({
  video,
  settings,
  onUpdateSettings,
  onOpenAI,
  isProcessing = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const splitVideoRef = useRef<HTMLVideoElement>(null);
  const sideVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration || 10);
  const [isMuted, setIsMuted] = useState(settings.audioMode === 'mute');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // View modes: 'single' | 'split-slider' | 'side-by-side'
  const [viewMode, setViewMode] = useState<'single' | 'split-slider' | 'side-by-side'>('single');
  const [splitPosition, setSplitPosition] = useState(50); // 0 to 100%
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [isDraggingFocal, setIsDraggingFocal] = useState(false);

  // Output dimensions
  const { width: targetW, height: targetH } = computeOutputDimensions(
    settings.customRatioW,
    settings.customRatioH,
    settings.quality,
    video.width,
    video.height
  );

  // Preload custom background image if set
  useEffect(() => {
    if (settings.fillMode === 'image' && settings.backgroundImageUrl) {
      const img = new Image();
      img.src = settings.backgroundImageUrl;
      img.onload = () => {
        bgImageRef.current = img;
        renderFrame();
      };
    } else {
      bgImageRef.current = null;
    }
  }, [settings.fillMode, settings.backgroundImageUrl]);

  // Main Canvas Render Frame
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const vid = videoRef.current;
    if (!canvas || !vid) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    drawTransformedFrame(ctx, vid, settings, targetW, targetH, bgImageRef.current);
  }, [targetW, targetH, settings]);

  // Video Animation Frame Loop
  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
      const vid = videoRef.current;
      if (vid) {
        // Handle trim bounds loop
        const trimStart = settings.trimStartSec || 0;
        const trimEnd = settings.trimEndSec > 0 ? settings.trimEndSec : duration;

        if (vid.currentTime < trimStart) {
          vid.currentTime = trimStart;
        } else if (vid.currentTime >= trimEnd) {
          vid.currentTime = trimStart;
        }

        setCurrentTime(vid.currentTime);
        renderFrame();
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [renderFrame, settings.trimStartSec, settings.trimEndSec, duration]);

  // Auto-pause video preview playback if video conversion/export is active
  useEffect(() => {
    if (isProcessing) {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      splitVideoRef.current?.pause();
      sideVideoRef.current?.pause();
      setIsPlaying(false);
    }
  }, [isProcessing]);

  // Keep auxiliary comparison video elements in sync with the primary video
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const syncAuxVideos = () => {
      const time = vid.currentTime;
      if (splitVideoRef.current && Math.abs(splitVideoRef.current.currentTime - time) > 0.05) {
        splitVideoRef.current.currentTime = time;
      }
      if (sideVideoRef.current && Math.abs(sideVideoRef.current.currentTime - time) > 0.05) {
        sideVideoRef.current.currentTime = time;
      }
    };

    const handlePlay = () => {
      splitVideoRef.current?.play().catch(() => {});
      sideVideoRef.current?.play().catch(() => {});
    };

    const handlePause = () => {
      splitVideoRef.current?.pause();
      sideVideoRef.current?.pause();
    };

    vid.addEventListener('timeupdate', syncAuxVideos);
    vid.addEventListener('play', handlePlay);
    vid.addEventListener('pause', handlePause);
    vid.addEventListener('seeking', syncAuxVideos);
    vid.addEventListener('seeked', syncAuxVideos);

    return () => {
      vid.removeEventListener('timeupdate', syncAuxVideos);
      vid.removeEventListener('play', handlePlay);
      vid.removeEventListener('pause', handlePause);
      vid.removeEventListener('seeking', syncAuxVideos);
      vid.removeEventListener('seeked', syncAuxVideos);
    };
  }, [viewMode]);

  // Handle Play/Pause
  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play();
      splitVideoRef.current?.play().catch(() => {});
      sideVideoRef.current?.play().catch(() => {});
      setIsPlaying(true);
    } else {
      vid.pause();
      splitVideoRef.current?.pause();
      sideVideoRef.current?.pause();
      setIsPlaying(false);
    }
  };

  // Handle Timeline Scrubbing
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      if (splitVideoRef.current) splitVideoRef.current.currentTime = newTime;
      if (sideVideoRef.current) sideVideoRef.current.currentTime = newTime;
      renderFrame();
    }
  };

  // Step Frame
  const stepFrame = (forward: boolean) => {
    if (videoRef.current) {
      const step = forward ? 1 / 30 : -1 / 30;
      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + step));
      videoRef.current.currentTime = newTime;
      if (splitVideoRef.current) splitVideoRef.current.currentTime = newTime;
      if (sideVideoRef.current) sideVideoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      renderFrame();
    }
  };

  // Handle Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepFrame(false);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepFrame(true);
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Interactive Focal Point Dragging on Canvas
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (settings.fillMode === 'smart-crop' || settings.fillMode === 'manual-crop') {
      setIsDraggingFocal(true);
      updateFocalPointFromPointer(e);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingFocal) {
      updateFocalPointFromPointer(e);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingFocal(false);
  };

  const updateFocalPointFromPointer = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
    const yPct = Math.round(Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)));
    onUpdateSettings({ cropXPercent: xPct, cropYPercent: yPct });
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-[#0E0E14] border border-[#1E1E2A] rounded-2xl overflow-hidden shadow-2xl ${
        isFullscreen ? 'h-screen w-screen rounded-none p-4' : 'w-full'
      }`}
    >
      {/* Hidden Native Source Video Element */}
      <video
        ref={videoRef}
        src={video.url}
        crossOrigin="anonymous"
        playsInline
        muted={isMuted || settings.audioMode === 'mute'}
        className="hidden"
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          renderFrame();
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#13131A] border-b border-[#1E1E2A] text-xs text-slate-300">
        {/* Left: Aspect Ratio & Target Size Badge */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 font-bold tracking-wide rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-mono text-xs">
            {settings.aspectRatioId === 'custom'
              ? `${settings.customRatioW}:${settings.customRatioH}`
              : settings.aspectRatioId}
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            {targetW} × {targetH} px • {settings.fps === 0 ? 'Source FPS' : `${settings.fps} FPS`}
          </span>
          <span className="px-2 py-0.5 rounded-lg text-[10px] uppercase font-bold bg-[#1C1C28] text-slate-300 border border-[#2A2A3C]">
            {settings.fillMode}
          </span>
        </div>

        {/* Right: View Modes & AI Smart Framing */}
        <div className="flex items-center gap-2">
          {/* Comparison Mode Toggles */}
          <div className="flex items-center bg-[#09090C] p-0.5 rounded-xl border border-[#1E1E2A]">
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'single' ? 'bg-[#1E1E2E] text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Single Converted View"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split-slider')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'split-slider' ? 'bg-[#1E1E2E] text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Before / After Split Slider"
            >
              <Split className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('side-by-side')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'side-by-side' ? 'bg-[#1E1E2E] text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Side-by-Side Comparison"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenAI}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 text-[11px] font-semibold transition active:scale-95 shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-violet-400" />
            Smart Focal
          </button>
        </div>
      </div>

      {/* Main Viewport Stage */}
      <div
        className="relative w-full h-[380px] sm:h-[460px] lg:h-[500px] flex items-center justify-center bg-[#070709] overflow-hidden select-none p-3"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
      >
        {/* Subtle dot pattern background */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* View Mode 1: Single Converted View */}
        {viewMode === 'single' && (
          <div
            className="relative flex items-center justify-center max-h-full max-w-full shadow-2xl rounded-xl overflow-hidden border border-[#20202E]"
            style={{ aspectRatio: `${settings.customRatioW} / ${settings.customRatioH}` }}
          >
            <canvas
              ref={canvasRef}
              className="max-h-full max-w-full object-contain cursor-crosshair"
              onClick={togglePlay}
            />

            {/* Focal Point Indicator for Crop modes */}
            {(settings.fillMode === 'smart-crop' || settings.fillMode === 'manual-crop') && (
              <div
                className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full border-2 border-indigo-400 bg-indigo-500/20 backdrop-blur-sm shadow-lg animate-pulse"
                style={{
                  left: `${settings.cropXPercent}%`,
                  top: `${settings.cropYPercent}%`,
                }}
              >
                <Crosshair className="w-4 h-4 text-indigo-200" />
              </div>
            )}
          </div>
        )}

        {/* View Mode 2: Split Before/After Interactive Slider */}
        {viewMode === 'split-slider' && (
          <div
            className="relative flex items-center justify-center max-h-full max-w-full shadow-2xl rounded-xl overflow-hidden border border-[#20202E]"
            style={{ aspectRatio: `${settings.customRatioW} / ${settings.customRatioH}` }}
          >
            {/* Converted Canvas (Right/Base) */}
            <canvas ref={canvasRef} className="max-h-full max-w-full object-contain" />

            {/* Original Source Overlay (Left Side Clipped) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none bg-black flex items-center justify-center"
              style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
            >
              <video
                ref={splitVideoRef}
                src={video.url}
                muted
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold text-slate-300 border border-white/10 uppercase">
                Original ({video.aspectRatioFormatted})
              </div>
            </div>

            <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-indigo-900/80 text-[10px] font-bold text-indigo-200 border border-indigo-500/30 uppercase pointer-events-none">
              Converted ({settings.aspectRatioId})
            </div>

            {/* Interactive Split Divider Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_10px_rgba(0,0,0,0.8)]"
              style={{ left: `${splitPosition}%` }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsDraggingSplit(true);
              }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-zinc-900 flex items-center justify-center shadow-lg text-[10px] font-bold">
                ⬌
              </div>
            </div>
          </div>
        )}

        {/* View Mode 3: Side-by-Side Dual View */}
        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full p-2 items-center">
            {/* Left: Original */}
            <div className="flex flex-col items-center justify-center h-full bg-[#121218] rounded-xl border border-[#20202E] p-2 overflow-hidden">
              <span className="text-[11px] font-semibold text-slate-400 mb-1.5">
                Original Source ({video.aspectRatioFormatted} • {video.width}×{video.height})
              </span>
              <div
                className="relative max-h-[340px] max-w-full flex items-center justify-center rounded-lg overflow-hidden bg-black"
                style={{ aspectRatio: `${video.aspectRatio}` }}
              >
                <video ref={sideVideoRef} src={video.url} muted playsInline className="max-h-full object-contain" />
              </div>
            </div>

            {/* Right: Transformed */}
            <div className="flex flex-col items-center justify-center h-full bg-[#121218] rounded-xl border border-indigo-500/30 p-2 overflow-hidden">
              <span className="text-[11px] font-semibold text-indigo-300 mb-1.5">
                Converted Target ({settings.aspectRatioId} • {targetW}×{targetH})
              </span>
              <div
                className="relative max-h-[340px] max-w-full flex items-center justify-center rounded-lg overflow-hidden bg-black"
                style={{ aspectRatio: `${settings.customRatioW} / ${settings.customRatioH}` }}
              >
                <canvas ref={canvasRef} className="max-h-full object-contain" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Bottom Player Controls */}
      <div className="bg-[#13131A] border-t border-[#1E1E2A] p-3.5 space-y-2.5">
        {/* Timeline Range Scrubber */}
        <div className="relative flex items-center gap-2">
          <input
            id="timeline-scrubber"
            type="range"
            min={0}
            max={duration || 10}
            step={0.01}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-[#1C1C28] rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
          />

          {/* Trim indicators on timeline */}
          {settings.trimStartSec > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-indigo-500/40 pointer-events-none rounded-l"
              style={{ width: `${(settings.trimStartSec / duration) * 100}%` }}
            />
          )}
          {settings.trimEndSec > 0 && settings.trimEndSec < duration && (
            <div
              className="absolute top-0 bottom-0 right-0 bg-indigo-500/40 pointer-events-none rounded-r"
              style={{ width: `${((duration - settings.trimEndSec) / duration) * 100}%` }}
            />
          )}
        </div>

        {/* Buttons Bar */}
        <div className="flex items-center justify-between text-slate-300">
          {/* Left: Play/Pause, Step, Timecode */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="btn-play-pause"
              type="button"
              onClick={togglePlay}
              className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25 border border-indigo-400/30 transition active:scale-95"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => stepFrame(false)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#1E1E2E] rounded-xl transition"
              title="Step Backward 1 Frame (←)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="font-mono text-xs text-slate-300">
              <span className="text-white font-semibold">{formatTime(currentTime)}</span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-slate-400">{formatTime(duration)}</span>
            </div>

            {/* Trimmer badge if active */}
            {(settings.trimStartSec > 0 || (settings.trimEndSec > 0 && settings.trimEndSec < duration)) && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Trimmed: {formatTime(Math.max(0, (settings.trimEndSec || duration) - settings.trimStartSec))}
              </span>
            )}
          </div>

          {/* Right: Audio Mute, Speed, Fullscreen */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                onUpdateSettings({ audioMode: nextMuted ? 'mute' : 'original' });
              }}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-[#1E1E2E] rounded-xl transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Speed indicator */}
            {settings.playbackSpeed !== 1.0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#1C1C28] text-amber-400 border border-[#2A2A3C]">
                {settings.playbackSpeed}x Speed
              </span>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-[#1E1E2E] rounded-xl transition"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
