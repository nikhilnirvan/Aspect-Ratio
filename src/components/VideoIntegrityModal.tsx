import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Film,
  Volume2,
  Clock,
  Layers,
  Wrench,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Info,
  X,
  FileCode,
} from 'lucide-react';
import { VideoDiagnostics } from '../types';
import { formatBytes, formatTime } from '../utils/formatters';

interface VideoIntegrityModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostics: VideoDiagnostics | null;
  isLoading?: boolean;
  onRecheck?: () => void;
  onRepairSuccess?: (repairedUrl: string, repairedFilename: string, size: number) => void;
}

export const VideoIntegrityModal: React.FC<VideoIntegrityModalProps> = ({
  isOpen,
  onClose,
  diagnostics,
  isLoading = false,
  onRecheck,
  onRepairSuccess,
}) => {
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairResult, setRepairResult] = useState<{ success: boolean; message: string; url?: string } | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  if (!isOpen) return null;

  const handleRepair = async () => {
    if (!diagnostics?.targetFilename) return;
    setIsRepairing(true);
    setRepairResult(null);

    try {
      const res = await fetch('/api/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: diagnostics.targetFilename,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRepairResult({
          success: true,
          message: data.message || 'Video successfully repaired with Web-Safe CFR 30fps and zero-PTS alignment!',
          url: data.repairedUrl,
        });
        if (onRepairSuccess) {
          onRepairSuccess(data.repairedUrl, data.repairedFilename, data.size);
        }
      } else {
        setRepairResult({
          success: false,
          message: data.error || 'Repair failed. Please check server logs.',
        });
      }
    } catch (err: any) {
      setRepairResult({
        success: false,
        message: err.message || 'Failed to execute repair pipeline.',
      });
    } finally {
      setIsRepairing(false);
    }
  };

  const getHealthBadge = () => {
    if (!diagnostics) return null;
    switch (diagnostics.healthRating) {
      case 'perfect':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> Perfect Integrity (100% Web-Safe)
          </span>
        );
      case 'good':
        return (
          <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> Healthy Stream
          </span>
        );
      case 'warning':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5" /> Compatibility Warning
          </span>
        );
      case 'critical':
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5" /> Track Desync / Critical Error
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0F0F17] border border-[#26263A] rounded-3xl shadow-2xl overflow-hidden text-slate-200 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4.5 bg-[#141420] border-b border-[#222234] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Video Integrity & Stream Diagnostics
                </h3>
                {getHealthBadge()}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Target: {diagnostics?.targetFilename || 'Active Video'} • Engine: {diagnostics?.source || 'FFprobe + Browser Decoder'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRecheck && (
              <button
                type="button"
                onClick={onRecheck}
                disabled={isLoading}
                className="p-2 rounded-xl bg-[#1C1C2C] hover:bg-[#25253A] text-slate-300 border border-[#2E2E44] transition disabled:opacity-50"
                title="Re-run Diagnostic Probe"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#1C1C2C] hover:bg-[#25253A] text-slate-300 hover:text-white border border-[#2E2E44] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <div className="text-center">
                <h4 className="font-bold text-sm text-white">Analyzing Video Stream Structures...</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Probing container packets, video track codecs, audio PTS timestamps, and pixel formats.
                </p>
              </div>
            </div>
          ) : !diagnostics ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <AlertTriangle className="w-10 h-10 mx-auto text-amber-400 opacity-60" />
              <p className="text-sm">No diagnostic data available for the selected video.</p>
              {onRecheck && (
                <button
                  type="button"
                  onClick={onRecheck}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition"
                >
                  Run Diagnostic Check Now
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Summary Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3.5 shadow-md ${
                  diagnostics.healthRating === 'perfect' || diagnostics.healthRating === 'good'
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : diagnostics.healthRating === 'warning'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-red-950/30 border-red-500/40 text-red-200'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {diagnostics.healthRating === 'perfect' || diagnostics.healthRating === 'good' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : diagnostics.healthRating === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-sm text-white mb-0.5">
                    {diagnostics.healthRating === 'perfect'
                      ? 'Stream Integrity Verified'
                      : diagnostics.healthRating === 'good'
                      ? 'Stream is Playable & Valid'
                      : diagnostics.healthRating === 'warning'
                      ? 'Minor Compatibility Issue Detected'
                      : 'Critical Desynchronization / Missing Video Track'}
                  </div>
                  <p className="opacity-90 leading-relaxed">{diagnostics.summary}</p>
                </div>
              </div>

              {/* 4 Core Diagnostic Pillars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Pillar 1: Container & Format */}
                <div className="bg-[#141420] border border-[#222234] rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" /> Container
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                      {diagnostics.container.format.split(',')[0]}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duration:</span>
                      <span className="font-mono text-white font-semibold">
                        {formatTime(diagnostics.container.duration)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">File Size:</span>
                      <span className="font-mono text-white">
                        {diagnostics.container.sizeBytes ? formatBytes(diagnostics.container.sizeBytes) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bitrate:</span>
                      <span className="font-mono text-slate-200">
                        {diagnostics.container.bitrateKbps ? `${diagnostics.container.bitrateKbps} kbps` : 'Auto'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Web FastStart:</span>
                      <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Enabled
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pillar 2: Video Stream Track */}
                <div className="bg-[#141420] border border-[#222234] rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-violet-400" /> Video Track
                    </span>
                    {diagnostics.videoStream.hasVideo ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        {diagnostics.videoStream.codec?.toUpperCase() || 'H.264'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">
                        MISSING
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Resolution:</span>
                      <span className="font-mono text-white font-semibold">
                        {diagnostics.videoStream.width} × {diagnostics.videoStream.height}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pixel Format:</span>
                      <span
                        className={`font-mono font-semibold ${
                          ['yuv420p', 'yuvj420p', 'nv12'].includes(diagnostics.videoStream.pixFmt || '')
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {diagnostics.videoStream.pixFmt || 'yuv420p'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Frame Rate:</span>
                      <span className="font-mono text-slate-200">
                        {diagnostics.videoStream.fps ? `${diagnostics.videoStream.fps} FPS` : '30 FPS'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Video Start PTS:</span>
                      <span className="font-mono text-indigo-300">
                        {diagnostics.videoStream.startTime !== undefined
                          ? `${diagnostics.videoStream.startTime.toFixed(3)}s`
                          : '0.000s'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pillar 3: Audio Stream Track */}
                <div className="bg-[#141420] border border-[#222234] rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-teal-400" /> Audio Track
                    </span>
                    {diagnostics.audioStream.hasAudio ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono">
                        {diagnostics.audioStream.codec?.toUpperCase() || 'AAC'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                        MUTED
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Channels:</span>
                      <span className="font-mono text-white">
                        {diagnostics.audioStream.channels === 1
                          ? '1 (Mono)'
                          : diagnostics.audioStream.channels === 2
                          ? '2 (Stereo)'
                          : diagnostics.audioStream.channels
                          ? `${diagnostics.audioStream.channels} Channels`
                          : 'Muted'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sample Rate:</span>
                      <span className="font-mono text-slate-200">
                        {diagnostics.audioStream.sampleRate
                          ? `${(diagnostics.audioStream.sampleRate / 1000).toFixed(1)} kHz`
                          : '44.1 kHz'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Audio Bitrate:</span>
                      <span className="font-mono text-slate-200">
                        {diagnostics.audioStream.bitrateKbps ? `${diagnostics.audioStream.bitrateKbps} kbps` : '192 kbps'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Audio Start PTS:</span>
                      <span className="font-mono text-teal-300">
                        {diagnostics.audioStream.startTime !== undefined
                          ? `${diagnostics.audioStream.startTime.toFixed(3)}s`
                          : '0.000s'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pillar 4: Audio/Video Stream Sync Status */}
                <div className="bg-[#141420] border border-[#222234] rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Stream Sync
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        diagnostics.sync.status === 'in-sync'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : diagnostics.sync.status === 'slight-offset'
                          ? 'bg-teal-500/20 text-teal-300'
                          : diagnostics.sync.status === 'no-audio' || diagnostics.sync.status === 'no-video'
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {diagnostics.sync.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">PTS Offset:</span>
                      <span className="font-mono text-white font-semibold">
                        {Math.round(diagnostics.sync.ptsDeltaSec * 1000)} ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sync Quality:</span>
                      <span
                        className={`font-semibold ${
                          diagnostics.sync.ptsDeltaSec < 0.05
                            ? 'text-emerald-400'
                            : diagnostics.sync.ptsDeltaSec < 0.25
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {diagnostics.sync.ptsDeltaSec < 0.05
                          ? 'Exact (Zero Lag)'
                          : diagnostics.sync.ptsDeltaSec < 0.25
                          ? 'Acceptable'
                          : 'Severe Drift'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dropped Frames:</span>
                      <span className="font-mono text-slate-200">
                        {diagnostics.browserPlayback?.droppedFrames || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Decoded Frames:</span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        {diagnostics.browserPlayback?.decodedFrames || 'OK'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stream Timeline & Presentation Timestamp Synchronization Bar */}
              <div className="bg-[#141420] border border-[#222234] rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    Stream Timeline & Presentation Timestamp Alignment
                  </h4>
                  <span className="text-xs font-mono text-slate-400">
                    PTS Delta: {Math.round(diagnostics.sync.ptsDeltaSec * 1000)}ms
                  </span>
                </div>

                {/* Visual Timeline Bar */}
                <div className="space-y-2">
                  {/* Video Track Packet Line */}
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="w-16 text-slate-400 shrink-0 font-sans text-[11px] font-bold">Video Track</span>
                    <div className="relative flex-1 h-3 bg-[#0A0A0E] rounded-full overflow-hidden border border-[#26263A]">
                      <div
                        className="absolute inset-y-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                        style={{
                          left: `${Math.min(20, (diagnostics.videoStream.startTime || 0) * 10)}%`,
                          right: '0%',
                        }}
                      />
                    </div>
                    <span className="w-16 text-right text-indigo-300 shrink-0 text-[11px]">
                      {diagnostics.videoStream.startTime !== undefined
                        ? `${diagnostics.videoStream.startTime.toFixed(3)}s`
                        : '0.000s'}
                    </span>
                  </div>

                  {/* Audio Track Packet Line */}
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="w-16 text-slate-400 shrink-0 font-sans text-[11px] font-bold">Audio Track</span>
                    <div className="relative flex-1 h-3 bg-[#0A0A0E] rounded-full overflow-hidden border border-[#26263A]">
                      <div
                        className="absolute inset-y-0 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                        style={{
                          left: `${Math.min(20, (diagnostics.audioStream.startTime || 0) * 10)}%`,
                          right: '0%',
                        }}
                      />
                    </div>
                    <span className="w-16 text-right text-teal-300 shrink-0 text-[11px]">
                      {diagnostics.audioStream.startTime !== undefined
                        ? `${diagnostics.audioStream.startTime.toFixed(3)}s`
                        : '0.000s'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 bg-[#0A0A10] p-3 rounded-xl border border-[#1E1E2E] leading-relaxed">
                  <span className="text-slate-200 font-semibold">Diagnostic Insight: </span>
                  {diagnostics.sync.explanation}
                </p>
              </div>

              {/* Recommendations & 1-Click Repair */}
              <div className="bg-[#141420] border border-[#222234] rounded-2xl p-4 sm:p-5 space-y-3.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Diagnostic Recommendations & Actions
                </h4>

                <ul className="space-y-2">
                  {diagnostics.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>

                {/* Repair Status Notification */}
                {repairResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                      repairResult.success
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                        : 'bg-red-950/40 border-red-500/40 text-red-200'
                    }`}
                  >
                    <span>{repairResult.message}</span>
                    {repairResult.url && (
                      <a
                        href={repairResult.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 ml-2"
                      >
                        <ExternalLink className="w-3 h-3" /> Test Repaired Video
                      </a>
                    )}
                  </div>
                )}

                {/* 1-Click Repair Action */}
                <button
                  type="button"
                  id="btn-run-stream-repair"
                  onClick={handleRepair}
                  disabled={isRepairing}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                >
                  {isRepairing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      Remuxing Video with Zero-PTS & Web-Safe Codecs...
                    </>
                  ) : (
                    <>
                      <Wrench className="w-4 h-4 text-indigo-200" />
                      Run 1-Click Web-Safe Stream Repair (Align PTS & Force H.264/AAC CFR)
                    </>
                  )}
                </button>
              </div>

              {/* Raw FFprobe JSON Inspector */}
              <div className="bg-[#141420] border border-[#222234] rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-300 hover:bg-[#1A1A2A] transition"
                >
                  <span className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                    Deep Technical Specs & Raw FFprobe Metadata
                  </span>
                  {showRawJson ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {showRawJson && (
                  <div className="p-4 bg-[#0A0A10] border-t border-[#222234] max-h-60 overflow-y-auto">
                    <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(diagnostics.rawProbe || diagnostics, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 bg-[#141420] border-t border-[#222234] shrink-0 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            Analyzed with server FFprobe & browser hardware decoder tests
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#222232] hover:bg-[#2C2C40] text-slate-200 font-bold transition"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
