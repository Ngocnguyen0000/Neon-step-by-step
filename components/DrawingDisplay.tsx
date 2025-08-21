
import React, { useEffect, useRef, useState } from 'react';
import type { DrawingData } from '../types';
import type { ExportOptions } from './ExportOptions';

interface DrawingDisplayProps {
  data: DrawingData;
  currentStep: number;
  exportOptions: ExportOptions;
  isPlaying: boolean;
}

export const DrawingDisplay: React.FC<DrawingDisplayProps> = ({ 
  data, 
  currentStep, 
  exportOptions,
  isPlaying 
}) => {
  const { viewBox, paths } = data;

  const [previewStep, setPreviewStep] = useState(1);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset preview step when paths change
    setPreviewStep(1);
  }, [paths.length]);

  useEffect(() => {
    if (!isPlaying || paths.length === 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const tick = () => {
      setPreviewStep((prev) => (prev >= paths.length ? 1 : prev + 1));
      timerRef.current = window.setTimeout(tick, exportOptions.speed);
    };

    // Start animation loop
    timerRef.current = window.setTimeout(tick, exportOptions.speed);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, paths.length, exportOptions.speed]);

  const nonPlayingStep = Math.max(0, Math.min(currentStep, paths.length));
  const contentHtml = isPlaying
    ? paths.slice(0, Math.min(previewStep, paths.length)).join('')
    : paths.slice(0, nonPlayingStep).join('');

  return (
    <div className="w-full aspect-square max-w-lg bg-gray-100 border border-gray-200 rounded-lg shadow-inner overflow-hidden relative">
      {/* Speed indicator */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-mono">
        {exportOptions.speed}ms
      </div>
      
      {/* Step indicator */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
        {isPlaying ? `Step ${previewStep}/${paths.length}` : `Step ${nonPlayingStep}/${paths.length}`}
      </div>

      <svg
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </div>
  );
};
