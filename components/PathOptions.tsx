import React from 'react';

export interface PathOptionsState {
  mergeEnabled: boolean;
  maxSteps: number;
}

interface PathOptionsProps {
  value: PathOptionsState;
  onChange: (next: PathOptionsState) => void;
  disabled?: boolean;
  totalOriginalPaths: number;
}

export const PathOptions: React.FC<PathOptionsProps> = ({ value, onChange, disabled, totalOriginalPaths }) => {
  const clampedMax = Math.min(Math.max(value.maxSteps, 1), 20);

  return (
    <div className="w-full max-w-md mx-auto mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Path Options</h3>
        <span className="text-xs text-gray-500">Original: {totalOriginalPaths}</span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-700">Merge small paths to limit steps</label>
        <button
          type="button"
          onClick={() => onChange({ ...value, mergeEnabled: !value.mergeEnabled })}
          disabled={disabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value.mergeEnabled ? 'bg-blue-600' : 'bg-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-pressed={value.mergeEnabled}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value.mergeEnabled ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>

      <div className={`mt-2 ${value.mergeEnabled ? 'opacity-100' : 'opacity-60'}`}>
        <label className="block text-sm font-medium text-gray-700 mb-1">Maximum steps (≤ 20)</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={clampedMax}
            onChange={(e) => onChange({ ...value, maxSteps: Math.min(20, Math.max(1, Number(e.target.value))) })}
            className="flex-1"
            disabled={disabled || !value.mergeEnabled}
          />
          <input
            type="number"
            min={1}
            max={20}
            step={1}
            value={clampedMax}
            onChange={(e) => onChange({ ...value, maxSteps: Math.min(20, Math.max(1, Number(e.target.value))) })}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md"
            disabled={disabled || !value.mergeEnabled}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">If the number of paths exceeds this limit, the smallest paths will be merged together.</p>
      </div>
    </div>
  );
};


