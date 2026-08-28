import { VideoMetadata, VideoTransformSettings } from '../types';
import { calculateAspectRatioString, computeOutputDimensions } from './formatters';

/**
 * Extract video metadata from File or URL
 */
export async function extractVideoMetadata(fileOrUrl: File | string, name?: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    let url: string;
    let fileObj: File | undefined;

    if (typeof fileOrUrl === 'string') {
      url = fileOrUrl;
    } else {
      fileObj = fileOrUrl;
      url = URL.createObjectURL(fileOrUrl);
    }

    video.src = url;

    const timeout = setTimeout(() => {
      reject(new Error('Video metadata extraction timed out. Please check file format or URL.'));
    }, 15000);

    video.onloadedmetadata = async () => {
      clearTimeout(timeout);
      const width = video.videoWidth || 1920;
      const height = video.videoHeight || 1080;
      const duration = video.duration || 10;
      const aspect = width / height;

      // Extract a representative thumbnail at 1 second or midpoint
      let thumbnailUrl = '';
      try {
        video.currentTime = Math.min(1.0, duration / 2);
        await new Promise((r) => {
          video.onseeked = () => r(null);
          setTimeout(r, 500);
        });

        const canvas = document.createElement('canvas');
        canvas.width = Math.min(320, width);
        canvas.height = Math.round(canvas.width / aspect);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        }
      } catch (e) {
        console.warn('Could not generate thumbnail', e);
      }

      resolve({
        id: 'vid_' + Math.random().toString(36).substring(2, 9),
        name: name || (fileObj ? fileObj.name : 'Web_Video_' + Date.now() + '.mp4'),
        size: fileObj ? fileObj.size : 1024 * 1024 * 5,
        type: fileObj ? fileObj.type : 'video/mp4',
        duration,
        width,
        height,
        aspectRatio: aspect,
        aspectRatioFormatted: calculateAspectRatioString(width, height),
        fps: 30,
        url,
        file: fileObj,
        thumbnailUrl,
      });
    };

    video.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load video. Ensure the format is supported or URL allows cross-origin access.'));
    };
  });
}

/**
 * Capture a high-res frame from video at specific time as base64 JPEG
 */
export async function captureVideoFrameBase64(videoUrl: string, timeSec: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.src = videoUrl;

    video.onloadeddata = () => {
      video.currentTime = Math.max(0, timeSec);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(1280, video.videoWidth || 1280);
        canvas.height = Math.min(720, video.videoHeight || 720);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        resolve(base64);
      } catch (err) {
        reject(err);
      }
    };

    video.onerror = () => reject(new Error('Error seeking video frame'));
  });
}

/**
 * Draw a single transformed video frame onto canvas based on transform settings
 */
export function drawTransformedFrame(
  ctx: CanvasRenderingContext2D,
  videoEl: HTMLVideoElement,
  settings: VideoTransformSettings,
  targetWidth: number,
  targetHeight: number,
  bgImageEl?: HTMLImageElement | null
) {
  const vWidth = videoEl.videoWidth || targetWidth;
  const vHeight = videoEl.videoHeight || targetHeight;
  const vAspect = vWidth / vHeight;
  const targetAspect = targetWidth / targetHeight;

  ctx.save();
  ctx.clearRect(0, 0, targetWidth, targetHeight);

  // 1. Draw Background based on Fill Mode
  if (settings.fillMode === 'letterbox') {
    ctx.fillStyle = settings.fillColor || '#000000';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (settings.fillMode === 'blur') {
    // Render blurred and scaled background
    ctx.save();
    // Fill with base dark tint
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Blur filter
    const blurPx = settings.blurAmount || 25;
    ctx.filter = `blur(${blurPx}px) brightness(${settings.blurBrightness || 0.7})`;

    // Scale to cover entire target canvas
    let bgW: number, bgH: number;
    if (targetAspect > vAspect) {
      bgW = targetWidth * 1.15;
      bgH = bgW / vAspect;
    } else {
      bgH = targetHeight * 1.15;
      bgW = bgH * vAspect;
    }
    const bgX = (targetWidth - bgW) / 2;
    const bgY = (targetHeight - bgH) / 2;

    try {
      ctx.drawImage(videoEl, bgX, bgY, bgW, bgH);
    } catch {
      // ignore
    }
    ctx.restore();

    // Subtle dark vignette/overlay over blur background
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.restore();
  } else if (settings.fillMode === 'pattern') {
    ctx.fillStyle = settings.fillColor || '#111827';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;

    if (settings.patternType === 'grid') {
      const step = 30;
      for (let x = 0; x < targetWidth; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, targetHeight);
        ctx.stroke();
      }
      for (let y = 0; y < targetHeight; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(targetWidth, y);
        ctx.stroke();
      }
    } else if (settings.patternType === 'diagonal') {
      const step = 20;
      for (let i = -targetHeight; i < targetWidth; i += step) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + targetHeight, targetHeight);
        ctx.stroke();
      }
    } else if (settings.patternType === 'dots') {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      const step = 25;
      for (let x = 12; x < targetWidth; x += step) {
        for (let y = 12; y < targetHeight; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  } else if (settings.fillMode === 'image' && bgImageEl && bgImageEl.complete) {
    ctx.save();
    const imgAspect = bgImageEl.width / bgImageEl.height;
    let iw: number, ih: number;
    if (targetAspect > imgAspect) {
      iw = targetWidth;
      ih = iw / imgAspect;
    } else {
      ih = targetHeight;
      iw = ih * imgAspect;
    }
    ctx.drawImage(bgImageEl, (targetWidth - iw) / 2, (targetHeight - ih) / 2, iw, ih);
    ctx.restore();
  } else {
    // Default dark fill
    ctx.fillStyle = settings.fillColor || '#000000';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // 2. Draw Main Foreground Video with Transformations & Filters
  ctx.save();

  // Apply Color Filter
  let filterStr = `brightness(${settings.brightness || 1}) contrast(${settings.contrast || 1}) saturate(${settings.saturation || 1})`;
  if (settings.filterPreset === 'cinematic') {
    filterStr += ' contrast(1.15) saturate(1.1) sepia(0.08)';
  } else if (settings.filterPreset === 'warm') {
    filterStr += ' sepia(0.2) saturate(1.2)';
  } else if (settings.filterPreset === 'cool') {
    filterStr += ' hue-rotate(15deg) saturate(1.1)';
  } else if (settings.filterPreset === 'vintage') {
    filterStr += ' sepia(0.4) contrast(0.9) brightness(1.05)';
  } else if (settings.filterPreset === 'bw') {
    filterStr += ' grayscale(1) contrast(1.2)';
  } else if (settings.filterPreset === 'vivid') {
    filterStr += ' saturate(1.5) contrast(1.1)';
  }
  ctx.filter = filterStr;

  if (settings.fillMode === 'stretch') {
    // Stretch to fill completely
    ctx.drawImage(videoEl, 0, 0, targetWidth, targetHeight);
  } else if (settings.fillMode === 'smart-crop' || settings.fillMode === 'manual-crop') {
    // Crop & Pan based on focal points
    let cropSrcW = vWidth;
    let cropSrcH = vHeight;

    if (vAspect > targetAspect) {
      // Source is wider than target: crop horizontal sides
      cropSrcW = vHeight * targetAspect;
    } else {
      // Source is taller than target: crop vertical top/bottom
      cropSrcH = vWidth / targetAspect;
    }

    // Focal point offset (0-100%)
    const focalX = (settings.cropXPercent !== undefined ? settings.cropXPercent : 50) / 100;
    const focalY = (settings.cropYPercent !== undefined ? settings.cropYPercent : 50) / 100;

    const maxSrcX = vWidth - cropSrcW;
    const maxSrcY = vHeight - cropSrcH;

    const srcX = Math.max(0, Math.min(maxSrcX, maxSrcX * focalX));
    const srcY = Math.max(0, Math.min(maxSrcY, maxSrcY * focalY));

    // Handle rotation & flip on cropped frame
    applyTransformations(ctx, targetWidth / 2, targetHeight / 2, settings);
    ctx.drawImage(videoEl, srcX, srcY, cropSrcW, cropSrcH, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
  } else {
    // Letterbox / Pillarbox / Blur / Pattern / Image fill: Fit video preserving aspect ratio
    let destW: number, destH: number;
    if (vAspect > targetAspect) {
      // Wider: fit to width, pillarbox top & bottom
      destW = targetWidth;
      destH = destW / vAspect;
    } else {
      // Taller: fit to height, letterbox left & right
      destH = targetHeight;
      destW = destH * vAspect;
    }

    const destX = (targetWidth - destW) / 2;
    const destY = (targetHeight - destH) / 2;

    applyTransformations(ctx, targetWidth / 2, targetHeight / 2, settings);
    ctx.drawImage(videoEl, -destW / 2, -destH / 2, destW, destH);
  }

  ctx.restore();

  // 3. Watermark Overlay
  if (settings.watermarkEnabled && settings.watermarkText) {
    ctx.save();
    ctx.font = `600 ${settings.watermarkFontSize || 20}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = `rgba(255, 255, 255, ${settings.watermarkOpacity || 0.75})`;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    const padding = 28;
    const textMetrics = ctx.measureText(settings.watermarkText);
    const textW = textMetrics.width;
    const textH = settings.watermarkFontSize || 20;

    let wx = padding;
    let wy = padding + textH;

    if (settings.watermarkPosition === 'top-right') {
      wx = targetWidth - textW - padding;
      wy = padding + textH;
    } else if (settings.watermarkPosition === 'bottom-left') {
      wx = padding;
      wy = targetHeight - padding;
    } else if (settings.watermarkPosition === 'bottom-right') {
      wx = targetWidth - textW - padding;
      wy = targetHeight - padding;
    } else if (settings.watermarkPosition === 'center') {
      wx = (targetWidth - textW) / 2;
      wy = (targetHeight + textH) / 2;
    }

    ctx.fillText(settings.watermarkText, wx, wy);
    ctx.restore();
  }

  ctx.restore();
}

function applyTransformations(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  settings: VideoTransformSettings
) {
  ctx.translate(centerX, centerY);

  if (settings.rotation) {
    ctx.rotate((settings.rotation * Math.PI) / 180);
  }
  const scaleX = settings.flipH ? -1 : 1;
  const scaleY = settings.flipV ? -1 : 1;
  if (scaleX !== 1 || scaleY !== 1) {
    ctx.scale(scaleX, scaleY);
  }
}

/**
 * High-speed In-Browser Client Video Conversion Engine using HTML5 Canvas & MediaRecorder
 */
export async function convertVideoInBrowser(
  videoMetadata: VideoMetadata,
  settings: VideoTransformSettings,
  onProgress: (progress: number, message: string) => void,
  signal?: AbortSignal
): Promise<{ blob: Blob; url: string; size: number }> {
  return new Promise(async (resolve, reject) => {
    let isCleanedUp = false;
    let audioCtx: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let recorder: MediaRecorder | null = null;
    let animationFrameId: number | null = null;
    let watchdogTimer: NodeJS.Timeout | null = null;

    try {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = videoMetadata.url;
      video.muted = settings.audioMode === 'mute';
      const playbackSpeed = Math.max(0.25, Math.min(4.0, settings.playbackSpeed || 1.0));
      video.playbackRate = playbackSpeed;

      await new Promise((res, rej) => {
        video.onloadedmetadata = () => res(null);
        video.onerror = () => rej(new Error('Failed to load video for client rendering'));
      });

      const { width: targetW, height: targetH } = computeOutputDimensions(
        settings.customRatioW,
        settings.customRatioH,
        settings.quality,
        videoMetadata.width,
        videoMetadata.height
      );

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
      if (!ctx) throw new Error('Canvas 2D context not available');

      // Preload background image if needed
      let bgImageEl: HTMLImageElement | null = null;
      if (settings.fillMode === 'image' && settings.backgroundImageUrl) {
        bgImageEl = new Image();
        bgImageEl.src = settings.backgroundImageUrl;
        await new Promise((r) => {
          bgImageEl!.onload = () => r(null);
          bgImageEl!.onerror = () => r(null);
        });
      }

      const videoDuration = Math.max(0.1, video.duration || videoMetadata.duration || 1);
      const trimStart = Math.max(0, Math.min(videoDuration - 0.05, settings.trimStartSec || 0));
      const trimEnd = settings.trimEndSec > 0 ? Math.min(videoDuration, settings.trimEndSec) : videoDuration;
      const contentDuration = Math.max(0.1, trimEnd - trimStart);
      const targetWallClockDuration = contentDuration / playbackSpeed;

      video.currentTime = trimStart;
      await new Promise((r) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          r(null);
        };
        video.addEventListener('seeked', onSeeked);
        setTimeout(onSeeked, 300);
      });

      // Prepare Audio track if keeping audio
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const effectiveFps = settings.fps > 0 ? settings.fps : (videoMetadata.fps || 30);
      stream = canvas.captureStream(effectiveFps);

      if (settings.audioMode !== 'mute') {
        try {
          video.muted = false;
          const sourceNode = audioCtx.createMediaElementSource(video);
          const gainNode = audioCtx.createGain();
          gainNode.gain.value = settings.audioGain || 1.0;
          const destNode = audioCtx.createMediaStreamDestination();

          sourceNode.connect(gainNode);
          gainNode.connect(destNode);

          const audioTracks = destNode.stream.getAudioTracks();
          if (audioTracks.length > 0) {
            stream.addTrack(audioTracks[0]);
          }
        } catch (e) {
          console.warn('Audio capture bypassed or already connected', e);
        }
      } else {
        video.muted = true;
      }

      // Check supported mime types
      let mimeType = 'video/webm;codecs=vp9';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')) {
        mimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        mimeType = 'video/webm;codecs=vp9,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      }

      recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: settings.quality === '4K' ? 15000000 : settings.quality === '1080p' ? 6000000 : 2500000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const cleanup = () => {
        if (isCleanedUp) return;
        isCleanedUp = true;
        if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
        if (watchdogTimer !== null) clearTimeout(watchdogTimer);
        video.pause();
        try {
          if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
        } catch {}
        try {
          if (stream) stream.getTracks().forEach((t) => t.stop());
        } catch {}
      };

      recorder.onstop = () => {
        cleanup();
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        resolve({ blob, url, size: blob.size });
      };

      recorder.onerror = (err) => {
        cleanup();
        reject(err);
      };

      const finishRecording = () => {
        if (isCleanedUp) return;
        onProgress(100, 'Finalizing output encoding...');
        video.pause();
        if (recorder && recorder.state !== 'inactive') {
          recorder.stop();
        }
      };

      if (signal) {
        signal.addEventListener('abort', () => {
          cleanup();
          if (recorder && recorder.state !== 'inactive') recorder.stop();
          reject(new Error('Conversion aborted'));
        });
      }

      // Hard safety timer: prevent recording from running beyond expected duration + tiny buffer
      watchdogTimer = setTimeout(() => {
        finishRecording();
      }, (targetWallClockDuration + 0.4) * 1000);

      video.addEventListener('ended', finishRecording);
      video.addEventListener('timeupdate', () => {
        if (video.currentTime >= trimEnd) {
          finishRecording();
        }
      });

      recorder.start(100);
      video.play().catch(() => {});

      const renderLoop = () => {
        if (isCleanedUp) return;

        if (video.ended || video.currentTime >= trimEnd) {
          finishRecording();
          return;
        }

        drawTransformedFrame(ctx, video, settings, targetW, targetH, bgImageEl);

        const currentElapsed = Math.max(0, video.currentTime - trimStart);
        const pct = Math.min(99, Math.round((currentElapsed / contentDuration) * 100));
        onProgress(pct, `Encoding frames (${pct}%)`);

        animationFrameId = requestAnimationFrame(renderLoop);
      };

      animationFrameId = requestAnimationFrame(renderLoop);
    } catch (err) {
      if (audioCtx) {
        try { (audioCtx as AudioContext).close(); } catch {}
      }
      reject(err);
    }
  });
}
