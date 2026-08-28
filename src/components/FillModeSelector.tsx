import React, { useRef } from 'react';
import {
  Layers,
  Sparkles,
  Droplet,
  Square,
  Crop,
  Maximize,
  Grid,
  Image as ImageIcon,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { FillMode, VideoTransformSettings } from '../types';
import { COLOR_PALETTES } from '../data/presets';

interface FillModeSelectorProps {
  settings: VideoTransformSettings;
  onUpdateSettings: (updates: Partial<VideoTransformSettings>) => void;
  onOpenAI: () => void;
}

export const FillModeSelector: React.FC<FillModeSelectorProps> = ({
  settings,
  onUpdateSettings,
  onOpenAI,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fillModes: { id: FillMode; name: string; description: string; icon: React.FC<any> }[] = [
    {
      id: 'blur',
      name: 'Blur Background',
      description: 'Blurred ambient backdrop (Signature TikTok/Reels look)',
      icon: Droplet,
    },
    {
      id: 'letterbox',
      name: 'Letterbox / Color Fill',
      description: 'Classic bars with custom solid color or black border',
      icon: Square,
    },
    {
      id: 'smart-crop',
      name: 'Smart AI Crop',
      description: 'Auto-frame key focal subject & eliminate black bars',
      icon: Sparkles,
    },
    {
      id: 'manual-crop',
      name: 'Manual Crop & Pan',
      description: 'Zoom to fill frame and customize focal center coordinates',
      icon: Crop,
    },
    {
      id: 'pattern',
      name: 'Pattern Fill',
      description: 'Modern subtle grid, dot matrix, or diagonal backdrop',
      icon: Grid,
    },
    {
      id: 'image',
      name: 'Custom Image Fill',
      description: 'Upload custom backdrop image or brand banner',
      icon: ImageIcon,
    },
    {
      id: 'stretch',
      name: 'Stretch to Fit',
      description: 'Distorts video frame to exact dimensions (Not recommended)',
      icon: Maximize,
    },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      onUpdateSettings({ fillMode: 'image', backgroundImageUrl: url });
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          Content Handling & Fill Method
        </label>
        <p className="text-xs text-slate-400">
          Choose how the video adapts to new aspect ratio dimensions when letterboxing occurs.
        </p>
      </div>

      {/* Fill Mode Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {fillModes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = settings.fillMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              id={`fill-mode-${mode.id}`}
              onClick={() => {
                onUpdateSettings({ fillMode: mode.id });
                if (mode.id === 'smart-crop') onOpenAI();
              }}
              className={`p-3.5 rounded-2xl text-left border transition-all flex items-start gap-3 active:scale-[0.98] ${
                isSelected
                  ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/40'
                  : 'bg-[#161622] border-[#262638] hover:border-[#383850] text-slate-300 hover:bg-[#1A1A28]'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-[#222232] text-slate-400 border border-[#303046]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white">{mode.name}</span>
                  {mode.id === 'smart-crop' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      AI Focal
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{mode.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sub-controls based on active Fill Mode */}

      {/* 1. Blur Background Sub-Controls */}
      {settings.fillMode === 'blur' && (
        <div className="bg-[#161622] border border-[#262638] rounded-2xl p-4 space-y-3.5 animate-fadeIn shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Blur Background Settings</span>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">{settings.blurAmount || 24}px Radius</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Blur Strength</span>
              <span className="font-mono text-slate-300">{settings.blurAmount || 24}px</span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              value={settings.blurAmount || 24}
              onChange={(e) => onUpdateSettings({ blurAmount: parseInt(e.target.value, 10) })}
              className="w-full h-2 bg-[#0E0E14] rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Ambient Brightness</span>
              <span className="font-mono text-slate-300">{Math.round((settings.blurBrightness || 0.75) * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.3}
              max={1.2}
              step={0.05}
              value={settings.blurBrightness || 0.75}
              onChange={(e) => onUpdateSettings({ blurBrightness: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#0E0E14] rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      )}

      {/* 2. Letterbox / Solid Color Sub-Controls */}
      {settings.fillMode === 'letterbox' && (
        <div className="bg-[#161622] border border-[#262638] rounded-2xl p-4 space-y-3.5 animate-fadeIn shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Letterbox Bar Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.fillColor || '#000000'}
                onChange={(e) => onUpdateSettings({ fillColor: e.target.value })}
                className="w-7 h-7 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <span className="text-xs font-mono font-bold text-slate-300 bg-[#0E0E14] px-2 py-1 rounded-lg border border-[#262638]">{settings.fillColor}</span>
            </div>
          </div>

          {/* Color Palettes */}
          <div className="flex flex-wrap gap-2 pt-1">
            {COLOR_PALETTES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => onUpdateSettings({ fillColor: c.value })}
                className={`w-8 h-8 rounded-xl border transition active:scale-95 ${
                  settings.fillColor === c.value
                    ? 'border-indigo-400 scale-110 shadow-md ring-2 ring-indigo-400/50'
                    : 'border-[#303046] hover:scale-105'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* 3. Crop & Pan Focal Point Controls */}
      {(settings.fillMode === 'smart-crop' || settings.fillMode === 'manual-crop') && (
        <div className="bg-[#161622] border border-[#262638] rounded-2xl p-4 space-y-3.5 animate-fadeIn shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Focal Point Pan Offset</span>
            <button
              type="button"
              onClick={() => onUpdateSettings({ cropXPercent: 50, cropYPercent: 50 })}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold transition"
            >
              Reset to Center (50/50)
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Tip: You can also click or drag directly on the video preview stage to adjust focal center!
          </p>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Horizontal Pan (X-Axis)</span>
                <span className="font-mono text-slate-300">{settings.cropXPercent}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.cropXPercent !== undefined ? settings.cropXPercent : 50}
                onChange={(e) => onUpdateSettings({ cropXPercent: parseInt(e.target.value, 10) })}
                className="w-full h-2 bg-[#0E0E14] rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Vertical Pan (Y-Axis)</span>
                <span className="font-mono text-slate-300">{settings.cropYPercent !== undefined ? settings.cropYPercent : 50}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.cropYPercent !== undefined ? settings.cropYPercent : 50}
                onChange={(e) => onUpdateSettings({ cropYPercent: parseInt(e.target.value, 10) })}
                className="w-full h-2 bg-[#0E0E14] rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Pattern Fill Sub-Controls */}
      {settings.fillMode === 'pattern' && (
        <div className="bg-[#161622] border border-[#262638] rounded-2xl p-4 space-y-3 animate-fadeIn shadow-lg">
          <span className="text-xs font-bold text-slate-200 block">Pattern Style</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'grid', label: 'Studio Grid' },
              { id: 'dots', label: 'Dot Matrix' },
              { id: 'diagonal', label: 'Diagonal Lines' },
            ].map((pat) => (
              <button
                key={pat.id}
                type="button"
                onClick={() => onUpdateSettings({ patternType: pat.id as any })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition active:scale-95 ${
                  settings.patternType === pat.id
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/25'
                    : 'bg-[#222232] border-[#303046] text-slate-300'
                }`}
              >
                {pat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Custom Image Upload */}
      {settings.fillMode === 'image' && (
        <div className="bg-[#161622] border border-[#262638] rounded-2xl p-4 space-y-3 animate-fadeIn shadow-lg">
          <span className="text-xs font-bold text-slate-200 block">Background Image Fill</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 px-4 rounded-xl border border-dashed border-[#3A3A52] hover:border-indigo-500 bg-[#0E0E14] flex items-center justify-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition active:scale-[0.99]"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            {settings.backgroundImageUrl ? 'Change Background Image' : 'Upload Backdrop Image'}
          </button>
        </div>
      )}

      {/* 6. Stretch Warning */}
      {settings.fillMode === 'stretch' && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-3.5 flex items-start gap-2.5 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Aspect Ratio Distortion Warning:</span> Stretching the video can cause
            noticeable distortion to human faces, text, and geometric objects. Consider using{' '}
            <strong className="text-white font-bold">Blur Background</strong> or <strong className="text-white font-bold">Smart Crop</strong>{' '}
            for professional aesthetics.
          </div>
        </div>
      )}
    </div>
  );
};
