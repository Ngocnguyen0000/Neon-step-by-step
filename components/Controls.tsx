import React, { useState } from 'react';
import { PlayIcon, PauseIcon, ReplayIcon, DownloadIcon } from './icons';

type DownloadFormat = 'svg' | 'png' | 'webp' | 'mp4' | 'step-png' | 'step-webp' | 'single-step-png' | 'single-step-webp' | 'gif' | 'zip-png' | 'zip-webp' | 'final-svg' | 'final-png' | 'final-webp' | 'final-zip';

interface ControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  isExporting: boolean;
  onStepChange: (step: number) => void;
  onPlayPause: () => void;
  onReset: () => void;
  onDownload: (format: DownloadFormat) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  isExporting,
  onStepChange,
  onPlayPause,
  onReset,
  onDownload,
}) => {

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleDownloadClick = (format: DownloadFormat) => {
    onDownload(format);
    setIsMenuOpen(false);
  }

  const stepDownloadClass = "block w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const menuItemClass = "block w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer";


  return (
    <div className="w-full max-w-lg mt-4 p-4 bg-gray-100 rounded-lg space-y-3">
      <div className="flex items-center gap-4">
        <button
          onClick={onPlayPause}
          className="p-2 rounded-full text-gray-700 hover:bg-gray-200 transition"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
        </button>
        <button
          onClick={onReset}
          className="p-2 rounded-full text-gray-700 hover:bg-gray-200 transition"
          aria-label="Replay"
        >
          <ReplayIcon className="w-6 h-6" />
        </button>
        <input
          type="range"
          min="0"
          max={totalSteps}
          value={currentStep}
          onChange={(e) => onStepChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <span className="text-sm font-mono text-gray-600 w-20 text-center">
          {currentStep} / {totalSteps}
        </span>
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            disabled={isExporting}
            className="flex items-center justify-center p-2 bg-indigo-600 text-white font-semibold rounded-full shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 transition"
            aria-label="Download options"
          >
            {isExporting ? (
              <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <DownloadIcon className="w-6 h-6" />
            )}
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 bottom-full mb-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-20">
              <ul className="py-1 text-sm text-gray-700">
                <li className="px-4 pt-2 pb-1 font-bold text-xs uppercase text-gray-500">Final Drawing</li>
                <li><button onClick={() => handleDownloadClick('final-svg')} className={menuItemClass}>Download Final SVG</button></li>
                <li><button onClick={() => handleDownloadClick('final-png')} className={menuItemClass}>Download Final PNG</button></li>
                <li><button onClick={() => handleDownloadClick('final-webp')} className={menuItemClass}>Download Final WebP</button></li>
                <li><button onClick={() => handleDownloadClick('final-zip')} className={menuItemClass}>Download Final (PNG+SVG) .zip</button></li>
                
                <li className="border-t my-1 border-gray-200"></li>
                <li className="px-4 pt-2 pb-1 font-bold text-xs uppercase text-gray-500">Current Step ({currentStep}/{totalSteps})</li>
                <li><button onClick={() => handleDownloadClick('step-png')} className={stepDownloadClass} disabled={currentStep === 0}>Download Cumulative Step as PNG</button></li>
                <li><button onClick={() => handleDownloadClick('step-webp')} className={stepDownloadClass} disabled={currentStep === 0}>Download Cumulative Step as WebP</button></li>
                <li><button onClick={() => handleDownloadClick('single-step-png')} className={stepDownloadClass} disabled={currentStep === 0}>Download Single Path as PNG</button></li>
                <li><button onClick={() => handleDownloadClick('single-step-webp')} className={stepDownloadClass} disabled={currentStep === 0}>Download Single Path as WebP</button></li>

                <li className="border-t my-1 border-gray-200"></li>
                <li className="px-4 pt-2 pb-1 font-bold text-xs uppercase text-gray-500">Animation</li>
                <li><button onClick={() => handleDownloadClick('mp4')} className={menuItemClass}>Export Video (.webm)</button></li>
                <li><button onClick={() => handleDownloadClick('gif')} className={menuItemClass}>Export GIF</button></li>
                
                <li className="border-t my-1 border-gray-200"></li>
                <li className="px-4 pt-2 pb-1 font-bold text-xs uppercase text-gray-500">Bulk Export (Single Path)</li>
                <li><button onClick={() => handleDownloadClick('zip-png')} className={menuItemClass}>All Single Paths as PNG (.zip)</button></li>
                <li><button onClick={() => handleDownloadClick('zip-webp')} className={menuItemClass}>All Single Paths as WebP (.zip)</button></li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
