
import React, { useState, useCallback } from 'react';
import { MagicWandIcon, UploadIcon } from './icons';

interface PromptFormProps {
  onGenerate: (prompt: string) => void;
  onFileUpload: (svgContent: string, fileName: string) => void;
  onVectorizeUpload: (file: File) => void;
  isLoading: boolean;
}

export const PromptForm: React.FC<PromptFormProps> = ({ onGenerate, onFileUpload, onVectorizeUpload, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt) {
      onGenerate(prompt);
      setFileName('');
    }
  };

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      setFileName(file.name);
      setPrompt('');

      if (file.type === "image/svg+xml") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          onFileUpload(content, file.name);
        };
        reader.readAsText(file);
      } else if (file.type === "image/png" || file.type === "image/jpeg") {
        onVectorizeUpload(file);
      } else {
        alert("Please upload a valid .svg, .png, or .jpeg file.");
        setFileName('');
      }
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, [handleFileChange]);

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A cute smiling coffee mug"
          className="flex-grow w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !prompt}
          className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 disabled:cursor-not-allowed transition duration-200"
        >
          <MagicWandIcon className="h-5 w-5 mr-2" />
          {isLoading ? 'Processing...' : 'Generate'}
        </button>
      </form>

      <div className="flex items-center my-4">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-gray-500 text-sm">OR</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      
      <div 
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <UploadIcon className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
            {fileName ? (
                <>Selected: <span className="font-semibold">{fileName}</span></>
            ) : (
                <>
                <span className="font-semibold text-indigo-600">Upload a file</span> or drag and drop
                </>
            )}
        </p>
        <p className="text-xs text-gray-500">SVG, PNG, or JPEG</p>
        <input
          id="file-upload"
          type="file"
          accept=".svg,image/svg+xml,.png,image/png,.jpeg,.jpg,image/jpeg"
          onChange={(e) => handleFileChange(e.target.files)}
          className="hidden"
          disabled={isLoading}
        />
      </div>

    </div>
  );
};