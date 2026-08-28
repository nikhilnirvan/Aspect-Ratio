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

export async function downloadMedia(
  urlOrBlob: string | Blob,
  filename: string,
  container: string = 'mp4'
): Promise<void> {
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
    } else if (typeof urlOrBlob === 'string') {
      if (urlOrBlob.startsWith('blob:') || urlOrBlob.startsWith('data:')) {
        downloadUrl = urlOrBlob;
      } else {
        // Fetch server URL as Blob so the browser forces a file download dialog rather than playing in-tab
        try {
          const res = await fetch(urlOrBlob);
          if (res.ok) {
            const blob = await res.blob();
            downloadUrl = URL.createObjectURL(blob);
            shouldRevoke = true;
          } else {
            downloadUrl = urlOrBlob;
          }
        } catch {
          downloadUrl = urlOrBlob;
        }
      }
    } else {
      downloadUrl = String(urlOrBlob);
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
    }, 2500);
  } catch (err) {
    console.error('Download helper error:', err);
    // Fallback: if URL string, attempt direct navigation
    if (typeof urlOrBlob === 'string') {
      const a = document.createElement('a');
      a.href = urlOrBlob;
      a.target = '_blank';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try { document.body.removeChild(a); } catch {}
      }, 1000);
    }
  }
}
