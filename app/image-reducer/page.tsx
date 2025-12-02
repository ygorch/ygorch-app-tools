"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { Upload, Download, Trash2 } from "lucide-react";
import { processImage, estimateDimensionsForCompression, ImageProcessOptions } from "../utils/imageProcessor";
import { saveToHistory, getHistory, deleteFromHistory, clearHistory } from "../utils/historyStorage";
import { Header } from "../components/ui/Header";
import { PageTransition } from "../components/ui/PageTransition";

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
    // Optimization: Calculate for selected only first for responsiveness
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

  const getDownloadUrl = (blob: Blob) => {
      return URL.createObjectURL(blob);
  }

  return (
    <div className="min-h-screen">
      <Header title={t.imageReducer.title} />

      <PageTransition className="px-4 md:px-8 pb-4 md:pb-8 pt-32 max-w-4xl mx-auto">

        <div className="glass-panel rounded-3xl p-6 mb-8">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
              dragActive
                ? "border-blue-500 bg-blue-500/10"
                : "border-white/10 hover:border-white/30 hover:bg-white/5"
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
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <p className="text-lg font-medium text-white mb-2">{file.name}</p>
                    <p className="text-sm text-gray-400 mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button onClick={() => { setFile(null); setProcessedImage(null); }} className="text-red-400 text-sm hover:text-red-300 transition-colors">
                        Change File
                    </button>
                </div>
            ) : (
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-lg font-medium text-white mb-2">{t.imageReducer.uploadInstruction}</p>
                    <p className="text-sm text-gray-400">{t.imageReducer.dropzone}</p>
                </label>
            )}
          </div>

          {/* Options */}
          {file && (
            <div className="mt-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex space-x-1 bg-black/20 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setMode('resize')}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'resize'
                      ? 'bg-white/10 text-white shadow-sm backdrop-blur-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t.imageReducer.resizeTitle}
                </button>
                <button
                  onClick={() => setMode('compress')}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'compress'
                      ? 'bg-white/10 text-white shadow-sm backdrop-blur-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
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
                        className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                          resizeTarget === opt
                            ? 'bg-blue-500/20 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                            : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="font-medium capitalize">{t.imageReducer[opt]}</div>
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {(['200kb', '500kb', '1mb', '2mb'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setCompressTarget(opt)}
                        className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                          compressTarget === opt
                            ? 'bg-blue-500/20 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                            : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="font-medium">{opt}</div>
                        {estimates[opt] && (
                             <div className="text-xs text-gray-400 mt-1">{t.imageReducer.estimatedDimensions} {estimates[opt]}</div>
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
                  className="glass-button bg-white/10 text-white px-8 py-3 rounded-xl font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  {processing ? t.imageReducer.processing : t.imageReducer.process}
                </button>
              </div>
            </div>
          )}

          {/* Result */}
          {processedImage && (
            <div className="mt-8 border-t border-white/10 pt-8 animate-in slide-in-from-bottom-8 duration-500">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 bg-black/40 rounded-2xl p-4 flex items-center justify-center border border-white/5 backdrop-blur-sm">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={processedImage.url} alt="Processed" className="max-w-full max-h-[400px] object-contain" />
                </div>
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-xl font-light text-white mb-2">{t.imageReducer.processed}</h3>
                    <p className="text-gray-400 text-lg">
                        {(processedImage.blob.size / 1024 / 1024).toFixed(2)} MB
                        {file && <span className="text-green-400 ml-2">(-{(100 - (processedImage.blob.size / file.size) * 100).toFixed(0)}%)</span>}
                    </p>
                  </div>

                  <a
                    href={processedImage.url}
                    download={`processed-${file?.name}`}
                    className="inline-flex items-center justify-center w-full bg-white text-black px-6 py-4 rounded-xl font-medium hover:bg-gray-200 transition-colors shadow-lg hover:shadow-white/20"
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
              <h2 className="text-xl font-bold text-white">{t.imageReducer.history}</h2>
              <button onClick={handleClearHistory} className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors">
                {t.imageReducer.clearHistory}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((item) => (
                <div key={item.id} className="glass-panel p-4 rounded-xl flex items-center gap-4 group hover:bg-white/10 transition-all duration-300">
                   <div className="w-16 h-16 bg-black/40 rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img src={getDownloadUrl(item.processedBlob)} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                   </div>
                   <div className="flex-1 min-w-0">
                       <p className="font-medium text-gray-200 truncate group-hover:text-white transition-colors">{item.originalName}</p>
                       <p className="text-xs text-gray-500 group-hover:text-gray-400">
                           {new Date(item.timestamp).toLocaleDateString()} • {item.type === 'resize' ? 'Resize' : 'Compress'}: {item.details}
                       </p>
                       <p className="text-xs text-gray-400 mt-1">{(item.processedBlob.size / 1024).toFixed(0)} KB</p>
                   </div>
                   <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <a
                        href={getDownloadUrl(item.processedBlob)}
                        download={`history-${item.originalName}`}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                       >
                           <Download className="w-4 h-4" />
                       </a>
                       <button
                        onClick={() => handleDeleteHistory(item.id)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                       >
                           <Trash2 className="w-4 h-4" />
                       </button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </PageTransition>
    </div>
  );
}
