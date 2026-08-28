import React from 'react';
import { HelpCircle, X, Keyboard, Smartphone, Tv, Sparkles, Film } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#13131A] border border-[#262638] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262638] flex items-center justify-between bg-[#0E0E14]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-md">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Aspect Ratio Studio Guide</h3>
              <p className="text-xs text-slate-400">Keyboard shortcuts & Platform guidelines</p>
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

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Keyboard shortcuts */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-indigo-400">
              <Keyboard className="w-4 h-4" /> Keyboard Shortcuts
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#161622] p-3 rounded-2xl border border-[#262638] flex items-center justify-between shadow-sm">
                <span>Play / Pause</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-[#0E0E14] border border-[#303046] text-slate-200 font-mono text-[10px] font-bold">Space</kbd>
              </div>
              <div className="bg-[#161622] p-3 rounded-2xl border border-[#262638] flex items-center justify-between shadow-sm">
                <span>Step Forward 1 Frame</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-[#0E0E14] border border-[#303046] text-slate-200 font-mono text-[10px] font-bold">➔ Right</kbd>
              </div>
              <div className="bg-[#161622] p-3 rounded-2xl border border-[#262638] flex items-center justify-between shadow-sm">
                <span>Step Backward 1 Frame</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-[#0E0E14] border border-[#303046] text-slate-200 font-mono text-[10px] font-bold">⬅ Left</kbd>
              </div>
              <div className="bg-[#161622] p-3 rounded-2xl border border-[#262638] flex items-center justify-between shadow-sm">
                <span>Toggle Fullscreen</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-[#0E0E14] border border-[#303046] text-slate-200 font-mono text-[10px] font-bold">F</kbd>
              </div>
            </div>
          </div>

          {/* Social Platform Aspect Ratio cheat sheet */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-amber-400">
              <Smartphone className="w-4 h-4" /> Recommended Social Formats
            </h4>
            <div className="space-y-1.5 bg-[#161622] p-4 rounded-2xl border border-[#262638] shadow-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-[#262638]">
                <span className="font-semibold text-white">TikTok, Reels, YouTube Shorts</span>
                <span className="font-mono text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">9:16 (1080×1920)</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#262638]">
                <span className="font-semibold text-white">YouTube Widescreen & TV</span>
                <span className="font-mono text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">16:9 (1920×1080)</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#262638]">
                <span className="font-semibold text-white">Instagram Feed Posts</span>
                <span className="font-mono text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">1:1 / 4:5 (1080×1350)</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="font-semibold text-white">Cinematic Ultrawide</span>
                <span className="font-mono text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">21:9 (2560×1080)</span>
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-emerald-400">
              <Sparkles className="w-4 h-4" /> Pro Tips
            </h4>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
              <li>
                Use <strong className="text-white">Blur Background</strong> mode to turn landscape 16:9 videos into viral 9:16 vertical videos with ambient borders.
              </li>
              <li>
                Click or drag anywhere on the video preview stage when in <strong className="text-white">Crop Mode</strong> to adjust the focal point anchor instantly.
              </li>
              <li>
                Batch convert multiple videos at once and download everything neatly packaged in a single ZIP file.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
