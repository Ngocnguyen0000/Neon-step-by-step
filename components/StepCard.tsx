
import React, { useState } from 'react';
import { renderSvgToUrl, downloadUrl } from '../utils/imageUtils';

interface StepCardProps {
  stepNumber: number;
  viewBox: string;
  paths: string[];
  slug: string;
}

export const StepCard: React.FC<StepCardProps> = ({ stepNumber, viewBox, paths, slug }) => {
  const [isDownloading, setIsDownloading] = useState<false | 'png' | 'webp'>(false);
  const svgContent = paths.join('');

  const handleDownload = async (format: 'png' | 'webp') => {
    if (isDownloading) return;
    setIsDownloading(format);
    try {
      const svgString = `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
      const url = await renderSvgToUrl(svgString, format, 512, 512);
      const stepNumberPadded = stepNumber.toString().padStart(3, '0');
      downloadUrl(url, `${slug}-step-${stepNumberPadded}.${format}`);
    } catch (err) {
      console.error("Failed to download step:", err);
      // In a real app, we might want to show a user-facing error message here
    } finally {
      setIsDownloading(false);
    }
  };

  const buttonClass = "px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-wait";

  return (
    <div className="border border-gray-200 rounded-lg p-2 shadow-sm flex flex-col bg-white">
      <div className="w-full aspect-square bg-gray-50 rounded-md overflow-hidden">
        <svg
          viewBox={viewBox}
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
      <p className="mt-2 text-sm font-medium text-gray-600 text-center">Step {stepNumber}</p>
      <div className="mt-2 flex items-center justify-center gap-2">
        <button
          onClick={() => handleDownload('png')}
          disabled={!!isDownloading}
          className={buttonClass}
          aria-label={`Download step ${stepNumber} as PNG`}
        >
          {isDownloading === 'png' ? '...' : 'PNG'}
        </button>
        <button
          onClick={() => handleDownload('webp')}
          disabled={!!isDownloading}
          className={buttonClass}
          aria-label={`Download step ${stepNumber} as WebP`}
        >
          {isDownloading === 'webp' ? '...' : 'WebP'}
        </button>
      </div>
    </div>
  );
};
