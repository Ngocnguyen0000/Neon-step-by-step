
import React, { useState, useCallback, useEffect } from 'react';
import { Canvg } from 'canvg';
import { PromptForm } from './components/PromptForm';
import { DrawingDisplay } from './components/DrawingDisplay';
import { Controls } from './components/Controls';
import { Loader } from './components/Loader';
import { generateDrawingSgv } from './services/geminiService';
import type { DrawingData } from './types';
import { Header } from './components/Header';
import { WelcomeSplash } from './components/WelcomeSplash';
import { parseSvg, mergePathsToMaxSteps } from './utils/svgUtils';
import { PathOptions, type PathOptionsState } from './components/PathOptions';
import { StepGrid } from './components/StepGrid';
import { ExportOptions, type ExportOptions as ExportOptionsType } from './components/ExportOptions';
import { FinalFrameOptions, type FinalFrameState } from './components/FinalFrameOptions';
import { renderSvgToUrl, downloadUrl, dataURLtoBlob, getGifWorkerScriptUrl } from './utils/imageUtils';

declare const GIF: any;
declare const JSZip: any;
declare const Potrace: any;

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [drawingData, setDrawingData] = useState<DrawingData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptionsType>({
    speed: 150,
    size: { width: 850, height: 850 }
  });
  const [finalFrame, setFinalFrame] = useState<FinalFrameState>({
    overrideDataUrl: null,
    holdMs: 1000,
  });
  const [pathOptions, setPathOptions] = useState<PathOptionsState>({ mergeEnabled: false, maxSteps: 20 });
  const [sourcePaths, setSourcePaths] = useState<string[] | null>(null);

  const forcePathColor = useCallback((pathStr: string, color: string): string => {
    let result = pathStr;
    result = result.replace(/\s(stroke|fill)\s*=\s*"[^"]*"/gi, '');
    result = result.replace(/style\s*=\s*"([^"]*)"/gi, (m, style) => {
      const cleaned = style
        .replace(/stroke\s*:\s*[^;\"]+;?/gi, '')
        .replace(/fill\s*:\s*[^;\"]+;?/gi, '')
        .replace(/;;+/g, ';')
        .replace(/^;|;$/g, '');
      return cleaned.trim().length > 0 ? `style="${cleaned}"` : '';
    });
    result = result.replace(/\s*\/>?\s*$/i, (match) => ` fill="${color}" stroke="${color}"${match}`);
    return result;
  }, []);

  const handleProcessSvg = useCallback((svgString: string, sourceName: string) => {
    setIsLoading(true);
    setError(null);
    setDrawingData(null);
    setCurrentStep(0);
    setIsPlaying(false);
    setPrompt(sourceName);

    try {
        const { viewBox, paths } = parseSvg(svgString);
        setSourcePaths(paths);
        const appliedPaths = pathOptions.mergeEnabled ? mergePathsToMaxSteps(paths, pathOptions.maxSteps) : paths;
        setDrawingData({
            fullSvg: svgString,
            viewBox,
            paths: appliedPaths,
        });
        setCurrentStep(1);
    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred while processing the SVG.');
    } finally {
        setIsLoading(false);
    }
  }, [pathOptions.mergeEnabled, pathOptions.maxSteps]);

  const handleGenerate = useCallback(async (userPrompt: string) => {
    if (!userPrompt) {
      setError('Please enter a description for the drawing.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setDrawingData(null);
    setCurrentStep(0);
    setIsPlaying(false);

    try {
      const svgString = await generateDrawingSgv(userPrompt);
      if (!svgString) {
        throw new Error('The AI could not generate a drawing for this prompt.');
      }
      handleProcessSvg(svgString, userPrompt);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setIsLoading(false);
    }
  }, [handleProcessSvg]);

  const handleFileUpload = useCallback((svgContent: string, fileName: string) => {
    handleProcessSvg(svgContent, fileName);
  }, [handleProcessSvg]);

  const handleVectorizeUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setDrawingData(null);
    setCurrentStep(0);
    setIsPlaying(false);

    try {
      const imageUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });

      const potrace = new Potrace();
      potrace.setParameters({ threshold: 128, turdsize: 2 });

      const svgString = await new Promise<string>((resolve, reject) => {
        potrace.loadImage(imageUrl, (err: Error | null) => {
          if (err) return reject(err);
          const svg = potrace.getSVG();
          resolve(svg);
        });
      });

      handleProcessSvg(svgString, file.name);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to vectorize the image. Please try a simpler image with higher contrast.');
      setIsLoading(false);
    }

  }, [handleProcessSvg]);
  
  const totalSteps = drawingData?.paths.length ?? 0;

  // Re-apply merging when toggle or limits change
  useEffect(() => {
    if (!drawingData || !sourcePaths) return;
    const nextPaths = pathOptions.mergeEnabled ? mergePathsToMaxSteps(sourcePaths, pathOptions.maxSteps) : [...sourcePaths];
    setDrawingData(prev => prev ? { ...prev, paths: nextPaths } : prev);
    setCurrentStep(1);
  }, [pathOptions.mergeEnabled, pathOptions.maxSteps, sourcePaths]);

  useEffect(() => {
    let timer: number;
    if (isPlaying && currentStep <= totalSteps) {
      timer = window.setTimeout(() => { setCurrentStep(prev => prev + 1); }, 150);
    } else if (isPlaying && currentStep > totalSteps) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, totalSteps]);

  const slug = prompt.toLowerCase().replace(/\.(svg|png|jpeg|jpg)$/, '').replace(/[^a-z0-9]+/g, '-').slice(0, 30) || 'drawing';

  const buildFinalSvgContent = useCallback((): string => {
    if (!drawingData) return '';
    if (finalFrame.overrideDataUrl) {
      // If custom image provided, embed it (fit into viewBox using preserveAspectRatio)
      return `<svg viewBox="${drawingData.viewBox}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><image href="${finalFrame.overrideDataUrl}" xlink:href="${finalFrame.overrideDataUrl}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" /></svg>`;
    }
    // Default: all original paths
    const all = drawingData.paths.join('');
    return `<svg viewBox="${drawingData.viewBox}" xmlns="http://www.w3.org/2000/svg">${all}</svg>`;
  }, [drawingData, finalFrame.overrideDataUrl]);

  const handleDownload = useCallback(async (format: 'svg' | 'png' | 'webp' | 'mp4' | 'step-png' | 'step-webp' | 'single-step-png' | 'single-step-webp' | 'gif' | 'zip-png' | 'zip-webp' | 'final-svg' | 'final-png' | 'final-webp' | 'final-zip') => {
    if (!drawingData) return;
    
    setIsExporting(true);
    setError(null);

    try {
        if (format === 'svg') {
            const blob = new Blob([drawingData.fullSvg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            downloadUrl(url, `${slug}.svg`);
            URL.revokeObjectURL(url);
        } else if (format === 'png' || format === 'webp') {
            const url = await renderSvgToUrl(drawingData.fullSvg, format, exportOptions.size.width, exportOptions.size.height);
            const actualExt = url.startsWith('data:image/png') ? 'png' : (format as 'png' | 'webp');
            downloadUrl(url, `${slug}.${actualExt}`);
        } else if (format === 'final-svg') {
            const finalSvg = buildFinalSvgContent();
            const blob = new Blob([finalSvg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            downloadUrl(url, `${slug}-final.svg`);
            URL.revokeObjectURL(url);
        } else if (format === 'final-png') {
            const finalSvg = buildFinalSvgContent();
            const url = await renderSvgToUrl(finalSvg, 'png', exportOptions.size.width, exportOptions.size.height);
            downloadUrl(url, `${slug}-final.png`);
        } else if (format === 'final-webp') {
            const finalSvg = buildFinalSvgContent();
            const url = await renderSvgToUrl(finalSvg, 'webp', exportOptions.size.width, exportOptions.size.height);
            const actualExt = url.startsWith('data:image/png') ? 'png' : 'webp';
            downloadUrl(url, `${slug}-final.${actualExt}`);
        } else if (format === 'step-png' || format === 'step-webp') {
            const imageFormat = format.split('-')[1] as 'png' | 'webp';
            const stepIndex = Math.max(0, Math.min(currentStep, drawingData.paths.length));
            const cumulative = drawingData.paths.slice(0, stepIndex).join('');
            const svgToRender = `<svg viewBox="${drawingData.viewBox}" xmlns="http://www.w3.org/2000/svg">${cumulative}</svg>`;
            const url = await renderSvgToUrl(svgToRender, imageFormat, exportOptions.size.width, exportOptions.size.height);
            const actualExt = url.startsWith('data:image/png') ? 'png' : imageFormat;
            downloadUrl(url, `${slug}-step-${stepIndex}.${actualExt}`);
        } else if (format === 'single-step-png' || format === 'single-step-webp') {
            const imageFormat = format.split('-').slice(-1)[0] as 'png' | 'webp';
            const stepIndex = Math.max(0, Math.min(currentStep, drawingData.paths.length));
            const singlePath = stepIndex > 0 ? drawingData.paths[stepIndex - 1] : '';
            const svgToRender = `<svg viewBox="${drawingData.viewBox}" xmlns="http://www.w3.org/2000/svg">${singlePath}</svg>`;
            const url = await renderSvgToUrl(svgToRender, imageFormat, exportOptions.size.width, exportOptions.size.height);
            const actualExt = url.startsWith('data:image/png') ? 'png' : imageFormat;
            downloadUrl(url, `${slug}-single-step-${stepIndex}.${actualExt}`);
        } else if (format === 'mp4') {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");
            
            const tempV = await Canvg.from(ctx, drawingData.fullSvg);
            canvas.width = exportOptions.size.width;
            canvas.height = exportOptions.size.height;

            const stream = canvas.captureStream(30);
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);

            const recorderPromise = new Promise<void>((resolve, reject) => {
                 recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    downloadUrl(url, `${slug}.webm`);
                    URL.revokeObjectURL(url);
                    resolve();
                };
                recorder.onerror = (e) => reject(e);
            });

            recorder.start();

            for (let i = 1; i <= totalSteps; i++) {
                const off = document.createElement('canvas');
                off.width = canvas.width;
                off.height = canvas.height;
                const offCtx = off.getContext('2d');
                if (!offCtx) throw new Error('Could not get offscreen context');
                const prevColored = drawingData.paths.slice(0, i - 1).map(p => forcePathColor(p, '#000000'));
                const currentColored = [forcePathColor(drawingData.paths[i - 1], '#FF0000')];
                const frameContent = [...prevColored, ...currentColored].join('');
                const frameSvg = `<svg viewBox="${drawingData.viewBox}" xmlns="http://www.w3.org/2000/svg">${frameContent}</svg>`;
                const frameV = await Canvg.from(offCtx, frameSvg, { ignoreDimensions: true });
                frameV.resize(canvas.width, canvas.height, 'xMidYMid meet');
                await frameV.render();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
                await new Promise(resolve => setTimeout(resolve, exportOptions.speed));
            }
            // Append and hold final frame
            {
              const off = document.createElement('canvas');
              off.width = canvas.width; off.height = canvas.height;
              const offCtx = off.getContext('2d'); if (!offCtx) throw new Error('Could not get offscreen context');
              const finalSvg = buildFinalSvgContent();
              const v = await Canvg.from(offCtx, finalSvg, { ignoreDimensions: true });
              v.resize(canvas.width, canvas.height, 'xMidYMid meet');
              await v.render();
              ctx.clearRect(0,0,canvas.width,canvas.height);
              ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
              await new Promise(r => setTimeout(r, finalFrame.holdMs));
            }

            recorder.stop();
            await recorderPromise;

        } else if (format === 'gif') {
            const canvas = document.createElement('canvas');
            canvas.width = exportOptions.size.width;
            canvas.height = exportOptions.size.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) throw new Error("Could not get canvas context");

            const workerScriptUrl = await getGifWorkerScriptUrl();
            const TRANSPARENT_KEY_HEX = 0xff00ff;
            const gif = new GIF({
                workers: 2,
                quality: 10,
                width: exportOptions.size.width,
                height: exportOptions.size.height,
                workerScript: workerScriptUrl,
                transparent: TRANSPARENT_KEY_HEX
            });

            for (let i = 1; i <= totalSteps; i++) {
                const off = document.createElement('canvas');
                off.width = canvas.width; off.height = canvas.height;
                const offCtx = off.getContext('2d'); if (!offCtx) throw new Error('Could not get offscreen context');
                const prevColored = drawingData.paths.slice(0, i - 1).map(p => forcePathColor(p, '#000000'));
                const currentColored = [forcePathColor(drawingData.paths[i - 1], '#FF0000')];
                const frameContent = [...prevColored, ...currentColored].join('');
                const frameSvg = `<svg viewBox="${drawingData.viewBox}" xmlns="http://www.w3.org/2000/svg">${frameContent}</svg>`;
                const frameV = await Canvg.from(offCtx, frameSvg, { ignoreDimensions: true });
                frameV.resize(canvas.width, canvas.height, 'xMidYMid meet');
                await frameV.render();
                ctx.fillStyle = '#FF00FF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
                gif.addFrame(ctx, { copy: true, delay: exportOptions.speed, dispose: 2 });
            }
            // Final frame (customizable) with hold duration
            {
              const off = document.createElement('canvas');
              off.width = canvas.width; off.height = canvas.height;
              const offCtx = off.getContext('2d'); if (!offCtx) throw new Error('Could not get offscreen context');
              const finalSvg = buildFinalSvgContent();
              const v = await Canvg.from(offCtx, finalSvg, { ignoreDimensions: true });
              v.resize(canvas.width, canvas.height, 'xMidYMid meet');
              await v.render();
              ctx.fillStyle = '#FF00FF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
              gif.addFrame(ctx, { copy: true, delay: finalFrame.holdMs, dispose: 2 });
            }

            const gifPromise = new Promise<void>((resolve) => {
                gif.on('finished', (blob: Blob) => {
                    const url = URL.createObjectURL(blob);
                    downloadUrl(url, `${slug}.gif`);
                    URL.revokeObjectURL(url);
                    resolve();
                });
            });

            gif.render();
            await gifPromise;

        } else if (format === 'zip-png' || format === 'zip-webp') {
            const imageFormat = format.split('-')[1] as 'png' | 'webp';
            const zip = new JSZip();

            for (let i = 1; i <= totalSteps; i++) {
                const currentPathOnly = drawingData.paths[i - 1];
                const stepSvg = `<svg viewBox="${drawingData.viewBox}" xmlns="http://www.w3.org/2000/svg">${currentPathOnly}</svg>`;
                const imageUrl = await renderSvgToUrl(stepSvg, imageFormat, exportOptions.size.width, exportOptions.size.height);
                const actualExt = imageUrl.startsWith('data:image/png') ? 'png' : imageFormat;
                const imageBlob = await dataURLtoBlob(imageUrl);

                if (imageBlob) {
                    const stepNumber = i.toString().padStart(3, '0');
                    zip.file(`${slug}-single-step-${stepNumber}.${actualExt}`, imageBlob);
                }
            }

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            downloadUrl(url, `${slug}-steps-${imageFormat}.zip`);
            URL.revokeObjectURL(url);
        } else if (format === 'final-zip') {
            const zip = new JSZip();
            const finalSvg = buildFinalSvgContent();
            zip.file(`${slug}-final.svg`, new Blob([finalSvg], { type: 'image/svg+xml' }));
            // PNG
            const pngUrl = await renderSvgToUrl(finalSvg, 'png', exportOptions.size.width, exportOptions.size.height);
            const pngBlob = await dataURLtoBlob(pngUrl);
            if (pngBlob) zip.file(`${slug}-final.png`, pngBlob);
            // WebP (may fall back to PNG)
            const webpUrl = await renderSvgToUrl(finalSvg, 'webp', exportOptions.size.width, exportOptions.size.height);
            const webpBlob = await dataURLtoBlob(webpUrl);
            if (webpBlob) {
              const ext = webpUrl.startsWith('data:image/png') ? 'png' : 'webp';
              zip.file(`${slug}-final.${ext}`, webpBlob);
            }
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            downloadUrl(url, `${slug}-final.zip`);
            URL.revokeObjectURL(url);
        }
    } catch (err) {
        console.error(`Export failed for format: ${format}`, err);
        const defaultMessage = 'An unknown error occurred during export. Please try again or use a different format.';
        const browserSupportMessage = ' Your browser might not support this feature or format.';
        
        let message = err instanceof Error ? `Export failed: ${err.message}` : defaultMessage;

        if (format === 'mp4' || format === 'gif' || format === 'webp') {
             message += browserSupportMessage;
        }

        setError(message);
    } finally {
        setIsExporting(false);
    }
  }, [drawingData, prompt, totalSteps, currentStep, slug, exportOptions.size.width, exportOptions.size.height, exportOptions.speed, finalFrame.holdMs, buildFinalSvgContent, forcePathColor]);

  return (
    <div className="min-h-screen flex flex-col text-gray-800">
      <Header />
      <main className="flex-grow container mx-auto p-4 flex flex-col items-center">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8">
          <PromptForm onGenerate={handleGenerate} onFileUpload={handleFileUpload} onVectorizeUpload={handleVectorizeUpload} isLoading={isLoading} />
          {error && <div className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</div>}
          
          <div className="mt-6">
            {isLoading && <Loader />}
            {!isLoading && !drawingData && <WelcomeSplash />}
            {drawingData && (
              <div className="flex flex-col items-center">
                <DrawingDisplay 
                  data={drawingData} 
                  currentStep={currentStep} 
                  exportOptions={exportOptions}
                  isPlaying={isPlaying}
                />
                <Controls
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  isPlaying={isPlaying}
                  isExporting={isExporting}
                  onStepChange={setCurrentStep}
                  onPlayPause={() => setIsPlaying(!isPlaying)}
                  onReset={() => { setCurrentStep(1); setIsPlaying(true); }}
                  onDownload={handleDownload}
                />
                <div className="w-full border-t border-gray-200 my-8"></div>
                <ExportOptions onOptionsChange={setExportOptions} isExporting={isExporting} />
                <PathOptions value={pathOptions} onChange={setPathOptions} disabled={isLoading || isExporting} totalOriginalPaths={sourcePaths?.length ?? 0} />
                <FinalFrameOptions value={finalFrame} onChange={setFinalFrame} isExporting={isExporting} />
                <StepGrid data={drawingData} slug={slug} />
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>Built by a world-class React engineer with Gemini API.</p>
      </footer>
    </div>
  );
};

export default App;
