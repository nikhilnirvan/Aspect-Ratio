export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 10);
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours.toString().padStart(2, '0')}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis}`;
}

export function formatDurationSimple(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function calculateAspectRatioString(width: number, height: number): string {
  if (!width || !height) return '16:9';
  const divisor = gcd(Math.round(width), Math.round(height));
  const w = Math.round(width / divisor);
  const h = Math.round(height / divisor);

  // Check for common approximate ratios
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.02) return '16:9';
  if (Math.abs(ratio - 9 / 16) < 0.02) return '9:16';
  if (Math.abs(ratio - 1) < 0.02) return '1:1';
  if (Math.abs(ratio - 4 / 3) < 0.02) return '4:3';
  if (Math.abs(ratio - 3 / 4) < 0.02) return '3:4';
  if (Math.abs(ratio - 21 / 9) < 0.03 || Math.abs(ratio - 2.35) < 0.04) return '21:9';
  if (Math.abs(ratio - 4 / 5) < 0.02) return '4:5';

  if (w > 50 || h > 50) {
    return `${ratio.toFixed(2)}:1`;
  }
  return `${w}:${h}`;
}

export function computeOutputDimensions(
  targetRatioW: number,
  targetRatioH: number,
  quality: string,
  sourceWidth: number,
  sourceHeight: number
): { width: number; height: number } {
  const targetRatio = targetRatioW / targetRatioH;

  let baseHeight = 1080;
  if (quality === '360p') baseHeight = 360;
  else if (quality === '720p') baseHeight = 720;
  else if (quality === '1080p') baseHeight = 1080;
  else if (quality === '1440p') baseHeight = 1440;
  else if (quality === '4K') baseHeight = 2160;
  else if (quality === 'original') {
    baseHeight = sourceHeight || 1080;
  }

  let width: number;
  let height: number;

  if (targetRatio >= 1) {
    // Landscape or square: use height as reference base
    height = baseHeight;
    width = Math.round(height * targetRatio);
  } else {
    // Portrait: use width or height appropriately
    // For 9:16 at 1080p, standard resolution is 1080x1920
    if (quality === '1080p') {
      width = 1080;
      height = Math.round(width / targetRatio);
    } else if (quality === '720p') {
      width = 720;
      height = Math.round(width / targetRatio);
    } else if (quality === '360p') {
      width = 360;
      height = Math.round(width / targetRatio);
    } else if (quality === '1440p') {
      width = 1440;
      height = Math.round(width / targetRatio);
    } else if (quality === '4K') {
      width = 2160;
      height = Math.round(width / targetRatio);
    } else {
      height = baseHeight;
      width = Math.round(height * targetRatio);
    }
  }

  // Ensure dimensions are even numbers for video codecs (H.264 requires even dimensions)
  if (width % 2 !== 0) width += 1;
  if (height % 2 !== 0) height += 1;

  return { width, height };
}
