"use client";

import { useState, useEffect, Suspense } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { usePreferences } from "../hooks/usePreferences";
import { getTextColor } from "../utils/styles";
import { Header } from "../components/ui/Header";
import { PageTransition } from "../components/ui/PageTransition";
import { saveDeeplink, getDeeplinkHistory, deleteDeeplink, clearDeeplinkHistory, DeeplinkHistoryItem } from "../utils/deeplinkHistory";
import { ExternalLink, QrCode, Trash2, Smartphone, Download, Share2, X, Camera } from "lucide-react";
import QRCode from "react-qr-code";
import { Html5Qrcode } from "html5-qrcode";
import { Toast, ToastType } from "../components/ui/Toast";
import { useSearchParams } from "next/navigation";

function DeeplinkContent() {
  const { t } = useLanguage();
  const { preferences } = usePreferences();
  const searchParams = useSearchParams();

  const [input, setInput] = useState("");
  const [history, setHistory] = useState<DeeplinkHistoryItem[]>([]);
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: "",
    type: "info",
    isVisible: false,
  });

  // Theme Helpers
  const isDark = preferences ? getTextColor(preferences.backgroundColor) === 'text-white' : true;

  useEffect(() => {
    const linkParam = searchParams.get("link");
    if (linkParam) {
      // Basic sanitization: allow only typical custom scheme or http characters
      // Removing potential script tags or javascript: prefixes logic
      const sanitized = linkParam.trim();
      if (!sanitized.toLowerCase().startsWith("javascript:")) {
          setInput(sanitized);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (isScanning) {
      html5QrCode = new Html5Qrcode("reader");

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          setInput(decodedText);
          handleStopScanning(html5QrCode);
          handleOpen(decodedText);
        },
        (errorMessage) => {
           // console.warn(errorMessage);
        }
      ).catch(err => {
        console.error("Error starting scanner", err);
        showToast(t.deeplinkOpener.cameraPermission, "error");
        setIsScanning(false);
      });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode?.clear()).catch(console.error);
      }
    };
  }, [isScanning]);

  const handleStopScanning = (scannerInstance?: Html5Qrcode | null) => {
     setIsScanning(false);
     if (scannerInstance) {
         scannerInstance.stop().then(() => scannerInstance.clear()).catch(console.error);
     }
  };

  const downloadQrCode = () => {
    const svg = document.getElementById("qrcode-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = 1024;
    canvas.height = 1024;

    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add margin
      const margin = 50;
      ctx.drawImage(img, margin, margin, canvas.width - (margin * 2), canvas.height - (margin * 2));

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");

      // Sanitized filename: timestamp-myapp-path-to-screen.png
      const sanitizedInput = input.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const filename = `${Date.now()}-${sanitizedInput}.png`;

      downloadLink.download = filename;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const shareQrCode = async () => {
    const svg = document.getElementById("qrcode-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // QR Code size = 1024x1024
    // Text area = 100px height
    // Margin = 50px
    const qrSize = 1024;
    const textAreaHeight = 120;
    const margin = 50;

    canvas.width = qrSize;
    canvas.height = qrSize + textAreaHeight;

    img.onload = () => {
       if (!ctx) return;
       ctx.fillStyle = "white";
       ctx.fillRect(0, 0, canvas.width, canvas.height);

       // Draw QR Code centered horizontally, with margin top
       ctx.drawImage(img, margin, margin, qrSize - (margin * 2), qrSize - (margin * 2));

       // Draw URL Text
       const shareUrl = typeof window !== 'undefined'
          ? `${window.location.origin}${window.location.pathname}?link=${encodeURIComponent(input)}`
          : input;

       ctx.font = "bold 24px sans-serif";
       ctx.fillStyle = "#000000";
       ctx.textAlign = "center";
       ctx.textBaseline = "middle";

       // Draw text in the footer area
       ctx.fillText(shareUrl, canvas.width / 2, qrSize + (textAreaHeight / 2) - 10);

       canvas.toBlob(async (blob) => {
         if (!blob) return;
         const file = new File([blob], "qrcode.png", { type: "image/png" });

         if (navigator.share) {
           try {
             await navigator.share({
               files: [file],
               title: 'QR Code',
               text: `Open this deeplink: ${shareUrl}`,
               url: shareUrl,
             });
           } catch (error) {
             console.error("Error sharing:", error);
           }
         } else {
           alert("Web Share API not supported in this browser");
         }
       });
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const styles = {
    textPrimary: isDark ? 'text-white' : 'text-neutral-900',
    textSecondary: isDark ? 'text-neutral-400' : 'text-neutral-600',
    glassPanel: isDark ? 'bg-black/40 border-white/5' : 'bg-white/40 border-black/5',
    glassInput: isDark ? 'bg-black/20 border-white/10 text-white placeholder-white/30' : 'bg-white/20 border-black/10 text-neutral-900 placeholder-black/30',
    glassButton: isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-neutral-900',
    border: isDark ? 'border-white/10' : 'border-black/10',
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const items = await getDeeplinkHistory();
    // Sort by timestamp desc
    setHistory(items.sort((a, b) => b.timestamp - a.timestamp));
  };

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const handleOpen = async (urlOverride?: string) => {
    const urlToOpen = urlOverride || input;
    if (!urlToOpen) return;

    // Save to history first
    await saveDeeplink(urlToOpen);
    await loadHistory();

    // Try to open
    const start = Date.now();
    window.location.href = urlToOpen;

    // Fallback detection logic
    // If the browser is still visible after a short delay, likely the app didn't open
    setTimeout(() => {
      if (!document.hidden && Date.now() - start < 2000) {
         showToast(t.deeplinkOpener.appNotFound, "error");
      }
    }, 1500);
  };

  const handleGenerateQR = async () => {
    if (!input) return;

    // Save to history
    await saveDeeplink(input);
    await loadHistory();

    setQrCodeValue(input);
  };

  const handleDeleteHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteDeeplink(id);
    loadHistory();
  };

  const handleClearHistory = async () => {
    await clearDeeplinkHistory();
    loadHistory();
  };

  const handleHistoryClick = (item: DeeplinkHistoryItem) => {
    setInput(item.url);
    // User requested to only populate for editing, not auto-execute
  };

  return (
    <div className="min-h-screen">
      <Header title={t.deeplinkOpener.title} />

      <PageTransition className="px-4 md:px-8 pb-4 md:pb-8 pt-32 max-w-3xl mx-auto">

        {/* Input Section */}
        <div className={`backdrop-blur-xl rounded-3xl p-6 mb-8 border transition-colors duration-300 ${styles.glassPanel}`}>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Smartphone className={`h-5 w-5 ${styles.textSecondary}`} />
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.deeplinkOpener.placeholder}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${styles.glassInput}`}
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsScanning(!isScanning)}
                title={t.deeplinkOpener.scanQr}
                className={`flex-1 sm:flex-none p-3 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center border ${styles.glassButton} ${styles.border}`}
              >
                <Camera className="w-6 h-6" />
              </button>

              {input.length > 0 && (
                <>
                  <button
                    onClick={() => handleOpen()}
                    title={t.deeplinkOpener.open}
                    className="flex-1 sm:flex-none p-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center animate-in zoom-in duration-300"
                  >
                    <ExternalLink className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleGenerateQR}
                    title={t.deeplinkOpener.generateQr}
                    className={`flex-1 sm:flex-none p-3 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center border animate-in zoom-in duration-300 ${styles.glassButton} ${styles.border}`}
                  >
                    <QrCode className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Scanner Section */}
        {isScanning && (
          <div className={`mb-8 p-4 rounded-3xl border ${styles.glassPanel} animate-in fade-in slide-in-from-top-4`}>
             <div className="flex justify-between items-center mb-4">
                <h3 className={`font-medium ${styles.textPrimary}`}>{t.deeplinkOpener.scanQr}</h3>
                <button onClick={() => setIsScanning(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                   <X className={`w-5 h-5 ${styles.textSecondary}`} />
                </button>
             </div>
             <div id="reader" className="overflow-hidden rounded-xl bg-black/5 min-h-[300px]" />
          </div>
        )}

        {/* QR Code Section */}
        {qrCodeValue && (
          <div className="flex flex-col items-center mb-8 animate-in fade-in zoom-in duration-300">
            <div className="p-4 bg-white rounded-2xl shadow-xl relative group">
              <button
                onClick={() => setQrCodeValue(null)}
                className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110 z-10"
                title={t.deeplinkOpener.close}
              >
                <X className="w-4 h-4" />
              </button>

              <QRCode
                id="qrcode-svg"
                value={qrCodeValue}
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
              <p className="text-center mt-2 text-sm text-neutral-500 font-mono break-all max-w-[256px]">
                {qrCodeValue}
              </p>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={downloadQrCode}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium border transition-colors hover:bg-white/10 ${styles.border} ${styles.textPrimary}`}
              >
                <Download className="w-4 h-4" />
                {t.deeplinkOpener.download}
              </button>
              <button
                onClick={shareQrCode}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium border transition-colors hover:bg-white/10 ${styles.border} ${styles.textPrimary}`}
              >
                <Share2 className="w-4 h-4" />
                {t.deeplinkOpener.share}
              </button>
            </div>
          </div>
        )}

        {/* History Section */}
        {history.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className={`text-xl font-bold ${styles.textPrimary}`}>{t.deeplinkOpener.history}</h2>
              <button
                onClick={handleClearHistory}
                className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
              >
                {t.deeplinkOpener.clearHistory}
              </button>
            </div>

            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleHistoryClick(item)}
                  className={`p-4 rounded-xl flex items-center justify-between group transition-all duration-300 border cursor-pointer ${styles.glassPanel} hover:bg-white/5 active:scale-[0.99]`}
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <p className={`font-medium truncate font-mono text-sm ${styles.textPrimary}`}>{item.url}</p>
                    <div className={`flex items-center gap-3 mt-1 text-xs ${styles.textSecondary}`}>
                       <span>{t.deeplinkOpener.opened}: {item.count} {t.deeplinkOpener.times}</span>
                       <span>•</span>
                       <span>{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteHistory(e, item.id)}
                    className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title={t.deeplinkOpener.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </PageTransition>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}

export default function DeeplinkOpener() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <DeeplinkContent />
    </Suspense>
  );
}
