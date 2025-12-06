"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { usePreferences } from "../hooks/usePreferences";
import { getTextColor } from "../utils/styles";
import {
  Upload,
  Download,
  Trash2,
  Minimize2,
  Maximize2,
  MoveDiagonal,
  FileImage,
  Gauge,
  ArrowRight,
  Check,
  Image as ImageIcon
} from "lucide-react";
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
  const { preferences } = usePreferences();

  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<{ url: string; blob: Blob } | null>(null);
  const [mode, setMode] = useState<'resize' | 'compress'>('resize');
  const [resizeTarget, setResizeTarget] = useState<'small' | 'medium' | 'large'>('small');
  const [compressTarget, setCompressTarget] = useState<'200kb' | '500kb' | '1mb' | '2mb'>('200kb');
  const [estimates, setEstimates] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Theme Helpers
  const isDark = preferences ? getTextColor(preferences.backgroundColor) === '#ffffff' : true;

  const styles = {
    textPrimary: isDark ? 'text-white' : 'text-neutral-900',
    textSecondary: isDark ? 'text-neutral-400' : 'text-neutral-600',
    glassPanel: isDark ? 'bg-black/40 border-white/5' : 'bg-white/40 border-black/5',
    glassButton: isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-neutral-900',
    glassInput: isDark ? 'bg-black/20 border-white/10' : 'bg-white/20 border-black/10',
    accentActive: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20',
    border: isDark ? 'border-white/10' : 'border-black/10',
    dashedBorder: isDark ? 'border-white/20' : 'border-black/20',
  };

  // Load history on mount
  useEffect(() => {
    loadHistory();
    return () => {
      // Cleanup previews
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, []);

  // Update estimates when file changes
  useEffect(() => {
    if (file && mode === 'compress') {
      updateEstimates(file);
    }
  }, [file, mode]);

  const loadHistory = async () => {
    const items = await getHistory();
    setHistory(items.sort((a, b) => b.timestamp - a.timestamp));
  };

  const updateEstimates = async (f: File) => {
    // Calculate for all targets to populate the UI immediately (better UX)
    const targets = ['200kb', '500kb', '1mb', '2mb'] as const;
    const newEstimates: Record<string, string> = {};

    // We can do this in parallel
    await Promise.all(targets.map(async (target) => {
      newEstimates[target] = await estimateDimensionsForCompression(f, target);
    }));

    setEstimates(newEstimates);
  };

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
      const url = URL.createObjectURL(f);
      setFilePreviewUrl(url);
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

  // Icons mapping
  const ResizeIcons = {
    small: Minimize2,
    medium: Maximize2, // Using Maximize2 for medium as "standard"
    large: MoveDiagonal, // Expand symbol
  };

  return (
    <div className={`min-h-screen`}>
      <Header title={t.imageReducer.title} />

      <PageTransition className="px-4 md:px-8 pb-4 md:pb-8 pt-32 max-w-6xl mx-auto">

        {/* Main Workspace */}
        <div className={`backdrop-blur-xl rounded-3xl p-6 mb-8 border transition-colors duration-300 ${styles.glassPanel}`}>

          {/* 1. Comparison / Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

            {/* Left: Original / Upload */}
            <div className="flex flex-col gap-4">
              <h3 className={`text-lg font-medium ${styles.textPrimary} flex items-center gap-2`}>
                <ImageIcon className="w-5 h-5 opacity-50" />
                Original
              </h3>

              <div
                className={`aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all duration-300 ${
                  dragActive
                    ? "border-blue-500 bg-blue-500/10"
                    : `${styles.dashedBorder} hover:bg-black/5`
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

                {file && filePreviewUrl ? (
                   <>
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img src={filePreviewUrl} alt="Original" className="absolute inset-0 w-full h-full object-contain p-2 z-0" />
                     <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md text-white p-3 rounded-xl flex justify-between items-center z-10">
                        <div className="truncate pr-4">
                           <p className="text-sm font-medium truncate">{file.name}</p>
                           <p className="text-xs opacity-70">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button onClick={() => { setFile(null); setFilePreviewUrl(null); setProcessedImage(null); }} className="p-2 hover:bg-white/20 rounded-lg text-red-400">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                   </>
                ) : (
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center z-10">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                            <Upload className={`w-8 h-8 ${styles.textSecondary}`} />
                        </div>
                        <p className={`text-lg font-medium ${styles.textPrimary} mb-2`}>{t.imageReducer.uploadInstruction}</p>
                        <p className={`text-sm ${styles.textSecondary}`}>{t.imageReducer.dropzone}</p>
                    </label>
                )}
              </div>
            </div>

            {/* Right: Processed / Preview Placeholder */}
            <div className="flex flex-col gap-4">
              <h3 className={`text-lg font-medium ${styles.textPrimary} flex items-center gap-2`}>
                <Check className="w-5 h-5 opacity-50" />
                {t.imageReducer.processed || "Result"}
              </h3>

              <div className={`aspect-video rounded-2xl border flex flex-col items-center justify-center relative overflow-hidden ${styles.glassInput} ${styles.border}`}>
                 {processedImage ? (
                    <>
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img src={processedImage.url} alt="Processed" className="absolute inset-0 w-full h-full object-contain p-2" />
                       <div className="absolute bottom-2 left-2 right-2 bg-green-500/90 backdrop-blur-md text-white p-3 rounded-xl flex justify-between items-center z-10">
                          <div>
                             <p className="text-sm font-bold">Done!</p>
                             <p className="text-xs opacity-90">
                                {(processedImage.blob.size / 1024 / 1024).toFixed(2)} MB
                                {file && <span className="ml-1 opacity-75">(-{(100 - (processedImage.blob.size / file.size) * 100).toFixed(0)}%)</span>}
                             </p>
                          </div>
                          <a
                            href={processedImage.url}
                            download={`processed-${file?.name}`}
                            className="p-2 bg-white text-green-600 rounded-lg hover:scale-105 transition-transform"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                       </div>
                    </>
                 ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 opacity-40">
                       <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2 border-dashed ${styles.dashedBorder}`}>
                          <ArrowRight className={`w-6 h-6 ${styles.textSecondary}`} />
                       </div>
                       <p className={`text-sm ${styles.textSecondary}`}>
                         {processing ? t.imageReducer.processing : "Configure options and process to see result"}
                       </p>
                    </div>
                 )}
              </div>
            </div>
          </div>

          {/* 2. Controls Section */}
          {file && (
            <div className={`border-t ${styles.border} pt-8 animate-in slide-in-from-bottom-4 duration-500`}>

              {/* Mode Toggle */}
              <div className="flex justify-center mb-8">
                 <div className={`p-1 rounded-xl flex ${isDark ? 'bg-black/40' : 'bg-black/5'}`}>
                    <button
                      onClick={() => setMode('resize')}
                      className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        mode === 'resize'
                          ? 'bg-white text-black shadow-sm'
                          : `${styles.textSecondary} hover:${styles.textPrimary}`
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      {t.imageReducer.resizeTitle}
                    </button>
                    <button
                      onClick={() => setMode('compress')}
                      className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        mode === 'compress'
                          ? 'bg-white text-black shadow-sm'
                          : `${styles.textSecondary} hover:${styles.textPrimary}`
                      }`}
                    >
                      <Gauge className="w-4 h-4" />
                      {t.imageReducer.compressTitle}
                    </button>
                 </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-8 items-start">
                 {/* Options Grid */}
                 <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {mode === 'resize' ? (
                      <>
                        {(['small', 'medium', 'large'] as const).map((opt) => {
                          const Icon = ResizeIcons[opt];
                          return (
                            <button
                              key={opt}
                              onClick={() => setResizeTarget(opt)}
                              className={`p-4 rounded-xl border text-left transition-all duration-300 relative overflow-hidden group ${
                                resizeTarget === opt
                                  ? styles.accentActive
                                  : `${styles.glassButton} ${styles.border}`
                              }`}
                            >
                              <div className="flex flex-col h-full justify-between gap-3">
                                 <Icon className={`w-6 h-6 ${resizeTarget === opt ? 'text-white' : styles.textSecondary}`} />
                                 <div>
                                    <div className={`font-medium capitalize ${resizeTarget === opt ? 'text-white' : styles.textPrimary}`}>
                                       {t.imageReducer[opt]}
                                    </div>
                                    <div className={`text-xs opacity-60 ${resizeTarget === opt ? 'text-white' : styles.textSecondary}`}>
                                        {opt === 'small' && 'Max 840px'}
                                        {opt === 'medium' && 'Max 1280px'}
                                        {opt === 'large' && 'Max 2880px'}
                                    </div>
                                 </div>
                              </div>
                            </button>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        {(['200kb', '500kb', '1mb', '2mb'] as const).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setCompressTarget(opt)}
                            className={`p-4 rounded-xl border text-left transition-all duration-300 relative overflow-hidden group ${
                              compressTarget === opt
                                ? styles.accentActive
                                : `${styles.glassButton} ${styles.border}`
                            }`}
                          >
                              <div className="flex flex-col h-full justify-between gap-3">
                                 <FileImage className={`w-6 h-6 ${compressTarget === opt ? 'text-white' : styles.textSecondary}`} />
                                 <div>
                                    <div className={`font-medium ${compressTarget === opt ? 'text-white' : styles.textPrimary}`}>
                                       {opt}
                                    </div>
                                    {estimates[opt] ? (
                                        <div className={`text-xs mt-1 ${compressTarget === opt ? 'text-white/80' : styles.textSecondary}`}>
                                           ~{estimates[opt]}
                                        </div>
                                    ) : (
                                        <div className="h-4 w-12 bg-current opacity-10 rounded mt-1 animate-pulse" />
                                    )}
                                 </div>
                              </div>
                          </button>
                        ))}
                      </>
                    )}
                 </div>

                 {/* Action Panel */}
                 <div className={`w-full lg:w-64 p-4 rounded-2xl border ${styles.glassInput} ${styles.border} flex flex-col gap-4`}>
                    <div>
                        <p className={`text-sm font-medium ${styles.textSecondary} mb-1 uppercase tracking-wider`}>Estimated Output</p>
                        <div className={`text-2xl font-semibold ${styles.textPrimary}`}>
                           {mode === 'compress' ? (
                               <span>Target: {compressTarget}</span>
                           ) : (
                               <span className="capitalize">{resizeTarget}</span>
                           )}
                        </div>
                        {mode === 'compress' && estimates[compressTarget] && (
                           <p className={`text-sm ${styles.textSecondary}`}>
                              New dim: {estimates[compressTarget]}
                           </p>
                        )}
                    </div>

                    <div className={`h-px w-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

                    <button
                      onClick={handleProcess}
                      disabled={processing}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {processing ? (
                          <>
                             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                             {t.imageReducer.processing}
                          </>
                      ) : (
                          t.imageReducer.process
                      )}
                    </button>
                 </div>
              </div>
            </div>
          )}

        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className={`text-xl font-bold ${styles.textPrimary}`}>{t.imageReducer.history}</h2>
              <button onClick={handleClearHistory} className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors">
                {t.imageReducer.clearHistory}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((item) => (
                <div key={item.id} className={`p-4 rounded-xl flex items-center gap-4 group transition-all duration-300 border ${styles.glassPanel} hover:bg-white/5`}>
                   <div className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border ${styles.border} bg-black/5`}>
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img src={getDownloadUrl(item.processedBlob)} alt="" className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1 min-w-0">
                       <p className={`font-medium truncate transition-colors ${styles.textPrimary}`}>{item.originalName}</p>
                       <p className={`text-xs ${styles.textSecondary}`}>
                           {new Date(item.timestamp).toLocaleDateString()} • {item.type === 'resize' ? 'Resize' : 'Compress'}: {item.details}
                       </p>
                       <p className={`text-xs mt-1 ${styles.textSecondary}`}>{(item.processedBlob.size / 1024).toFixed(0)} KB</p>
                   </div>
                   <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <a
                        href={getDownloadUrl(item.processedBlob)}
                        download={`history-${item.originalName}`}
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                       >
                           <Download className="w-4 h-4" />
                       </a>
                       <button
                        onClick={() => handleDeleteHistory(item.id)}
                        className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
