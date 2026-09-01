import React, { useState, useEffect, useRef } from 'react';
import {
  Server,
  Zap,
  Globe,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Info,
  Sliders,
  ShieldCheck,
  HardDrive,
  X,
  ExternalLink,
} from 'lucide-react';
import { EngineStatus, ProcessingEngineMode } from '../types';

interface EngineStatusBadgeProps {
  engineStatus: EngineStatus | null;
  engineMode: ProcessingEngineMode;
  onSelectEngineMode: (mode: ProcessingEngineMode) => void;
  onRefreshStatus: () => void;
  isChecking?: boolean;
}

export const EngineStatusBadge: React.FC<EngineStatusBadgeProps> = ({
  engineStatus,
  engineMode,
  onSelectEngineMode,
  onRefreshStatus,
  isChecking = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const isServerActive =
    engineMode === 'server-ffmpeg' ||
    (engineMode === 'auto' && (engineStatus?.serverAvailable ?? true));

  const isServerAvailable = engineStatus?.serverAvailable ?? true;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Header Pill Button */}
      <button
        type="button"
        id="btn-engine-status-badge"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm ${
          isChecking
            ? 'bg-[#141420] text-slate-400 border-[#26263A]'
            : isServerActive && isServerAvailable
            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            : isServerAvailable && engineMode === 'client-fallback'
            ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
        }`}
        title="Click to inspect server FFmpeg availability, latency, and processing engine settings"
      >
        {/* Status Indicator Pulse Dot */}
        <span className="relative flex h-2 w-2">
          {isServerActive && isServerAvailable && !isChecking && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isChecking
                ? 'bg-slate-400 animate-pulse'
                : isServerActive && isServerAvailable
                ? 'bg-emerald-400'
                : isServerAvailable && engineMode === 'client-fallback'
                ? 'bg-indigo-400'
                : 'bg-amber-400'
            }`}
          />
        </span>

        {/* Engine Icon */}
        {isServerActive && isServerAvailable ? (
          <Server className="w-3.5 h-3.5 text-emerald-400 hidden xs:inline" />
        ) : (
          <Globe className="w-3.5 h-3.5 text-amber-400 hidden xs:inline" />
        )}

        {/* Engine Label */}
        <span className="font-mono text-[11px] font-bold">
          {isChecking ? (
            <span className="text-slate-400">Checking...</span>
          ) : isServerActive && isServerAvailable ? (
            <>
              <span className="hidden md:inline">Server FFmpeg</span>
              <span className="md:hidden">FFmpeg</span>
              <span className="hidden lg:inline text-[10px] opacity-75 font-sans ml-1 text-emerald-400">
                (Native)
              </span>
            </>
          ) : engineMode === 'client-fallback' ? (
            <>
              <span className="hidden md:inline">Client Browser</span>
              <span className="md:hidden">Browser</span>
              <span className="hidden lg:inline text-[10px] opacity-75 font-sans ml-1 text-indigo-400">
                (Fallback)
              </span>
            </>
          ) : (
            <>
              <span className="hidden md:inline">Client Fallback</span>
              <span className="md:hidden">Client</span>
              <span className="hidden lg:inline text-[10px] opacity-75 font-sans ml-1 text-amber-400">
                (Offline)
              </span>
            </>
          )}
        </span>

        <ChevronDown
          className={`w-3 h-3 transition-transform text-slate-400 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 sm:left-auto mt-2 w-80 sm:w-96 bg-[#0F0F17] border border-[#26263A] rounded-2xl shadow-2xl p-4 z-50 text-slate-200 animate-fadeIn space-y-3.5 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#222234] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Processing Engine Status</h4>
                <p className="text-[10px] text-slate-400">Server FFmpeg vs Client-Side Fallback</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRefreshStatus()}
              disabled={isChecking}
              className="p-1.5 rounded-lg bg-[#181826] hover:bg-[#222236] text-slate-400 hover:text-white transition disabled:opacity-50"
              title="Ping & Test Engine Status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>

          {/* Active Engine Card */}
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
              isServerActive && isServerAvailable
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isServerActive && isServerAvailable ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-bold text-white flex items-center justify-between">
                <span>
                  {isServerActive && isServerAvailable
                    ? 'Server FFmpeg Engine (Active)'
                    : 'Client-Side Canvas Engine (Active)'}
                </span>
                {engineStatus?.latencyMs !== undefined && (
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-300">
                    {engineStatus.latencyMs}ms ping
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                {isServerActive && isServerAvailable
                  ? 'All conversions use native multi-threaded FFmpeg for exact frame timing, zero-PTS sync, and high-performance H.264/AAC encoding.'
                  : 'Conversions use browser HTML5 Canvas 2D and Web Audio API encoders. Runs 100% locally.'}
              </p>
            </div>
          </div>

          {/* Engine Mode Selection */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-indigo-400" /> Engine Routing Policy
            </span>
            <div className="grid grid-cols-3 gap-1.5 bg-[#141420] p-1 rounded-xl border border-[#222234]">
              <button
                type="button"
                onClick={() => onSelectEngineMode('auto')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  engineMode === 'auto'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-[#1E1E30]'
                }`}
              >
                Auto (Best)
              </button>
              <button
                type="button"
                onClick={() => onSelectEngineMode('server-ffmpeg')}
                disabled={!isServerAvailable}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer disabled:opacity-40 ${
                  engineMode === 'server-ffmpeg'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-[#1E1E30]'
                }`}
              >
                Force Server
              </button>
              <button
                type="button"
                onClick={() => onSelectEngineMode('client-fallback')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  engineMode === 'client-fallback'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-[#1E1E30]'
                }`}
              >
                Force Client
              </button>
            </div>
          </div>

          {/* Engine Technical Specifications */}
          <div className="bg-[#141420] p-3 rounded-xl border border-[#222234] space-y-2 text-xs">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Server FFmpeg Binary:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {engineStatus?.ffmpeg?.available ? `Ready (${engineStatus.ffmpeg.version})` : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">FFprobe Stream Analyzer:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {engineStatus?.ffprobe?.available ? `Ready (${engineStatus.ffprobe.version})` : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Audio/Video Sync Method:</span>
              <span className="font-mono text-indigo-300 font-bold">Zero-PTS Alignment</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Browser Fallback Tech:</span>
              <span className="font-mono text-slate-300">Canvas 2D + MediaRecorder</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Lossless PTS synchronization active
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-white font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
