export type AspectRatioId =
  | '16:9'
  | '9:16'
  | '1:1'
  | '4:3'
  | '21:9'
  | '2.35:1'
  | '3:2'
  | '9:21'
  | '4:5'
  | 'custom';

export type FillMode =
  | 'letterbox'
  | 'blur'
  | 'smart-crop'
  | 'manual-crop'
  | 'stretch'
  | 'pattern'
  | 'image';

export type VideoQuality = '360p' | '720p' | '1080p' | '1440p' | '4K' | 'original' | 'custom';
export type VideoCodec = 'h264' | 'hevc' | 'vp9' | 'auto';
export type OutputContainer = 'mp4' | 'webm' | 'mov' | 'mkv';

export interface AspectRatioPreset {
  id: AspectRatioId;
  name: string;
  ratioW: number;
  ratioH: number;
  label: string;
  description: string;
  platform: string;
  recommendedResolution: { width: number; height: number };
  iconName?: string;
}

export interface VideoTransformSettings {
  aspectRatioId: AspectRatioId;
  customRatioW: number;
  customRatioH: number;
  targetWidth: number;
  targetHeight: number;
  quality: VideoQuality;
  fps: number; // 0 = keep original, 24, 30, 60
  codec: VideoCodec;
  container: OutputContainer;
  bitrateKbps?: number;

  // Content Handling & Fill
  fillMode: FillMode;
  fillColor: string; // e.g. '#000000'
  blurAmount: number; // 5 to 60 px
  blurBrightness: number; // 0.3 to 1.5
  patternType: 'grid' | 'dots' | 'diagonal' | 'carbon';
  backgroundImageUrl?: string;

  // Crop & Framing
  cropXPercent: number; // 0-100% focal center X
  cropYPercent: number; // 0-100% focal center Y
  manualCropRect?: { x: number; y: number; width: number; height: number }; // normalized 0-1

  // Edit adjustments
  trimStartSec: number;
  trimEndSec: number;
  rotation: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  playbackSpeed: number; // 0.25 to 2.0

  // Color adjustments
  brightness: number; // 0.5 to 1.5, default 1.0
  contrast: number; // 0.5 to 1.5, default 1.0
  saturation: number; // 0.0 to 2.0, default 1.0
  filterPreset: 'none' | 'cinematic' | 'warm' | 'cool' | 'vintage' | 'bw' | 'vivid';

  // Audio adjustments
  audioMode: 'original' | 'mute' | 'boost' | 'extract-audio';
  audioGain: number; // 0 to 2.0 (1.0 = 100%)

  // Watermark
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  watermarkOpacity: number; // 0.1 to 1.0
  watermarkFontSize: number; // 12 to 48
}

export interface VideoMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  duration: number;
  width: number;
  height: number;
  aspectRatio: number;
  aspectRatioFormatted: string;
  fps: number;
  url: string;
  serverUrl?: string;
  file?: File;
  thumbnailUrl?: string;
  isSample?: boolean;
}

export interface BatchItem {
  id: string;
  video: VideoMetadata;
  settings: VideoTransformSettings;
  status: 'idle' | 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0 to 100
  statusMessage?: string;
  outputBlobUrl?: string;
  outputSize?: number;
  outputFormat?: string;
  error?: string;
  jobId?: string;
  startTime?: number;
  endTime?: number;
}

export interface UserPreset {
  id: string;
  name: string;
  description: string;
  settings: VideoTransformSettings;
  createdAt: number;
}

export interface SmartCropAnalysis {
  detectedSubject: string;
  subjectCoordinates: { x: number; y: number; width: number; height: number }; // normalized 0-1
  recommendedRatio: AspectRatioId;
  recommendedFillMode: FillMode;
  suggestedTitle: string;
  suggestedTags: string[];
  reasoning: string;
}

export interface ConversionJobResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputUrl?: string;
  outputSize?: number;
  error?: string;
  timeRemainingSec?: number;
}
