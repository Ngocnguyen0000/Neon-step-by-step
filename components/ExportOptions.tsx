import React, { useState, useEffect, useRef } from 'react';

interface ExportOptionsProps {
  onOptionsChange: (options: ExportOptions) => void;
  isExporting: boolean;
}

export interface ExportOptions {
  speed: number; // frames per second for video, delay in ms for GIF
  size: {
    width: number;
    height: number;
  };
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({ onOptionsChange, isExporting }) => {
  const [speed, setSpeed] = useState(150); // Default 150ms delay for GIF
  const [width, setWidth] = useState(850);
  const [height, setHeight] = useState(850);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewFrame, setPreviewFrame] = useState(0);
  const previewRef = useRef<number>();

  // Preview animation để hiển thị tốc độ
  useEffect(() => {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frameIndex = 0;
    
    const animate = () => {
      setPreviewFrame(frameIndex);
      frameIndex = (frameIndex + 1) % frames.length;
      previewRef.current = setTimeout(animate, speed);
    };
    
    animate();

    return () => {
      if (previewRef.current) {
        clearTimeout(previewRef.current);
      }
    };
  }, [speed]);

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    onOptionsChange({ speed: newSpeed, size: { width, height } });
  };

  const handleSizeChange = (newWidth: number, newHeight: number) => {
    setWidth(newWidth);
    setHeight(newHeight);
    onOptionsChange({ speed, size: { width: newWidth, height: newHeight } });
  };

  const presetSizes = [
    { name: 'Small', width: 400, height: 400 },
    { name: 'Medium', width: 850, height: 850 },
    { name: 'Large', width: 1200, height: 1200 },
    { name: 'HD', width: 1920, height: 1080 },
    { name: '4K', width: 3840, height: 2160 },
  ];

  const speedPresets = [
    { name: 'Slow', value: 300 },
    { name: 'Normal', value: 150 },
    { name: 'Fast', value: 100 },
    { name: 'Very Fast', value: 50 },
  ];

  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  return (
    <div className="w-full max-w-md mx-auto mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Export Options</h3>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          {showAdvanced ? 'Hide' : 'Advanced'}
        </button>
      </div>

      {/* Speed Control */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Animation Speed
          </label>
          {/* Speed Preview */}
          <div className="flex items-center space-x-2">
            <span className="text-lg font-mono">{frames[previewFrame]}</span>
            <span className="text-xs text-gray-500">Preview</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {speedPresets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleSpeedChange(preset.value)}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                speed === preset.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              disabled={isExporting}
            >
              {preset.name}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="25"
            max="500"
            step="25"
            value={speed}
            onChange={(e) => handleSpeedChange(Number(e.target.value))}
            className="flex-1"
            disabled={isExporting}
          />
          <span className="text-sm text-gray-600 min-w-[60px] font-mono">
            {speed}ms
          </span>
        </div>
      </div>

      {/* Size Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Export Size
        </label>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {presetSizes.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleSizeChange(preset.width, preset.height)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                width === preset.width && height === preset.height
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              disabled={isExporting}
            >
              {preset.name}
            </button>
          ))}
        </div>
        
        {showAdvanced && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Width</label>
              <input
                type="number"
                min="100"
                max="4000"
                step="50"
                value={width}
                onChange={(e) => handleSizeChange(Number(e.target.value), height)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                disabled={isExporting}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Height</label>
              <input
                type="number"
                min="100"
                max="4000"
                step="50"
                value={height}
                onChange={(e) => handleSizeChange(width, Number(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                disabled={isExporting}
              />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500">
        <p>• Speed: Lower values = faster animation</p>
        <p>• Size: Larger sizes = higher quality but bigger files</p>
        <p>• Preview shows real-time speed on the drawing above</p>
      </div>
    </div>
  );
};
