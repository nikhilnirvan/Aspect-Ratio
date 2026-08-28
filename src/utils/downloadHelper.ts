export function sanitizeFilename(filename: string, fallback = 'converted_video.mp4'): string {
  if (!filename) return fallback;
  // Replace colons, slashes, and illegal filename characters with hyphens/underscores
  let clean = filename.replace(/[:*?"<>|/\\]/g, '-');
  // Remove multiple hyphens
  clean = clean.replace(/-+/g, '-');
  // Trim spaces and periods
  clean = clean.trim().replace(/^\.+/, '');
  return clean || fallback;
}

export function downloadMedia(
  urlOrBlob: string | Blob,
  filename: string,
  container: string = 'mp4'
): void {
  try {
    let cleanName = sanitizeFilename(filename);
    
    // Ensure proper extension
    const validExts = ['.mp4', '.webm', '.mov', '.mkv', '.zip'];
    const hasValidExt = validExts.some((ext) => cleanName.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      cleanName = `${cleanName}.${container.toLowerCase().replace(/^\./, '')}`;
    }

    let downloadUrl: string;
    let shouldRevoke = false;

    if (urlOrBlob instanceof Blob) {
      downloadUrl = URL.createObjectURL(urlOrBlob);
      shouldRevoke = true;
    } else {
      downloadUrl = urlOrBlob;
    }

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = downloadUrl;
    a.download = cleanName;
    a.setAttribute('download', cleanName);
    a.rel = 'noopener noreferrer';

    // Must be in DOM for reliable iframe/browser download trigger
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      try {
        document.body.removeChild(a);
        if (shouldRevoke) {
          URL.revokeObjectURL(downloadUrl);
        }
      } catch {}
    }, 1500);
  } catch (err) {
    console.error('Download helper error:', err);
    // Fallback: if URL string, attempt direct navigation/window open
    if (typeof urlOrBlob === 'string') {
      window.open(urlOrBlob, '_blank');
    }
  }
}
