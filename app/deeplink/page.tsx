"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { usePreferences } from "../hooks/usePreferences";
import { getTextColor } from "../utils/styles";
import { Header } from "../components/ui/Header";
import { PageTransition } from "../components/ui/PageTransition";
import { saveDeeplink, getDeeplinkHistory, deleteDeeplink, clearDeeplinkHistory, DeeplinkHistoryItem } from "../utils/deeplinkHistory";
import { parseUrlToComponents, buildUrlFromComponents } from "../utils/deeplinkBuilder";
import { getSavedSchemas, saveSchema, SavedSchema, deleteSchema, saveAllSchemas } from "../utils/deeplinkSchemas";
import { ExternalLink, QrCode, Trash2, Smartphone, Download, Share2, X, Camera, Save, ChevronDown, Plus, GripVertical, FileJson, FileSpreadsheet, Sheet, Upload } from "lucide-react";
import QRCode from "react-qr-code";
import { Html5Qrcode } from "html5-qrcode";
import { Toast, ToastType } from "../components/ui/Toast";
import { useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";

function DeeplinkContent() {
  const { t } = useLanguage();
  const { preferences } = usePreferences();
  const searchParams = useSearchParams();

  const [input, setInput] = useState("");

  // Advanced Mode State
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [schemeComponent, setSchemeComponent] = useState("");
  const [hostComponent, setHostComponent] = useState("");
  const [paramsComponent, setParamsComponent] = useState<{ id: string; key: string; value: string }[]>([]);

  // Schema Management State
  const [savedSchemas, setSavedSchemas] = useState<SavedSchema[]>([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState<string>("");

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

  // Load advanced mode preference
  useEffect(() => {
    const saved = localStorage.getItem('deeplink_advanced_mode');
    if (saved) {
      setIsAdvancedMode(saved === 'true');
    }
  }, []);

  // Toggle Advanced Mode
  const toggleAdvancedMode = () => {
    const newVal = !isAdvancedMode;
    setIsAdvancedMode(newVal);
    localStorage.setItem('deeplink_advanced_mode', String(newVal));
    if (newVal) {
      // Parse current input when switching to advanced
      const parsed = parseUrlToComponents(input);
      setSchemeComponent(parsed.scheme);
      setHostComponent(parsed.host);
      setParamsComponent(parsed.params);
    }
  };

  // Sync Input -> Builder (only when NOT editing builder fields directly)
  // We'll use a direct handler for input change instead of useEffect to avoid loops
  const handleMainInputChange = (val: string) => {
    setInput(val);
    if (isAdvancedMode) {
      const parsed = parseUrlToComponents(val);
      setSchemeComponent(parsed.scheme);
      setHostComponent(parsed.host);
      setParamsComponent(parsed.params);

      // Auto-select schema if matches saved
      const match = savedSchemas.find(s => s.scheme === parsed.scheme);
      if (match) {
        setSelectedSchemaId(match.id);
      } else {
        setSelectedSchemaId("");
      }
    }
  };

  useEffect(() => {
    const linkParam = searchParams.get("link");
    if (linkParam) {
      // Basic sanitization: allow only typical custom scheme or http characters
      // Removing potential script tags or javascript: prefixes logic
      const sanitized = linkParam.trim();
      if (!sanitized.toLowerCase().startsWith("javascript:")) {
          handleMainInputChange(sanitized);
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

  const handleShareLink = async () => {
    if (!input) return;

    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?link=${encodeURIComponent(input)}`
      : input;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Deeplink',
          text: `${input}\n\n${shareUrl}`,
          url: shareUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Link copied to clipboard", "success");
      } catch (err) {
        console.error("Error copying to clipboard", err);
        showToast("Unable to share", "error");
      }
    }
  };

  const shareQrCode = async () => {
    const svg = document.getElementById("qrcode-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // QR Code size = 1024x1024
    // Margin = 50px
    const qrSize = 1024;
    const margin = 50;

    canvas.width = qrSize;
    canvas.height = qrSize;

    img.onload = () => {
       if (!ctx) return;
       ctx.fillStyle = "white";
       ctx.fillRect(0, 0, canvas.width, canvas.height);

       // Draw QR Code centered horizontally, with margin top
       ctx.drawImage(img, margin, margin, qrSize - (margin * 2), qrSize - (margin * 2));

       canvas.toBlob(async (blob) => {
         if (!blob) return;
         const file = new File([blob], "qrcode.png", { type: "image/png" });

         if (navigator.share) {
           try {
             await navigator.share({
               files: [file],
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
    loadSchemas();
  }, []);

  const loadHistory = async () => {
    const items = await getDeeplinkHistory();
    // Sort by timestamp desc
    setHistory(items.sort((a, b) => b.timestamp - a.timestamp));
  };

  const loadSchemas = async () => {
    const schemas = await getSavedSchemas();
    setSavedSchemas(schemas.sort((a, b) => b.timestamp - a.timestamp));
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
    if (isAdvancedMode) {
        const parsed = parseUrlToComponents(item.url);
        setSchemeComponent(parsed.scheme);
        setHostComponent(parsed.host);
        setParamsComponent(parsed.params);

        // Auto-select schema logic
        const match = savedSchemas.find(s => s.scheme === parsed.scheme);
        if (match) {
            setSelectedSchemaId(match.id);
        } else {
            setSelectedSchemaId("");
        }
    }
  };

  // Builder Logic handlers
  const updateBuilder = (newScheme: string, newHost: string, newParams: typeof paramsComponent) => {
    setSchemeComponent(newScheme);
    setHostComponent(newHost);
    setParamsComponent(newParams);

    const built = buildUrlFromComponents({ scheme: newScheme, host: newHost, params: newParams });
    setInput(built);
  };

  const handleSchemaChange = (newScheme: string) => {
    // Check if new scheme matches any saved schema
    const match = savedSchemas.find(s => s.scheme === newScheme);
    setSelectedSchemaId(match ? match.id : "");

    updateBuilder(newScheme, hostComponent, paramsComponent);
  };

  const handleSchemaSelect = (schemaId: string) => {
    if (schemaId === "add_new") {
       // Just clear the selection and scheme input to allow typing new
       setSelectedSchemaId("");
       handleSchemaChange("");
       // Optionally focus the scheme input (ref needed)
       return;
    }

    const schema = savedSchemas.find(s => s.id === schemaId);
    if (schema) {
      setSelectedSchemaId(schemaId);
      updateBuilder(schema.scheme, hostComponent, paramsComponent);
    }
  };

  const handleHostChange = (newHost: string) => {
    updateBuilder(schemeComponent, newHost, paramsComponent);
  };

  const handleParamChange = (id: string, field: 'key' | 'value', val: string) => {
    const newParams = paramsComponent.map(p => {
      if (p.id === id) return { ...p, [field]: val };
      return p;
    });
    updateBuilder(schemeComponent, hostComponent, newParams);
  };

  const addParam = () => {
    const newParams = [...paramsComponent, { id: crypto.randomUUID(), key: "", value: "" }];
    updateBuilder(schemeComponent, hostComponent, newParams);
  };

  const removeParam = (id: string) => {
    const newParams = paramsComponent.filter(p => p.id !== id);
    updateBuilder(schemeComponent, hostComponent, newParams);
  };

  const handleSaveSchema = async () => {
    if (!schemeComponent) return;
    const name = prompt(t.deeplinkOpener.saveSchemaPrompt || "Enter a name for this schema (e.g. 'Production', 'Twitter')", schemeComponent);
    if (name) {
      await saveSchema(name, schemeComponent);
      await loadSchemas();
      showToast("Schema saved!", "success");
    }
  };

  const handleDeleteSchema = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(confirm("Delete this schema preset?")) {
        await deleteSchema(id);
        await loadSchemas();
        if (selectedSchemaId === id) setSelectedSchemaId("");
    }
  };

  // Export / Import Logic
  const exportData = async (format: 'json' | 'csv' | 'xlsx' | 'share') => {
    const data = {
       history,
       schemas: savedSchemas,
       version: 1,
       type: 'deeplink-export',
       exportedAt: Date.now(),
    };

    if (format === 'json') {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const link = document.createElement('a');
        link.href = dataStr;
        link.download = `deeplink_config_${Date.now()}.json`;
        link.click();
    } else if (format === 'csv') {
        // Helper to escape CSV fields
        const escapeCsv = (str: string | number) => {
            const s = String(str);
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };

        const headers = ['URL', 'Count', 'Last Opened'];
        const rows = history.map(h => [h.url, h.count, new Date(h.timestamp).toLocaleString()]);

        const csvString = [
            headers.map(escapeCsv).join(','),
            ...rows.map(row => row.map(escapeCsv).join(','))
        ].join('\n');

        const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvString);
        const link = document.createElement('a');
        link.href = csvContent;
        link.download = `deeplink_history_${Date.now()}.csv`;
        link.click();
    } else if (format === 'xlsx') {
        const wb = XLSX.utils.book_new();

        // History Sheet
        const historyData = history.map(h => ({ URL: h.url, Count: h.count, Date: new Date(h.timestamp).toLocaleString() }));
        const wsHistory = XLSX.utils.json_to_sheet(historyData);
        XLSX.utils.book_append_sheet(wb, wsHistory, "History");

        // Schemas Sheet
        const schemasData = savedSchemas.map(s => ({ Name: s.name, Scheme: s.scheme }));
        const wsSchemas = XLSX.utils.json_to_sheet(schemasData);
        XLSX.utils.book_append_sheet(wb, wsSchemas, "Schemas");

        XLSX.writeFile(wb, `deeplink_data_${Date.now()}.xlsx`);
    } else if (format === 'share') {
        // Share as markdown text
        let text = `# Deeplink Data\n\n## Schemas\n`;
        savedSchemas.forEach(s => text += `- **${s.name}**: \`${s.scheme}\`\n`);
        text += `\n## History\n`;
        history.forEach(h => text += `- ${h.url} (${h.count})\n`);

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Deeplink Config',
                    text: text,
                });
            } catch (err) {
                console.error(err);
            }
        } else {
            navigator.clipboard.writeText(text);
            showToast("Copied to clipboard", "success");
        }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const text = await file.text();
        const json = JSON.parse(text);

        if (json.type !== 'deeplink-export') {
            alert("Invalid file format.");
            return;
        }

        // Import Schemas
        if (json.schemas && Array.isArray(json.schemas)) {
            // Merge logic: Add if ID doesn't exist, update if it does?
            // Simple approach: Save all (overwrite by ID)
            await saveAllSchemas(json.schemas);
        }

        // Import History
        if (json.history && Array.isArray(json.history)) {
            for (const item of json.history) {
                await saveDeeplink(item.url); // This updates timestamp/count, might not exact match import but good enough
            }
        }

        await loadHistory();
        await loadSchemas();
        showToast("Import successful!", "success");

    } catch (err) {
        console.error("Import failed", err);
        showToast("Import failed", "error");
    } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };


  return (
    <div className="min-h-screen">
      <Header title={t.deeplinkOpener.title}>
         <div className="flex items-center gap-2 mr-2">
            <span className={`text-xs font-medium ${isAdvancedMode ? 'text-orange-500' : styles.textSecondary}`}>{t.deeplinkOpener.advanced}</span>
            <button
              onClick={toggleAdvancedMode}
              className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${isAdvancedMode ? 'bg-orange-500' : 'bg-neutral-600/50'}`}
            >
               <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isAdvancedMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
         </div>
      </Header>

      <PageTransition className="px-4 md:px-8 pb-4 md:pb-8 pt-20 md:pt-24 max-w-3xl mx-auto">

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
                onChange={(e) => handleMainInputChange(e.target.value)}
                placeholder={t.deeplinkOpener.placeholder}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500/50 transition-all ${styles.glassInput}`}
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
                    className="flex-1 sm:flex-none p-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center animate-in zoom-in duration-300"
                  >
                    <ExternalLink className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleShareLink}
                    title={t.deeplinkOpener.share}
                    className={`flex-1 sm:flex-none p-3 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center border animate-in zoom-in duration-300 ${styles.glassButton} ${styles.border}`}
                  >
                    <Share2 className="w-6 h-6" />
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

          {/* Advanced Mode Builder */}
          {isAdvancedMode && (
             <div className="mt-6 pt-6 border-t border-dashed border-white/10 animate-in slide-in-from-top-4 fade-in duration-300">
                <div className="grid gap-4">
                    {/* Schema Selector */}
                    <div>
                        <label className={`text-xs font-medium mb-1 block ${styles.textSecondary}`}>{t.deeplinkOpener.schemaPreset}</label>
                        <div className="relative">
                            <select
                                value={selectedSchemaId}
                                onChange={(e) => handleSchemaSelect(e.target.value)}
                                className={`w-full p-3 rounded-xl border outline-none appearance-none cursor-pointer ${styles.glassInput} ${styles.border}`}
                            >
                                <option value="" className="text-black bg-white">{t.deeplinkOpener.selectPreset}</option>
                                {savedSchemas.map(s => (
                                    <option key={s.id} value={s.id} className="text-black bg-white">
                                        {s.name} ({s.scheme})
                                    </option>
                                ))}
                                <option disabled>──────────</option>
                                <option value="add_new" className="text-orange-600 font-bold bg-white">{t.deeplinkOpener.addNew}</option>
                            </select>
                            <ChevronDown className={`absolute right-3 top-3.5 w-5 h-5 pointer-events-none ${styles.textSecondary}`} />
                        </div>
                    </div>

                    {/* Schema Input */}
                    <div>
                        <label className={`text-xs font-medium mb-1 block ${styles.textSecondary}`}>{t.deeplinkOpener.schema}</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={schemeComponent}
                                onChange={(e) => handleSchemaChange(e.target.value)}
                                placeholder="e.g. twitter"
                                className={`flex-1 p-3 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500/50 ${styles.glassInput}`}
                            />
                            {schemeComponent && (
                                <button
                                    onClick={handleSaveSchema}
                                    title={t.deeplinkOpener.saveAsPreset}
                                    className={`p-3 rounded-xl border hover:bg-white/10 transition-colors ${styles.border} ${styles.glassButton}`}
                                >
                                    <Save className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Host Input */}
                    <div>
                        <label className={`text-xs font-medium mb-1 block ${styles.textSecondary}`}>{t.deeplinkOpener.hostPath}</label>
                        <input
                            type="text"
                            value={hostComponent}
                            onChange={(e) => handleHostChange(e.target.value)}
                            placeholder="e.g. post?id=123"
                            className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500/50 ${styles.glassInput}`}
                        />
                    </div>

                    {/* Params Builder */}
                    <div>
                         <label className={`text-xs font-medium mb-2 block ${styles.textSecondary}`}>{t.deeplinkOpener.queryParams}</label>
                         <div className="space-y-2">
                             {paramsComponent.map((param) => (
                                 <div key={param.id} className="flex gap-2 items-center animate-in slide-in-from-left-2 fade-in">
                                     <GripVertical className={`w-4 h-4 cursor-grab active:cursor-grabbing ${styles.textSecondary}`} />
                                     <input
                                         type="text"
                                         value={param.key}
                                         onChange={(e) => handleParamChange(param.id, 'key', e.target.value)}
                                         placeholder={t.deeplinkOpener.key}
                                         className={`flex-1 min-w-0 p-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-orange-500/50 ${styles.glassInput}`}
                                     />
                                     <span className={styles.textSecondary}>=</span>
                                     <input
                                         type="text"
                                         value={param.value}
                                         onChange={(e) => handleParamChange(param.id, 'value', e.target.value)}
                                         placeholder={t.deeplinkOpener.value}
                                         className={`flex-1 min-w-0 p-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-orange-500/50 ${styles.glassInput}`}
                                     />
                                     <button
                                         onClick={() => removeParam(param.id)}
                                         className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                     >
                                         <X className="w-4 h-4" />
                                     </button>
                                 </div>
                             ))}

                             <button
                                 onClick={addParam}
                                 className={`w-full py-2 rounded-lg border border-dashed flex items-center justify-center gap-2 text-sm transition-colors hover:bg-white/5 ${styles.border} ${styles.textSecondary}`}
                             >
                                 <Plus className="w-4 h-4" />
                                 {t.deeplinkOpener.addParam}
                             </button>
                         </div>
                    </div>
                </div>
             </div>
          )}
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
                className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full shadow-lg transition-all hover:bg-red-600 hover:scale-110 z-10"
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

        {/* Export / Import Actions */}
        <div className="mt-12 pt-8 flex justify-center pb-8">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                className="hidden"
            />
            <div className={`flex items-center backdrop-blur-xl border rounded-2xl p-2 gap-1 shadow-2xl ${styles.glassPanel}`}>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Import JSON"
                    className="p-3 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                    <Upload size={20} />
                </button>

                <div className="w-px h-8 bg-white/10 mx-2"></div>

                <button
                    onClick={() => exportData('csv')}
                    title="Export CSV"
                    className={`p-3 hover:text-white hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95 ${styles.textSecondary}`}
                >
                    <FileSpreadsheet size={20} />
                </button>
                <button
                    onClick={() => exportData('json')}
                    title="Export JSON"
                    className={`p-3 hover:text-white hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95 ${styles.textSecondary}`}
                >
                    <FileJson size={20} />
                </button>
                <button
                    onClick={() => exportData('xlsx')}
                    title="Export Excel"
                    className={`p-3 hover:text-white hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95 ${styles.textSecondary}`}
                >
                    <Sheet size={20} />
                </button>

                <div className="w-px h-8 bg-white/10 mx-2"></div>

                <button
                    onClick={() => exportData('share')}
                    title="Share Config"
                    className="p-3 text-green-500 hover:text-green-400 hover:bg-green-500/10 rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                    <Share2 size={20} />
                </button>
            </div>
        </div>

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
