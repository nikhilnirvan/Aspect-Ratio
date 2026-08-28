import React, { useState } from 'react';
import {
  Layers,
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  Download,
  Archive,
  RefreshCw,
  Trash2,
  Sparkles,
  FileVideo,
} from 'lucide-react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { BatchItem, VideoTransformSettings } from '../types';
import { formatBytes, formatTime } from '../utils/formatters';
import { downloadMedia } from '../utils/downloadHelper';

interface BatchQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchItems: BatchItem[];
  currentSettings: VideoTransformSettings;
  onApplySettingsToAll: () => void;
  onStartConversion: (itemId?: string) => Promise<void>;
  onRemoveItem: (id: string) => void;
  onClearCompleted: () => void;
  isProcessing: boolean;
}

export const BatchQueueModal: React.FC<BatchQueueModalProps> = ({
  isOpen,
  onClose,
  batchItems,
  currentSettings,
  onApplySettingsToAll,
  onStartConversion,
  onRemoveItem,
  onClearCompleted,
  isProcessing,
}) => {
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const completedItems = batchItems.filter((i) => i.status === 'completed' && i.outputBlobUrl);
  const totalCount = batchItems.length;
  const doneCount = completedItems.length;

  const handleDownloadZip = async () => {
    if (completedItems.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const item of completedItems) {
        if (item.outputBlobUrl) {
          const res = await fetch(item.outputBlobUrl);
          const blob = await res.blob();
          const ext = item.settings.container || 'mp4';
          const cleanName = item.video.name.replace(/\.[^/.]+$/, '');
          const safeRatio = (item.settings.aspectRatioId || 'custom').replace(/:/g, '-');
          zip.file(`${cleanName}_${safeRatio}.${ext}`, blob);
        }
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadMedia(zipBlob, `AspectStudio_Batch_${Date.now()}.zip`, 'zip');

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('ZIP generation error:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#13131A] border border-[#262638] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262638] flex items-center justify-between bg-[#0E0E14]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Batch Processing Queue</h3>
              <p className="text-xs text-slate-400">
                {totalCount} {totalCount === 1 ? 'Video' : 'Videos'} in queue • {doneCount} Completed
              </p>
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

        {/* Toolbar */}
        <div className="p-3.5 bg-[#0E0E14] border-b border-[#262638] flex flex-wrap items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={onApplySettingsToAll}
            className="px-3 py-1.5 rounded-xl bg-[#222232] hover:bg-[#2A2A3E] text-slate-200 border border-[#303046] font-bold transition flex items-center gap-1.5 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Sync Current Settings to All
          </button>

          <div className="flex items-center gap-2">
            {completedItems.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold shadow-md transition flex items-center gap-1.5 active:scale-95"
              >
                {isZipping ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                Download All ZIP ({doneCount})
              </button>
            )}

            {doneCount > 0 && (
              <button
                type="button"
                onClick={onClearCompleted}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#222232] transition"
                title="Clear completed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {batchItems.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No videos currently in the batch queue. Add videos from the main studio canvas.
            </div>
          ) : (
            batchItems.map((item) => {
              const isItemProcessing = item.status === 'processing';
              const isItemDone = item.status === 'completed';
              const isItemFailed = item.status === 'failed';

              return (
                <div
                  key={item.id}
                  className="bg-[#161622] border border-[#262638] rounded-2xl p-4 space-y-2.5 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.video.thumbnailUrl ? (
                        <img
                          src={item.video.thumbnailUrl}
                          alt={item.video.name}
                          className="w-11 h-11 rounded-xl object-cover border border-[#303046] shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-[#222232] border border-[#303046] flex items-center justify-center shrink-0">
                          <FileVideo className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white truncate max-w-xs">{item.video.name}</h4>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {item.video.aspectRatioFormatted} ➔{' '}
                          <strong className="text-indigo-300 font-bold">{item.settings.aspectRatioId}</strong> (
                          {item.settings.quality} • {item.settings.fillMode})
                        </p>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isItemDone && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold px-2 py-0.5 rounded-lg bg-emerald-950/50 border border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Done
                        </span>
                      )}
                      {isItemProcessing && (
                        <span className="flex items-center gap-1 text-[11px] text-amber-400 font-bold px-2 py-0.5 rounded-lg bg-amber-950/50 border border-amber-800">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {item.progress}%
                        </span>
                      )}
                      {isItemFailed && (
                        <span className="flex items-center gap-1 text-[11px] text-red-400 font-bold px-2 py-0.5 rounded-lg bg-red-950/50 border border-red-800">
                          <AlertCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}

                      {/* Download Single */}
                      {isItemDone && item.outputBlobUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            if (item.outputBlobUrl) {
                              const safeRatio = (item.settings.aspectRatioId || 'custom').replace(/:/g, '-');
                              const safeBaseName = item.video.name.replace(/\.[^/.]+$/, '');
                              downloadMedia(
                                item.outputBlobUrl,
                                `Converted_${safeRatio}_${safeBaseName}`,
                                item.settings.container || 'mp4'
                              );
                            }
                          }}
                          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md active:scale-95 cursor-pointer"
                          title="Download Converted Video"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}

                      {/* Remove item */}
                      {!isProcessing && (
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-[#222232] transition active:scale-95"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {isItemProcessing && (
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-[#0E0E14] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">{item.statusMessage || 'Processing video frames...'}</p>
                    </div>
                  )}

                  {/* Error display */}
                  {isItemFailed && item.error && (
                    <p className="text-[11px] text-red-400 bg-red-950/30 p-2 rounded-xl border border-red-900/50">
                      {item.error}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#262638] bg-[#0E0E14] flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {batchItems.filter((i) => i.status === 'idle').length} videos pending conversion
          </span>

          <button
            type="button"
            id="btn-start-batch-convert"
            disabled={isProcessing || batchItems.every((i) => i.status === 'completed')}
            onClick={() => onStartConversion()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition active:scale-95"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing Batch...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Convert All Queued ({batchItems.filter((i) => i.status !== 'completed').length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
