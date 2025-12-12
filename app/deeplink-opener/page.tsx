"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { usePreferences } from "../hooks/usePreferences";
import { getTextColor } from "../utils/styles";
import { Header } from "../components/ui/Header";
import { PageTransition } from "../components/ui/PageTransition";
import { saveDeeplink, getDeeplinkHistory, deleteDeeplink, clearDeeplinkHistory, DeeplinkHistoryItem } from "../utils/deeplinkHistory";
import { ExternalLink, QrCode, Trash2, Smartphone } from "lucide-react";
import QRCode from "react-qr-code";

export default function DeeplinkOpener() {
  const { t } = useLanguage();
  const { preferences } = usePreferences();

  const [input, setInput] = useState("");
  const [history, setHistory] = useState<DeeplinkHistoryItem[]>([]);
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);

  // Theme Helpers
  const isDark = preferences ? getTextColor(preferences.backgroundColor) === 'text-white' : true;

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

  const handleOpen = async () => {
    if (!input) return;

    // Save to history first
    await saveDeeplink(input);
    await loadHistory();

    // Execute
    window.location.href = input;
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
                onClick={handleOpen}
                title={t.deeplinkOpener.open}
                className="flex-1 sm:flex-none p-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
              >
                <ExternalLink className="w-6 h-6" />
              </button>
              <button
                onClick={handleGenerateQR}
                title={t.deeplinkOpener.generateQr}
                className={`flex-1 sm:flex-none p-3 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center border ${styles.glassButton} ${styles.border}`}
              >
                <QrCode className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        {qrCodeValue && (
          <div className="flex justify-center mb-8 animate-in fade-in zoom-in duration-300">
            <div className="p-4 bg-white rounded-2xl shadow-xl">
              <QRCode
                value={qrCodeValue}
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
              <p className="text-center mt-2 text-sm text-neutral-500 font-mono break-all max-w-[256px]">
                {qrCodeValue}
              </p>
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
    </div>
  );
}
