import React from 'react';
import { Ratio, Smartphone, Tv, Film, Monitor, Camera, Sliders, Check, Sparkles } from 'lucide-react';
import { AspectRatioId, VideoQuality, VideoCodec, OutputContainer, VideoTransformSettings, VideoMetadata } from '../types';
import { ASPECT_RATIO_PRESETS } from '../data/presets';
import { computeOutputDimensions } from '../utils/formatters';

interface RatioSelectorProps {
  settings: VideoTransformSettings;
  video: VideoMetadata;
  onUpdateSettings: (updates: Partial<VideoTransformSettings>) => void;
}

export const RatioSelector: React.FC<RatioSelectorProps> = ({
  settings,
  video,
  onUpdateSettings,
}) => {
  const handleSelectPreset = (presetId: AspectRatioId) => {
    const preset = ASPECT_RATIO_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      const { width, height } = computeOutputDimensions(
        preset.ratioW,
        preset.ratioH,
        settings.quality,
        video.width,
        video.height
      );
      onUpdateSettings({
        aspectRatioId: presetId,
        customRatioW: preset.ratioW,
        customRatioH: preset.ratioH,
        targetWidth: width,
        targetHeight: height,
      });
    }
  };

  const handleCustomRatioChange = (w: number, h: number) => {
    const safeW = Math.max(1, w || 1);
    const safeH = Math.max(1, h || 1);
    const { width, height } = computeOutputDimensions(
      safeW,
      safeH,
      settings.quality,
      video.width,
      video.height
    );
    onUpdateSettings({
      aspectRatioId: 'custom',
      customRatioW: safeW,
      customRatioH: safeH,
      targetWidth: width,
      targetHeight: height,
    });
  };

  const handleQualityChange = (q: VideoQuality) => {
    const { width, height } = computeOutputDimensions(
      settings.customRatioW,
      settings.customRatioH,
      q,
      video.width,
      video.height
    );
    onUpdateSettings({
      quality: q,
      targetWidth: width,
      targetHeight: height,
    });
  };

  const { width: currentW, height: currentH } = computeOutputDimensions(
    settings.customRatioW,
    settings.customRatioH,
    settings.quality,
    video.width,
    video.height
  );

  return (
    <div className="space-y-6">
      {/* 1. Aspect Ratio Presets Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Ratio className="w-3.5 h-3.5 text-indigo-400" />
            Target Aspect Ratio
          </label>
          <span className="text-xs font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
            {currentW} × {currentH} px
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {ASPECT_RATIO_PRESETS.map((preset) => {
            const isSelected = settings.aspectRatioId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                id={`preset-${preset.id.replace(':', '-')}`}
                onClick={() => handleSelectPreset(preset.id)}
                className={`relative p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between active:scale-[0.98] ${
                  isSelected
                    ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-500/50'
                    : 'bg-[#161622] border-[#262638] hover:border-[#3A3A52] text-slate-300 hover:bg-[#1A1A28]'
                }`}
              >
                <div className="flex items-start justify-between w-full mb-2">
                  <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5 font-mono">
                    {preset.name}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 line-clamp-1">{preset.description}</p>
                  <span className="inline-block text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-lg bg-[#222232] text-slate-300 border border-[#303046]">
                    {preset.platform}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Custom Ratio Card */}
          <button
            type="button"
            id="preset-custom"
            onClick={() => onUpdateSettings({ aspectRatioId: 'custom' })}
            className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between active:scale-[0.98] ${
              settings.aspectRatioId === 'custom'
                ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/50'
                : 'bg-[#161622] border-[#262638] hover:border-[#3A3A52] text-slate-300 hover:bg-[#1A1A28]'
            }`}
          >
            <div className="flex items-start justify-between w-full mb-1">
              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Custom
              </span>
              {settings.aspectRatioId === 'custom' && <Check className="w-4 h-4 text-indigo-400" />}
            </div>
            <p className="text-[10px] text-slate-400">Custom W : H ratio</p>
          </button>
        </div>

        {/* Custom Ratio Inputs (visible if Custom is selected) */}
        {settings.aspectRatioId === 'custom' && (
          <div className="bg-[#161622] border border-indigo-500/40 rounded-2xl p-3.5 flex items-center gap-3 animate-fadeIn shadow-lg">
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Ratio Width (W)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={settings.customRatioW}
                onChange={(e) => handleCustomRatioChange(parseFloat(e.target.value) || 1, settings.customRatioH)}
                className="w-full bg-[#0E0E14] border border-[#2A2A3E] rounded-xl px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>
            <span className="text-slate-500 font-bold mt-4">:</span>
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Ratio Height (H)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={settings.customRatioH}
                onChange={(e) => handleCustomRatioChange(settings.customRatioW, parseFloat(e.target.value) || 1)}
                className="w-full bg-[#0E0E14] border border-[#2A2A3E] rounded-xl px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Output Resolution & Quality */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Output Resolution & Quality
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {(['360p', '720p', '1080p', '1440p', '4K'] as VideoQuality[]).map((q) => {
            const isSelected = settings.quality === q;
            return (
              <button
                key={q}
                type="button"
                onClick={() => handleQualityChange(q)}
                className={`py-2.5 px-2 rounded-xl text-center border text-xs font-bold transition active:scale-95 ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/25'
                    : 'bg-[#161622] border-[#262638] hover:border-[#383850] text-slate-300'
                }`}
              >
                {q}
                {q === '1080p' && <span className="block text-[9px] font-normal opacity-80">Full HD</span>}
                {q === '4K' && <span className="block text-[9px] font-normal opacity-80">Ultra HD</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Output Format, Codec & Frame Rate */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Container */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Format Container
          </label>
          <select
            value={settings.container}
            onChange={(e) => onUpdateSettings({ container: e.target.value as OutputContainer })}
            className="w-full bg-[#161622] border border-[#262638] hover:border-[#383850] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="mp4">MP4 (H.264 / AAC - Best Compatibility)</option>
            <option value="webm">WebM (VP9 / Opus - Web Optimized)</option>
            <option value="mov">MOV (Apple QuickTime)</option>
            <option value="mkv">MKV (Matroska High Bitrate)</option>
          </select>
        </div>

        {/* Codec */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Video Codec
          </label>
          <select
            value={settings.codec}
            onChange={(e) => onUpdateSettings({ codec: e.target.value as VideoCodec })}
            className="w-full bg-[#161622] border border-[#262638] hover:border-[#383850] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="h264">H.264 / AVC (Universal standard)</option>
            <option value="hevc">H.265 / HEVC (High Compression)</option>
            <option value="vp9">VP9 (Google Open Codec)</option>
          </select>
        </div>

        {/* Frame Rate */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Frame Rate (FPS)
          </label>
          <select
            value={settings.fps}
            onChange={(e) => onUpdateSettings({ fps: parseInt(e.target.value, 10) })}
            className="w-full bg-[#161622] border border-[#262638] hover:border-[#383850] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium font-mono"
          >
            <option value={0}>Original ({video.fps || 30} FPS)</option>
            <option value={24}>24 FPS (Cinematic standard)</option>
            <option value={30}>30 FPS (Standard video)</option>
            <option value={60}>60 FPS (High smoothness)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
