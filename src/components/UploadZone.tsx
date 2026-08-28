import React, { useState, useRef } from 'react';
import { UploadCloud, Link as LinkIcon, Film, Plus, X, Play, AlertCircle } from 'lucide-react';
import { VideoMetadata } from '../types';
import { formatDurationSimple } from '../utils/formatters';

interface UploadZoneProps {
  videos: VideoMetadata[];
  activeVideoId?: string;
  onSelectVideo: (id: string) => void;
  onAddVideos: (files: File[]) => Promise<void>;
  onAddUrl: (url: string) => Promise<void>;
  onRemoveVideo: (id: string) => void;
  isLoading: boolean;
  error?: string | null;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  videos,
  activeVideoId,
  onSelectVideo,
  onAddVideos,
  onAddUrl,
  onRemoveVideo,
  isLoading,
  error,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const rawFiles = Array.from(e.dataTransfer.files) as File[];
      const files = rawFiles.filter(
        (f: File) => f.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)$/i.test(f.name)
      );
      if (files.length > 0) {
        await onAddVideos(files);
      }
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      await onAddVideos(files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    await onAddUrl(urlInput.trim());
    setUrlInput('');
    setShowUrlInput(false);
  };

  return (
    <div className="w-full space-y-3">
      {/* Upload Drop Zone Bento Card */}
      {videos.length === 0 ? (
        <div
          id="upload-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-950/40 scale-[0.99] shadow-2xl shadow-indigo-500/20'
              : 'border-[#262638] hover:border-indigo-500/50 bg-[#121218]/90 hover:bg-[#161622] shadow-xl'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,.mp4,.webm,.mov,.avi,.mkv,.flv,.wmv"
            className="hidden"
            onChange={handleFileInput}
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Upload your video to start converting
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Supports MP4, WebM, MOV, AVI, MKV, FLV, WMV (Up to 500MB each) • Batch upload enabled
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30 transition active:scale-95 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Select Video File
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUrlInput(!showUrlInput);
                }}
                className="px-4 py-2.5 text-xs font-medium rounded-xl bg-[#1A1A26] hover:bg-[#222232] text-slate-200 border border-[#2D2D40] transition flex items-center gap-1.5 active:scale-95"
              >
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                Paste URL
              </button>
            </div>
          </div>
        </div>
      ) : (

        /* Video Carousel / Batch List Bento Card */
        <div className="bg-[#121218]/90 border border-[#1E1E2A] rounded-2xl p-3.5 space-y-2.5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Film className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white tracking-tight">
                Active Batch ({videos.length} {videos.length === 1 ? 'Video' : 'Videos'})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#1A1A26] hover:bg-[#222232] text-slate-200 border border-[#2D2D40] flex items-center gap-1.5 transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                Add More
              </button>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-[#1A1A26] hover:bg-[#222232] border border-[#2D2D40] transition active:scale-95"
                title="Paste URL"
              >
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,.mp4,.webm,.mov,.avi,.mkv"
            className="hidden"
            onChange={handleFileInput}
          />

          {/* Video Item Pills */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
            {videos.map((vid) => {
              const isActive = vid.id === activeVideoId;
              return (
                <div
                  key={vid.id}
                  onClick={() => onSelectVideo(vid.id)}
                  className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer shrink-0 transition-all active:scale-[0.98] ${
                    isActive
                      ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-500/40'
                      : 'bg-[#161622] border-[#262638] hover:border-[#383850] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {/* Thumbnail / Icon */}
                  {vid.thumbnailUrl ? (
                    <img
                      src={vid.thumbnailUrl}
                      alt={vid.name}
                      className="w-8 h-8 rounded-lg object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-[#222232] flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  )}

                  <div className="text-left">
                    <p className="text-xs font-semibold max-w-[130px] truncate text-slate-100">{vid.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {vid.aspectRatioFormatted} • {formatDurationSimple(vid.duration)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveVideo(vid.id);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-[#262638] transition"
                    title="Remove from batch"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* URL Input Bar */}
      {showUrlInput && (
        <form onSubmit={handleUrlSubmit} className="flex items-center gap-2 bg-[#121218] border border-[#262638] rounded-2xl p-2.5 shadow-xl animate-fadeIn">
          <LinkIcon className="w-4 h-4 text-slate-400 ml-2" />
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste direct video URL (e.g. https://example.com/video.mp4)..."
            className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={!urlInput.trim() || isLoading}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition active:scale-95 shadow-md shadow-indigo-600/20"
          >
            Import
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Error message if any */}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-red-950/50 border border-red-800/60 rounded-2xl text-red-300 text-xs shadow-lg">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
