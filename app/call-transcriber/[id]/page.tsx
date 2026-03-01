"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, Download, Play, Square, Loader2, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Header } from "../../components/ui/Header";
import { usePreferences } from "../../hooks/usePreferences";
import { getTranscriptionById, saveTranscription, CallTranscription } from "../../utils/transcriberDb";
import { processAndSyncAudioFiles } from "../../utils/audioProcessing";

// Use our object URL hook to prevent leaks
import { useObjectUrl } from "../../hooks/useObjectUrl";

export default function CallResultPage() {
  const { id } = useParams();
  const router = useRouter();
  const { preferences } = usePreferences();

  const [data, setData] = useState<CallTranscription | null>(null);
  const [loading, setLoading] = useState(true);

  const [transcriptionStatus, setTranscriptionStatus] = useState<string>('');
  const [worker, setWorker] = useState<Worker | null>(null);

  // Download Blobs
  const [wavMic, setWavMic] = useState<Blob | null>(null);
  const [wavSys, setWavSys] = useState<Blob | null>(null);

  // For audio playing
  const micUrl = useObjectUrl(wavMic);
  const sysUrl = useObjectUrl(wavSys);
  const micAudioRef = useRef<HTMLAudioElement>(null);
  const sysAudioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    try {
      if (typeof id !== 'string') return;

      const record = await getTranscriptionById(id);
      if (!record) {
        router.push("/call-transcriber");
        return;
      }

      setData(record);
      setLoading(false);

      // Convert WEBM Blobs to WAV Blobs immediately for download/playback
      const { wavBlob1, wavBlob2, audioDataForModel1, audioDataForModel2 } = await processAndSyncAudioFiles(record.audioBlob1, record.audioBlob2);

      setWavMic(wavBlob1);
      setWavSys(wavBlob2);

      // If it doesn't have JSON, start transcription worker
      if (!record.mergedTranscriptionJson) {
         startTranscriptionWorker(audioDataForModel1, audioDataForModel2, record);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const startTranscriptionWorker = (audio1: Float32Array, audio2: Float32Array, record: CallTranscription) => {
    // We only create worker once
    const newWorker = new Worker("/whisper-worker.js", { type: "module" });

    newWorker.onmessage = async (e) => {
      const msg = e.data;

      if (msg.status === 'loading' || msg.status === 'progress' || msg.status === 'transcribing' || msg.status === 'merging') {
        setTranscriptionStatus(msg.message);
      }
      else if (msg.status === 'error') {
        setTranscriptionStatus(`Erro: ${msg.message}`);
        console.error(msg.message);
      }
      else if (msg.status === 'ready') {
         // Model is ready, start transcription
         newWorker.postMessage({
           type: 'transcribe',
           modelId: "Xenova/whisper-tiny", // Standardize for now, can be read from prefs
           language: record.language,
           audioData1: audio1,
           audioData2: audio2,
           speaker1Name: record.speaker1Name,
           speaker2Name: record.speaker2Name
         });
      }
      else if (msg.status === 'complete') {
        const json = msg.result;

        // Update DB
        const updatedRecord = { ...record, mergedTranscriptionJson: json };
        await saveTranscription(updatedRecord);

        // Update UI
        setData(updatedRecord);
        setTranscriptionStatus('');

        // Cleanup Worker
        newWorker.terminate();
        setWorker(null);
      }
    };

    setWorker(newWorker);

    // Start by loading the model
    setTranscriptionStatus('Inicializando motor de IA (WebGPU)...');
    newWorker.postMessage({ type: 'load', modelId: "Xenova/whisper-tiny" });
  };

  const getTextColorClass = () => preferences?.theme === "dark" ? "text-white" : "text-black";
  const getSubTextColorClass = () => preferences?.theme === "dark" ? "text-white/60" : "text-black/60";
  const getBgClass = () => preferences?.theme === "dark" ? "bg-white/5" : "bg-black/5";
  const getBorderClass = () => preferences?.theme === "dark" ? "border-white/10" : "border-black/10";

  const handleDownloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    if (!data?.mergedTranscriptionJson) return;
    const blob = new Blob([data.mergedTranscriptionJson], { type: "application/json" });
    handleDownloadBlob(blob, `transcricao-${data.id.substring(0, 6)}.json`);
  };

  // Synchronized playback controls
  const togglePlay = () => {
    if (isPlaying) {
      micAudioRef.current?.pause();
      sysAudioRef.current?.pause();
      setIsPlaying(false);
    } else {
      // Sync them up
      if (micAudioRef.current && sysAudioRef.current) {
         micAudioRef.current.currentTime = 0;
         sysAudioRef.current.currentTime = 0;
         micAudioRef.current.play();
         sysAudioRef.current.play();
         setIsPlaying(true);
      }
    }
  };

  if (loading) {
     return <div className="min-h-screen flex justify-center items-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!data) return null;

  return (
    <div className={`min-h-screen ${getTextColorClass()}`}>
      <Header title="Resultado da Chamada" backUrl="/call-transcriber" />

      <main className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
           <div>
              <h2 className="text-2xl font-serif font-medium mb-1">
                {data.speaker1Name} <span className="text-orange-500 mx-2">vs</span> {data.speaker2Name}
              </h2>
              <p className={`text-sm ${getSubTextColorClass()}`}>
                Gravado em {new Date(data.date).toLocaleString('pt-BR')}
              </p>
           </div>

           {/* Player Controls */}
           {wavMic && wavSys && (
             <div className="mt-4 md:mt-0 flex gap-4">
                <button
                  onClick={togglePlay}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
                >
                  {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 ml-1" />}
                  {isPlaying ? "Parar Reprodução" : "Ouvir Chamada"}
                </button>
             </div>
           )}
        </div>

        {/* Hidden Audio Elements for Playback */}
        {micUrl && <audio ref={micAudioRef} src={micUrl} onEnded={() => setIsPlaying(false)} />}
        {sysUrl && <audio ref={sysAudioRef} src={sysUrl} />}

        {/* Transcription Panel */}
        <div className={`p-6 rounded-3xl border backdrop-blur-md ${getBgClass()} ${getBorderClass()}`}>
           <div className="flex items-center gap-2 mb-6">
             <Cpu className="w-5 h-5 text-orange-500" />
             <h3 className="text-xl font-serif">Transcrição Local (Whisper)</h3>
           </div>

           {!data.mergedTranscriptionJson ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                 <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                 <p className="font-medium text-lg mb-2">Processando Áudio Localmente</p>
                 <p className={`text-sm ${getSubTextColorClass()}`}>
                   {transcriptionStatus || "Preparando motor..."}
                 </p>
                 <p className="text-xs opacity-50 mt-6 max-w-md">
                   Isso pode levar alguns minutos dependendo do tamanho da chamada e do processador do seu dispositivo. Seus dados não saem do navegador (WebGPU).
                 </p>
              </div>
           ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                 {(() => {
                    const parsed = JSON.parse(data.mergedTranscriptionJson);
                    return parsed.transcription.map((t: any /* eslint-disable-line @typescript-eslint/no-explicit-any */, idx: number) => {
                      const isMic = t.speaker === data.speaker1Name;
                      return (
                        <div key={idx} className={`flex ${isMic ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl p-4 ${isMic ? 'bg-orange-500/20 text-orange-50 border border-orange-500/30' : 'bg-white/10 border border-white/20'}`}>
                             <div className="flex justify-between items-center mb-1">
                                <span className={`text-xs font-bold ${isMic ? 'text-orange-400' : 'text-neutral-400'}`}>{t.speaker}</span>
                                <span className="text-[10px] opacity-50">{t.start?.toFixed(1)}s</span>
                             </div>
                             <p className="text-sm leading-relaxed">{t.text}</p>
                          </div>
                        </div>
                      )
                    })
                 })()}
              </div>
           )}
        </div>

      </main>

      {/* Fixed Action Bar at Bottom */}
      <AnimatePresence>
        <motion.div
           initial={{ y: 100 }}
           animate={{ y: 0 }}
           className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none"
        >
          <div className="max-w-4xl mx-auto flex justify-center pointer-events-auto gap-4 flex-wrap">
            {wavMic && (
              <button
                onClick={() => handleDownloadBlob(wavMic, `mic-${data?.id.substring(0, 6)}.wav`)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border backdrop-blur-xl transition-all hover:bg-white/10 ${getBgClass()} ${getBorderClass()}`}
                title={`Baixar Áudio do ${data?.speaker1Name} (WAV)`}
              >
                 <Download className="w-4 h-4" /> <Mic className="w-4 h-4 opacity-50" />
              </button>
            )}

            {wavSys && (
              <button
                onClick={() => handleDownloadBlob(wavSys, `sys-${data?.id.substring(0, 6)}.wav`)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border backdrop-blur-xl transition-all hover:bg-white/10 ${getBgClass()} ${getBorderClass()}`}
                title={`Baixar Áudio do ${data?.speaker2Name} (WAV)`}
              >
                 <Download className="w-4 h-4" /> <Cpu className="w-4 h-4 opacity-50" />
              </button>
            )}

            {data?.mergedTranscriptionJson && (
              <button
                onClick={handleDownloadJSON}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-medium transition-transform active:scale-95 shadow-xl shadow-white/10"
              >
                 <Download className="w-4 h-4" /> Baixar Transcrição (JSON)
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
