import React, { useState } from 'react';
import { Bookmark, Plus, Trash2, Check, X } from 'lucide-react';
import { UserPreset, VideoTransformSettings } from '../types';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: UserPreset[];
  currentSettings: VideoTransformSettings;
  onSaveCurrentAsPreset: (name: string, description: string) => void;
  onLoadPreset: (preset: UserPreset) => void;
  onDeletePreset: (id: string) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  presets,
  currentSettings,
  onSaveCurrentAsPreset,
  onLoadPreset,
  onDeletePreset,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSaveCurrentAsPreset(name.trim(), description.trim());
    setName('');
    setDescription('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#13131A] border border-[#262638] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262638] flex items-center justify-between bg-[#0E0E14]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30 shadow-md">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Custom Presets & Profiles</h3>
              <p className="text-xs text-slate-400">Save and load your favorite aspect ratio & styling configurations</p>
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

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Create New Preset Form */}
          {!isCreating ? (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="w-full py-3 px-4 rounded-2xl border border-dashed border-[#3A3A52] hover:border-indigo-500 bg-[#161622] flex items-center justify-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition active:scale-[0.99]"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              Save Current Settings as New Preset
            </button>
          ) : (
            <form onSubmit={handleSave} className="bg-[#161622] p-4 sm:p-5 rounded-2xl border border-indigo-500/40 space-y-3.5 shadow-lg">
              <span className="text-xs font-bold text-white block">Create Preset Profile</span>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Preset Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., TikTok Viral 9:16 Ambient Blur"
                  className="w-full bg-[#0E0E14] border border-[#262638] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., 1080x1920, 24px blur, cinematic warmth"
                  className="w-full bg-[#0E0E14] border border-[#262638] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition active:scale-95"
                >
                  Save Preset
                </button>
              </div>
            </form>
          )}

          {/* Preset list */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Saved Profiles ({presets.length})
            </span>

            {presets.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No custom presets saved yet. Save your current configuration above!
              </p>
            ) : (
              presets.map((preset) => (
                <div
                  key={preset.id}
                  className="bg-[#161622] border border-[#262638] hover:border-[#383850] rounded-2xl p-3.5 flex items-center justify-between gap-3 transition shadow-md"
                >
                  <div>
                    <h4 className="font-bold text-xs text-white">{preset.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {preset.settings.aspectRatioId} • {preset.settings.quality} • {preset.settings.fillMode}
                    </p>
                    {preset.description && (
                      <p className="text-[10px] text-slate-500 italic mt-0.5">{preset.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onLoadPreset(preset);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition active:scale-95"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePreset(preset.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-xl hover:bg-[#222232] transition"
                      title="Delete Preset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
