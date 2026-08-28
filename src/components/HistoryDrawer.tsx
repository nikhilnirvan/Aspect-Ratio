import React from 'react';
import { History, X, Download, Trash2, ExternalLink, FileVideo } from 'lucide-react';
import { BatchItem } from '../types';
import { formatBytes, formatTime } from '../utils/formatters';
import { downloadMedia } from '../utils/downloadHelper';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: BatchItem[];
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  historyItems,
  onClearHistory,
  onRemoveItem,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#13131A] border-l border-[#262638] w-full max-w-md h-full flex flex-col shadow-2xl text-slate-100 animate-slideLeft">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262638] flex items-center justify-between bg-[#0E0E14]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-md">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Conversion History</h3>
              <p className="text-xs text-slate-400">{historyItems.length} Past Converted Videos</p>
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
        {historyItems.length > 0 && (
          <div className="p-3.5 bg-[#0E0E14] border-b border-[#262638] flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">Stored in local session storage</span>
            <button
              type="button"
              onClick={onClearHistory}
              className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All History
            </button>
          </div>
        )}

        {/* List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {historyItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              No converted videos yet. Convert your first video to see it stored here!
            </div>
          ) : (
            historyItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#161622] border border-[#262638] rounded-2xl p-4 space-y-2.5 flex flex-col justify-between shadow-md"
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
                      <h4 className="font-bold text-xs text-white truncate max-w-[200px]">{item.video.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {item.settings.aspectRatioId} • {item.settings.quality} • {item.settings.fillMode}
                      </p>
                      {item.outputSize && (
                        <p className="text-[10px] text-slate-500 font-mono">{formatBytes(item.outputSize)}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-[#222232] transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {item.outputBlobUrl && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262638]">
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
                      className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
