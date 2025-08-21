import { Canvg } from 'canvg';

/**
 * Renders an SVG string to a data URL for a given image format.
 * @param svgString The SVG content to render.
 * @param imageFormat The desired output format ('png' or 'webp').
 * @param width The width of the output image.
 * @param height The height of the output image.
 * @returns A promise that resolves with the data URL of the rendered image.
 */
export const renderSvgToUrl = async (svgString: string, imageFormat: 'png' | 'webp', width: number, height: number): Promise<string> => {
  // Output canvas (transparent)
  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error("Could not get canvas context");

  // Offscreen canvas to render SVG (may be transparent)
  const svgCanvas = document.createElement('canvas');
  svgCanvas.width = width;
  svgCanvas.height = height;
  const svgCtx = svgCanvas.getContext('2d');
  if (!svgCtx) throw new Error("Could not get offscreen canvas context");

  // Render any SVG content (not just when <path> exists) so <image>, <g>, etc. are supported
    const v = await Canvg.from(svgCtx, svgString, { ignoreDimensions: true });
    v.resize(width, height, 'xMidYMid meet');
    await v.render();

  // Simply draw rendered SVG onto transparent canvas
  outCtx.drawImage(svgCanvas, 0, 0, width, height);

  // Feature-detect WebP support and gracefully fall back
  let targetMime = `image/${imageFormat}`;
  if (imageFormat === 'webp') {
    const test = document.createElement('canvas').toDataURL('image/webp');
    const webpSupported = typeof test === 'string' && test.startsWith('data:image/webp');
    if (!webpSupported) targetMime = 'image/png';
  }
  return outCanvas.toDataURL(targetMime);
};

/**
 * Triggers a browser download for a given URL or data URI.
 * @param href The URL or data URI of the file to download.
 * @param filename The desired name for the downloaded file.
 */
export const downloadUrl = (href: string, filename: string) => {
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Converts a data URL to a Blob object using the fetch API.
 * @param dataUrl The data URL to convert.
 * @returns A promise that resolves with the Blob.
 */
export const dataURLtoBlob = async (dataUrl: string): Promise<Blob> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return blob;
};

/**
 * Returns a same-origin Blob URL for gif.js worker to avoid cross-origin Worker restrictions.
 * Caches the URL on window to reuse across calls.
 */
export const getGifWorkerScriptUrl = async (): Promise<string> => {
  const w = window as any;
  if (w.__gifWorkerBlobUrl) return w.__gifWorkerBlobUrl as string;
  const cdnUrl = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js';
  const resp = await fetch(cdnUrl);
  if (!resp.ok) throw new Error('Failed to fetch GIF worker script');
  const code = await resp.text();
  const blob = new Blob([code], { type: 'application/javascript' });
  const blobUrl = URL.createObjectURL(blob);
  w.__gifWorkerBlobUrl = blobUrl;
  return blobUrl;
};
