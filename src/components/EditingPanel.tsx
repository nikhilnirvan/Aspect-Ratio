import React from 'react';
import {
  Scissors,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Sun,
  Contrast,
  Palette,
  Volume2,
  VolumeX,
  Gauge,
  Stamp,
  Sliders,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { VideoTransformSettings, VideoMetadata } from '../types';
import { formatTime } from '../utils/formatters';

interface EditingPanelProps {
  settings: VideoTransformSettings;
  video: VideoMetadata;
  onUpdateSettings: (updates: Partial<VideoTransformSettings>) => void;
}

export const EditingPanel: React.FC<EditingPanelProps> = ({
  settings,
  video,
  onUpdateSettings,
}) => {
  const duration = video.duration || 10;
  const trimStart = settings.trimStartSec || 0;
  const trimEnd = settings.trimEndSec > 0 ? settings.trimEndSec : duration;
  const trimmedDuration = Math.max(0.1, trimEnd - trimStart);

  const handleRotate = () => {
    const nextRot = ((settings.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    onUpdateSettings({ rotation: nextRot });
  };

  const filterPresets = [
    { id: 'none', label: 'Original' },
    { id: 'cinematic', label: 'Cinematic' },
    { id: 'warm', label: 'Golden Warm' },
    { id: 'cool', label: 'Cool Teal' },
    { id: 'vintage', label: 'Vintage Film' },
    { id: 'bw', label: 'B & W' },
    { id: 'vivid', label: 'Vivid Pop' },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Trimmer Section */}
      <div className="space-y-3.5 bg-[#161622] border border-[#262638] rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-indigo-400" />
            Video Trimmer
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
              Output: {formatTime(trimmedDuration)}
            </span>
            {(trimStart > 0 || (trimEnd > 0 && trimEnd < duration)) && (
              <button
                type="button"
                onClick={() => onUpdateSettings({ trimStartSec: 0, trimEndSec: 0 })}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-0.5 transition"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Start Trim</span>
              <span className="font-mono text-slate-200 font-semibold">{formatTime(trimStart)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, trimEnd - 0.5)}
              step={0.1}
              value={trimStart}
              onChange={(e) => onUpdateSettings({ trimStartSec: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#0E0E14] rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>End Trim</span>
              <span className="font-mono text-slate-200 font-semibold">{formatTime(trimEnd)}</span>
            </div>
            <input
              type="range"
              min={Math.min(duration, trimStart + 0.5)}
              max={duration}
              step={0.1}
              value={trimEnd}
              onChange={(e) => onUpdateSettings({ trimEndSec: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#0E0E14] rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Transformations (Rotate, Flip, Speed) */}
      <div className="space-y-3.5 bg-[#161622] border border-[#262638] rounded-2xl p-4 shadow-lg">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
          Transform & Speed
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Rotate */}
          <button
            type="button"
            onClick={handleRotate}
            className="p-2.5 rounded-xl bg-[#222232] hover:bg-[#2A2A3E] border border-[#303046] text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            Rotate ({settings.rotation}°)
          </button>

          {/* Flip H */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ flipH: !settings.flipH })}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
              settings.flipH
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/25'
                : 'bg-[#222232] hover:bg-[#2A2A3E] border-[#303046] text-slate-200'
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            Flip Horiz
          </button>

          {/* Flip V */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ flipV: !settings.flipV })}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
              settings.flipV
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/25'
                : 'bg-[#222232] hover:bg-[#2A2A3E] border-[#303046] text-slate-200'
            }`}
          >
            <FlipVertical className="w-3.5 h-3.5" />
            Flip Vert
          </button>

          {/* Speed Selector */}
          <div className="relative">
            <select
              value={settings.playbackSpeed}
              onChange={(e) => onUpdateSettings({ playbackSpeed: parseFloat(e.target.value) })}
              className="w-full bg-[#222232] hover:bg-[#2A2A3E] border border-[#303046] rounded-xl p-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value={0.5}>0.5x Slow</option>
              <option value={0.75}>0.75x Slow</option>
              <option value={1.0}>1.0x Normal</option>
              <option value={1.25}>1.25x Fast</option>
              <option value={1.5}>1.5x Fast</option>
              <option value={2.0}>2.0x Double</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Color Grading & Presets */}
      <div className="space-y-3.5 bg-[#161622] border border-[#262638] rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
            Color Grading & Filters
          </label>
          {(settings.brightness !== 1 || settings.contrast !== 1 || settings.saturation !== 1 || settings.filterPreset !== 'none') && (
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({
                  brightness: 1.0,
                  contrast: 1.0,
                  saturation: 1.0,
                  filterPreset: 'none',
                })
              }
              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-0.5 transition"
            >
              <RotateCcw className="w-3 h-3" /> Reset Colors
            </button>
          )}
        </div>

        {/* Filter Presets */}
        <div className="flex flex-wrap gap-2">
          {filterPresets.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onUpdateSettings({ filterPreset: f.id as any })}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl border transition active:scale-95 ${
                settings.filterPreset === f.id
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-[#222232] border-[#303046] text-slate-300 hover:bg-[#2A2A3E]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          {/* Brightness */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-400" /> Brightness
              </span>
              <span className="font-mono text-slate-300">{Math.round(settings.brightness * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.05}
              value={settings.brightness}
              onChange={(e) => onUpdateSettings({ brightness: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#0E0E14] rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Contrast */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Contrast className="w-3 h-3 text-cyan-400" /> Contrast
              </span>
              <span className="font-mono text-slate-300">{Math.round(settings.contrast * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.05}
              value={settings.contrast}
              onChange={(e) => onUpdateSettings({ contrast: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#0E0E14] rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Saturation */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Palette className="w-3 h-3 text-pink-400" /> Saturation
              </span>
              <span className="font-mono text-slate-300">{Math.round(settings.saturation * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={2.0}
              step={0.05}
              value={settings.saturation}
              onChange={(e) => onUpdateSettings({ saturation: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#0E0E14] rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 4. Audio Controls & Gain */}
      <div className="space-y-3.5 bg-[#161622] border border-[#262638] rounded-2xl p-4 shadow-lg">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
          Audio Options
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => onUpdateSettings({ audioMode: 'original' })}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition active:scale-95 ${
              settings.audioMode === 'original'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/25'
                : 'bg-[#222232] border-[#303046] text-slate-300'
            }`}
          >
            Keep Audio
          </button>
          <button
            type="button"
            onClick={() => onUpdateSettings({ audioMode: 'mute' })}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition active:scale-95 ${
              settings.audioMode === 'mute'
                ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-600/25'
                : 'bg-[#222232] border-[#303046] text-slate-300'
            }`}
          >
            Mute Video
          </button>
          <button
            type="button"
            onClick={() => onUpdateSettings({ audioMode: 'boost' })}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition active:scale-95 ${
              settings.audioMode === 'boost'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/25'
                : 'bg-[#222232] border-[#303046] text-slate-300'
            }`}
          >
            Volume Boost
          </button>
        </div>

        {settings.audioMode !== 'mute' && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Audio Gain Level</span>
              <span className="font-mono text-slate-200 font-semibold">{Math.round((settings.audioGain || 1.0) * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={2.0}
              step={0.1}
              value={settings.audioGain || 1.0}
              onChange={(e) => onUpdateSettings({ audioGain: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#0E0E14] rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        )}
      </div>

      {/* 5. Watermark Overlay */}
      <div className="space-y-3.5 bg-[#161622] border border-[#262638] rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Stamp className="w-3.5 h-3.5 text-indigo-400" />
            Text Watermark Overlay
          </label>
          <input
            type="checkbox"
            checked={settings.watermarkEnabled}
            onChange={(e) => onUpdateSettings({ watermarkEnabled: e.target.checked })}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-[#303046] bg-[#0E0E14]"
          />
        </div>

        {settings.watermarkEnabled && (
          <div className="space-y-3 pt-1 animate-fadeIn">
            <input
              type="text"
              value={settings.watermarkText}
              onChange={(e) => onUpdateSettings({ watermarkText: e.target.value })}
              placeholder="Enter custom watermark text (e.g., @mychannel)..."
              className="w-full bg-[#0E0E14] border border-[#262638] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'top-left', label: 'Top Left' },
                { id: 'top-right', label: 'Top Right' },
                { id: 'bottom-left', label: 'Bottom Left' },
                { id: 'bottom-right', label: 'Bottom Right' },
              ].map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => onUpdateSettings({ watermarkPosition: pos.id as any })}
                  className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition active:scale-95 ${
                    settings.watermarkPosition === pos.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/25'
                      : 'bg-[#222232] border-[#303046] text-slate-300'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
