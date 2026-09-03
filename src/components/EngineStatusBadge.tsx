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
  Laptop,
  Cloud,
  Terminal,
  Copy,
  Check,
  HelpCircle,
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
  const [activeTab, setActiveTab] = useState<'status' | 'deployment'>('status');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
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

  const isVercelHost =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('vercel.app') ||
      window.location.hostname.includes('now.sh') ||
      Boolean(engineStatus?.isVercel));

  const isServerAvailable = Boolean(engineStatus?.serverAvailable);

  const isServerActive =
    engineMode === 'server-ffmpeg' ||
    (engineMode === 'auto' && isServerAvailable);

  const isServerless = isVercelHost || (!isServerAvailable && !isChecking);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

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
            : isServerless
            ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
            : engineMode === 'client-fallback'
            ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
        }`}
        title="Click to inspect server FFmpeg availability, Vercel serverless mode, and processing engine settings"
      >
        {/* Status Indicator Pulse Dot */}
        <span className="relative flex h-2 w-2">
          {isServerActive && isServerAvailable && !isChecking && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          {isServerless && !isChecking && (
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-50" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isChecking
                ? 'bg-slate-400 animate-pulse'
                : isServerActive && isServerAvailable
                ? 'bg-emerald-400'
                : isServerless
                ? 'bg-indigo-400'
                : engineMode === 'client-fallback'
                ? 'bg-indigo-400'
                : 'bg-amber-400'
            }`}
          />
        </span>

        {/* Engine Icon */}
        {isServerActive && isServerAvailable ? (
          <Server className="w-3.5 h-3.5 text-emerald-400 hidden xs:inline" />
        ) : isVercelHost ? (
          <Cloud className="w-3.5 h-3.5 text-indigo-400 hidden xs:inline" />
        ) : (
          <Laptop className="w-3.5 h-3.5 text-indigo-400 hidden xs:inline" />
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
          ) : isVercelHost ? (
            <>
              <span className="hidden md:inline">Client Engine</span>
              <span className="md:hidden">Browser</span>
              <span className="hidden lg:inline text-[10px] opacity-90 font-sans ml-1 text-indigo-300">
                (Vercel)
              </span>
            </>
          ) : (
            <>
              <span className="hidden md:inline">Browser Engine</span>
              <span className="md:hidden">Browser</span>
              <span className="hidden lg:inline text-[10px] opacity-90 font-sans ml-1 text-indigo-300">
                (Active)
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
        <div className="absolute right-0 sm:left-auto mt-2 w-84 sm:w-105 bg-[#0F0F17] border border-[#26263A] rounded-2xl shadow-2xl p-4 z-50 text-slate-200 animate-fadeIn space-y-3.5 backdrop-blur-xl">
          {/* Header & Tabs */}
          <div className="flex items-center justify-between border-b border-[#222234] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Processing Engine</h4>
                <p className="text-[10px] text-slate-400">Server FFmpeg & Vercel Serverless Architecture</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex bg-[#141420] p-0.5 rounded-lg border border-[#222234]">
                <button
                  type="button"
                  onClick={() => setActiveTab('status')}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                    activeTab === 'status'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Status
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('deployment')}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition flex items-center gap-1 ${
                    activeTab === 'deployment'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Cloud className="w-2.5 h-2.5" />
                  Vercel Info
                </button>
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
          </div>

          {activeTab === 'status' ? (
            <>
              {/* Active Engine Card */}
              <div
                className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                  isServerActive && isServerAvailable
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                    : 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isServerActive && isServerAvailable ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Laptop className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>
                      {isServerActive && isServerAvailable
                        ? 'Server FFmpeg Engine (Active)'
                        : isVercelHost
                        ? 'Client-Side Browser Engine (Vercel Serverless)'
                        : 'Client-Side Browser Engine (Active & Ready)'}
                    </span>
                    {engineStatus?.latencyMs !== undefined && isServerAvailable && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-300">
                        {engineStatus.latencyMs}ms ping
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] opacity-90 mt-1 leading-relaxed">
                    {isServerActive && isServerAvailable
                      ? 'Conversions use native multi-threaded Linux FFmpeg for zero-PTS stream sync, CFR 30/60fps, and hardware-accelerated H.264/AAC encoding.'
                      : 'All video crops, aspect ratio conversions, blur backgrounds, and trims run 100% locally in your browser via HTML5 Canvas 2D and Web Audio. No files are uploaded to any server.'}
                  </p>
                </div>
              </div>

              {/* Vercel Serverless Notice banner when server is not available */}
              {!isServerAvailable && (
                <div className="bg-indigo-500/10 border border-indigo-500/25 p-2.5 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-300 text-[11px]">
                    <Info className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Why is Server FFmpeg offline on Vercel?</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Vercel is a serverless hosting platform. It does not have Linux FFmpeg installed and has a 4.5MB request limit. Aspect Studio automatically routes all processing to the browser engine so your app works seamlessly on Vercel!
                  </p>
                </div>
              )}

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
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                      engineMode === 'server-ffmpeg'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-[#1E1E30]'
                    }`}
                    title={!isServerAvailable ? 'Server FFmpeg unavailable on serverless host' : 'Force server encoding'}
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
                  <span className={`font-mono font-bold ${engineStatus?.ffmpeg?.available ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {engineStatus?.ffmpeg?.available ? `Ready (${engineStatus.ffmpeg.version})` : 'Offline (Serverless)'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Client Browser Engine:</span>
                  <span className="font-mono text-emerald-400 font-bold">Ready (Canvas 2D + WebAudio)</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Client Video Privacy:</span>
                  <span className="font-mono text-indigo-300 font-bold">100% Local (0KB uploaded)</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Upload Size Limit:</span>
                  <span className="font-mono text-indigo-300 font-bold">Unlimited (Device RAM)</span>
                </div>
              </div>
            </>
          ) : (
            /* Vercel & Deployment Guide Tab */
            <div className="space-y-3 text-xs">
              <div className="bg-[#141420] p-3 rounded-xl border border-[#222234] space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-xs">
                  <Cloud className="w-4 h-4 text-indigo-400" />
                  <span>Deploying on Vercel vs Docker Container</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Vercel is built for frontend web applications and serverless micro-functions. Because video encoding requires high CPU, long execution times, and custom Linux binaries (<code className="text-indigo-300 bg-black/40 px-1 py-0.5 rounded">ffmpeg</code>), full-stack FFmpeg servers cannot run directly in standard Vercel serverless functions.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" /> Your Options
                </span>

                <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 space-y-1">
                  <div className="font-bold text-emerald-300 text-xs flex items-center justify-between">
                    <span>Option 1: Keep using Vercel (Current)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Zero Setup</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    The app works out of the box! All video conversion, aspect ratios, filters, trimming, and exports are performed right inside the user&apos;s browser with zero server costs.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl border border-indigo-500/20 bg-indigo-950/20 space-y-2">
                  <div className="font-bold text-indigo-300 text-xs flex items-center justify-between">
                    <span>Option 2: Deploy Container with FFmpeg</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Native Server</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    If you want native multi-threaded server FFmpeg, deploy to a container platform using the included <code className="text-white bg-black/40 px-1 py-0.5 rounded">Dockerfile</code>:
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between bg-black/60 p-2 rounded-lg font-mono text-[10px] text-slate-200 border border-white/5">
                      <span className="truncate">docker build -t aspect-studio . && docker run -p 3000:3000 aspect-studio</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('docker build -t aspect-studio . && docker run -p 3000:3000 aspect-studio', 'docker')}
                        className="ml-2 p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white shrink-0"
                        title="Copy Docker command"
                      >
                        {copiedCmd === 'docker' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center gap-3">
                      <span>Supported: <strong>Google Cloud Run</strong></span>
                      <span><strong>Railway</strong></span>
                      <span><strong>Render</strong></span>
                      <span><strong>Fly.io</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#222234]">
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {isServerActive && isServerAvailable
                ? 'Server FFmpeg Zero-PTS active'
                : 'Browser Canvas & WebAudio active'}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-white font-bold cursor-pointer px-2 py-0.5 rounded hover:bg-white/5"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

