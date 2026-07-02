/**
 * Client-side image downscaling + JPEG compression for progress photos. Large
 * camera images are shrunk to a sane dimension and re-encoded before they ever
 * touch storage, keeping the base64 payload small.
 */

export interface CompressOpts {
  /** Longest-edge cap in pixels. */
  maxDim?: number;
  /** JPEG quality 0–1. */
  quality?: number;
}

const DEFAULTS = { maxDim: 720, quality: 0.7 } as const;

/** Scale (w, h) to fit within a square of `maxDim`, never upscaling. Pure. */
export function scaleToFit(
  w: number,
  h: number,
  maxDim: number,
): { width: number; height: number } {
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return { width: 0, height: 0 };
  }
  const longest = Math.max(w, h);
  const ratio = longest > maxDim ? maxDim / longest : 1;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode the image.'));
    img.src = src;
  });
}

/**
 * Reads an image file and returns a downscaled JPEG data URL. Falls back to the
 * original data URL if the canvas isn't available. Rejects only if the file
 * can't be read or decoded at all.
 */
export async function compressImageFile(file: Blob, opts: CompressOpts = {}): Promise<string> {
  const maxDim = opts.maxDim ?? DEFAULTS.maxDim;
  const quality = opts.quality ?? DEFAULTS.quality;

  const original = await readAsDataUrl(file);
  const img = await loadImage(original);
  const { width, height } = scaleToFit(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    maxDim,
  );
  if (width === 0 || height === 0) return original;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return original;
  ctx.drawImage(img, 0, 0, width, height);

  try {
    const out = canvas.toDataURL('image/jpeg', quality);
    // Some environments return an empty/invalid URL — keep the original then.
    return out.startsWith('data:image/jpeg') ? out : original;
  } catch {
    return original;
  }
}
