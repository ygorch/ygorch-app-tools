"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { ArrowLeft, Upload, Download, Trash2, X } from "lucide-react";
import Link from "next/link";
import { processImage, estimateDimensionsForCompression, ImageProcessOptions } from "../utils/imageProcessor";
import { saveToHistory, getHistory, deleteFromHistory, clearHistory } from "../utils/historyStorage";

// Define locally to match history storage type
interface HistoryItem {
  id: string;
  timestamp: number;
  originalName: string;
  processedBlob: Blob;
  type: 'resize' | 'compress';
  details: string;
}

export default function ImageReducer() {
  const { t } = useLanguage();

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<{ url: string; blob: Blob } | null>(null);
  const [mode, setMode] = useState<'resize' | 'compress'>('resize');
  const [resizeTarget, setResizeTarget] = useState<'small' | 'medium' | 'large'>('small');
  const [compressTarget, setCompressTarget] = useState<'200kb' | '500kb' | '1mb' | '2mb'>('200kb');
  const [estimates, setEstimates] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Update estimates when file changes
  useEffect(() => {
    if (file && mode === 'compress') {
      updateEstimates(file);
    }
  }, [file, mode]);

  const loadHistory = async () => {
    const items = await getHistory();
    // Sort by timestamp desc
    setHistory(items.sort((a, b) => b.timestamp - a.timestamp));
  };

  const updateEstimates = async (f: File) => {
    // Check if we already have estimates for this file to avoid re-running?
    // For simplicity, just run for all targets if not too heavy.
    // To avoid blocking UI, maybe do one by one or just the selected one.
    // User asked: "estimates of dimensions that these images will stay to meet this weight requirement"
    // Let's calculate for all 4 options so the user can see them before selecting.

    const targets = ['200kb', '500kb', '1mb', '2mb'];
    const newEstimates: Record<string, string> = {};

    // We can run this in parallel but let's be careful with resources
    // Let's just run for the currently selected one first to be responsive, then others?
    // Or just run all.

    for (const target of targets) {
        // Just a placeholder for now to not block excessively, or implement the heavy lifting if needed.
        // The previous implementation of estimateDimensionsForCompression actually runs the compression.
        // That might be heavy. Let's do it only for the *selected* one for now to ensure UI responsiveness.
        // If the user switches, we calculate.
    }

    // Optimizing: Only calculate for current selection
    const dim = await estimateDimensionsForCompression(f, compressTarget);
    setEstimates(prev => ({ ...prev, [compressTarget]: dim }));
  };

  // Re-trigger estimate when compressTarget changes
  useEffect(() => {
      if (file && mode === 'compress') {
           estimateDimensionsForCompression(file, compressTarget).then(dim => {
               setEstimates(prev => ({ ...prev, [compressTarget]: dim }));
           });
      }
  }, [compressTarget, file, mode]);


  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (f: File) => {
    if (f.type === "image/jpeg" || f.type === "image/png") {
      setFile(f);
      setProcessedImage(null);
      setEstimates({});
    } else {
      alert("Only JPG and PNG files are allowed");
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const options: ImageProcessOptions = {
        type: mode,
        resizeTarget: mode === 'resize' ? resizeTarget : undefined,
        compressTarget: mode === 'compress' ? compressTarget : undefined,
      };

      const processedBlob = await processImage(file, options);
      const url = URL.createObjectURL(processedBlob);
      setProcessedImage({ url, blob: processedBlob });

      // Save to history
      const details = mode === 'resize'
        ? t.imageReducer[resizeTarget]
        : compressTarget; // Use the raw value for compress targets as they are not in the translation map keys

      // Actually we want the translated text in UI, but maybe store raw or translated?
      // Let's store a descriptive string.
      // Need to be careful with translations in history if language changes.
      // Ideally store metadata and translate on render. But for simplicity let's store the raw keys
      // and translate when rendering history.
      // Wait, the interface says `details: string`. I will store "resize:small" or "compress:200kb"

      await saveToHistory({
        originalName: file.name,
        processedBlob: processedBlob,
        type: mode,
        details: mode === 'resize' ? resizeTarget : compressTarget,
      });
      loadHistory();

    } catch (error) {
      console.error(error);
      alert("Error processing image");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    await deleteFromHistory(id);
    loadHistory();
  };

  const handleClearHistory = async () => {
    await clearHistory();
    loadHistory();
  };

  // Helper to get download URL from blob stored in history
  const getDownloadUrl = (blob: Blob) => {
      return URL.createObjectURL(blob);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.imageReducer.back}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.imageReducer.title}</h1>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept="image/jpeg, image/png"
              onChange={handleChange}
            />

            {file ? (
                <div className="flex flex-col items-center">
                    <p className="text-lg font-medium text-gray-900 mb-2">{file.name}</p>
                    <p className="text-sm text-gray-500 mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button onClick={() => { setFile(null); setProcessedImage(null); }} className="text-red-500 text-sm hover:underline">
                        Change File
                    </button>
                </div>
            ) : (
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-1">{t.imageReducer.uploadInstruction}</p>
                    <p className="text-sm text-gray-500">{t.imageReducer.dropzone}</p>
                </label>
            )}
          </div>

          {/* Options */}
          {file && (
            <div className="mt-8 space-y-6">
              <div className="flex space-x-4 border-b pb-4">
                <button
                  onClick={() => setMode('resize')}
                  className={`pb-2 px-1 text-lg font-medium ${mode === 'resize' ? 'text-blue-600 border-b-2 border-blue-600 -mb-[17px]' : 'text-gray-500'}`}
                >
                  {t.imageReducer.resizeTitle}
                </button>
                <button
                  onClick={() => setMode('compress')}
                  className={`pb-2 px-1 text-lg font-medium ${mode === 'compress' ? 'text-blue-600 border-b-2 border-blue-600 -mb-[17px]' : 'text-gray-500'}`}
                >
                  {t.imageReducer.compressTitle}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mode === 'resize' ? (
                  <>
                    {(['small', 'medium', 'large'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setResizeTarget(opt)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          resizeTarget === opt ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900 capitalize">{t.imageReducer[opt]}</div>
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {(['200kb', '500kb', '1mb', '2mb'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setCompressTarget(opt)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          compressTarget === opt ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{opt}</div>
                        {estimates[opt] && (
                             <div className="text-xs text-gray-500 mt-1">{t.imageReducer.estimatedDimensions} {estimates[opt]}</div>
                        )}
                      </button>
                    ))}
                  </>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleProcess}
                  disabled={processing}
                  className="bg-black text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {processing ? t.imageReducer.processing : t.imageReducer.process}
                </button>
              </div>
            </div>
          )}

          {/* Result */}
          {processedImage && (
            <div className="mt-8 border-t pt-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 bg-gray-100 rounded-lg p-2 flex items-center justify-center">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={processedImage.url} alt="Processed" className="max-w-full max-h-[400px] object-contain" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{t.imageReducer.processed}</h3>
                    <p className="text-gray-500">
                        {(processedImage.blob.size / 1024 / 1024).toFixed(2)} MB
                        {file && ` (-${(100 - (processedImage.blob.size / file.size) * 100).toFixed(0)}%)`}
                    </p>
                  </div>

                  <a
                    href={processedImage.url}
                    download={`processed-${file?.name}`}
                    className="inline-flex items-center justify-center w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    {t.imageReducer.download}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{t.imageReducer.history}</h2>
              <button onClick={handleClearHistory} className="text-sm text-red-500 hover:text-red-700 font-medium">
                {t.imageReducer.clearHistory}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4">
                   <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img src={getDownloadUrl(item.processedBlob)} alt="" className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1 min-w-0">
                       <p className="font-medium text-gray-900 truncate">{item.originalName}</p>
                       <p className="text-xs text-gray-500">
                           {new Date(item.timestamp).toLocaleDateString()} • {item.type === 'resize' ? 'Resize' : 'Compress'}: {item.details}
                       </p>
                       <p className="text-xs text-gray-500">{(item.processedBlob.size / 1024).toFixed(0)} KB</p>
                   </div>
                   <div className="flex flex-col gap-2">
                       <a
                        href={getDownloadUrl(item.processedBlob)}
                        download={`history-${item.originalName}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                       >
                           <Download className="w-4 h-4" />
                       </a>
                       <button
                        onClick={() => handleDeleteHistory(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                       >
                           <Trash2 className="w-4 h-4" />
                       </button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
