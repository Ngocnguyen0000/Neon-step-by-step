import React, { useRef } from 'react';

export interface FinalFrameState {
	overrideDataUrl: string | null;
	holdMs: number;
}

interface FinalFrameOptionsProps {
	value: FinalFrameState;
	onChange: (next: FinalFrameState) => void;
	isExporting: boolean;
}

export const FinalFrameOptions: React.FC<FinalFrameOptionsProps> = ({ value, onChange, isExporting }) => {
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const handlePickFile = () => fileInputRef.current?.click();

	const handleFile = async (file: File) => {
		const reader = new FileReader();
		reader.onload = () => {
			onChange({ ...value, overrideDataUrl: String(reader.result || '') });
		};
		reader.readAsDataURL(file);
	};

	return (
		<div className="w-full max-w-md mx-auto mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-lg font-semibold text-gray-800">Final Frame</h3>
				<button
					type="button"
					onClick={() => onChange({ ...value, overrideDataUrl: null })}
					disabled={isExporting || !value.overrideDataUrl}
					className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-300"
				>
					Clear
				</button>
			</div>

			<div className="mb-3">
				<label className="block text-sm font-medium text-gray-700 mb-1">Custom image (optional)</label>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handlePickFile}
						disabled={isExporting}
						className="px-3 py-2 text-sm rounded-md bg-white border border-gray-300 hover:bg-gray-50"
					>
						Upload SVG/PNG/JPEG/WebP
					</button>
					<input
						ref={fileInputRef}
						type="file"
						accept=".svg,.png,.jpg,.jpeg,.webp,image/*"
						className="hidden"
						onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) handleFile(f);
						}}
					/>
				</div>
				{value.overrideDataUrl && (
					<div className="mt-2">
						<div className="text-xs text-gray-500 mb-1">Preview</div>
						<div className="w-full aspect-video bg-white border rounded overflow-hidden flex items-center justify-center">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={value.overrideDataUrl} alt="final preview" className="max-w-full max-h-full object-contain" />
						</div>
					</div>
				)}
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">Hold duration (ms)</label>
				<div className="flex items-center gap-2">
					<input
						type="range"
						min={250}
						max={5000}
						step={250}
						value={value.holdMs}
						onChange={(e) => onChange({ ...value, holdMs: Number(e.target.value) })}
						className="flex-1"
						disabled={isExporting}
					/>
					<span className="text-xs font-mono text-gray-600 w-16 text-right">{value.holdMs}ms</span>
				</div>
			</div>
		</div>
	);
};
