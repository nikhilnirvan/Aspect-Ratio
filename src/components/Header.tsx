import React from 'react';
import { Video, Sparkles, Layers, History, Bookmark, Monitor, Moon, Sun, HelpCircle, HardDrive } from 'lucide-react';
import { UserPreset } from '../types';

interface HeaderProps {
  batchCount: number;
  onOpenQueue: () => void;
  onOpenHistory: () => void;
  onOpenPresets: () => void;
  onOpenAI: () => void;
  onOpenHelp: () => void;
  activePresetName?: string;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  batchCount,
  onOpenQueue,
  onOpenHistory,
  onOpenPresets,
  onOpenAI,
  onOpenHelp,
  activePresetName,
  isProcessing,
}) => {
  return (
    <header className="border-b border-[#1E1E2A] bg-[#0A0A0C]/90 backdrop-blur-xl sticky top-0 z-30 px-4 lg:px-8 py-3.5 flex items-center justify-between text-slate-200 shadow-xl">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
          <Video className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold tracking-tight text-lg text-white">Aspect Studio</h1>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              Pro v2.4
            </span>
            {activePresetName && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
                <Bookmark className="w-3 h-3" />
                {activePresetName}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Convert, crop, blur & transform video aspect ratios in real-time
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* AI Smart Framing Trigger */}
        <button
          id="btn-open-ai-crop"
          onClick={onOpenAI}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 transition shadow-sm hover:text-white active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
          <span className="hidden md:inline">AI Smart Framing</span>
          <span className="md:hidden">AI</span>
        </button>

        {/* Presets */}
        <button
          id="btn-open-presets"
          onClick={onOpenPresets}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-[#16161F] hover:bg-[#1E1E2C] text-slate-300 border border-[#262638] transition active:scale-95"
          title="Custom Presets"
        >
          <Bookmark className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Presets</span>
        </button>

        {/* Batch Queue */}
        <button
          id="btn-open-queue"
          onClick={onOpenQueue}
          className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-[#16161F] hover:bg-[#1E1E2C] text-slate-300 border border-[#262638] transition active:scale-95"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Queue</span>
          {batchCount > 0 && (
            <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${isProcessing ? 'bg-amber-500 text-black animate-pulse' : 'bg-indigo-600 text-white'}`}>
              {batchCount}
            </span>
          )}
        </button>

        {/* History */}
        <button
          id="btn-open-history"
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-[#16161F] hover:bg-[#1E1E2C] text-slate-300 border border-[#262638] transition active:scale-95"
          title="Conversion History"
        >
          <History className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">History</span>
        </button>

        {/* Help */}
        <button
          id="btn-open-help"
          onClick={onOpenHelp}
          className="p-2 text-slate-400 hover:text-white bg-[#16161F] hover:bg-[#1E1E2C] border border-[#262638] rounded-xl transition active:scale-95"
          title="Keyboard shortcuts & format guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
