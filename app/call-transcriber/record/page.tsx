"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Play, DownloadCloud, CheckCircle2, AlertCircle, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { usePreferences } from "../../hooks/usePreferences";
import { Header } from "../../components/ui/Header";
import { saveTranscription, CallTranscription } from "../../utils/transcriberDb";
import { v4 as uuidv4 } from "uuid";

// HuggingFace Transformers
import { env } from "@huggingface/transformers";

// Desativa cache local de Node e usa IndexedDB nativo do HF
env.allowLocalModels = false;
env.useBrowserCache = true;

const MODELS = [
  { id: "Xenova/whisper-tiny", name: "Tiny", size: "~75 MB", desc: "Mais rápido, menos preciso." },
  { id: "Xenova/whisper-base", name: "Base", size: "~145 MB", desc: "Equilíbrio entre velocidade e precisão." },
  { id: "Xenova/whisper-small", name: "Small", size: "~245 MB", desc: "Mais preciso, mas exige mais do dispositivo." }
];

export default function RecordPage() {
  const router = useRouter();
  const { preferences } = usePreferences();

  const [step, setStep] = useState<"config" | "recording" | "processing">("config");

  // Config State
  const [speaker1, setSpeaker1] = useState("Você");
  const [speaker2, setSpeaker2] = useState("Interlocutor");
  const [language, setLanguage] = useState("pt");
  const [modelId, setModelId] = useState("Xenova/whisper-tiny");
  const [modelStatus, setModelStatus] = useState<"idle" | "downloading" | "ready">("idle");
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Media Streams & Recorders
  const micStreamRef = useRef<MediaStream | null>(null);
  const sysStreamRef = useRef<MediaStream | null>(null);
  const micRecorderRef = useRef<MediaRecorder | null>(null);
  const sysRecorderRef = useRef<MediaRecorder | null>(null);

  // Audio Chunks
  const micChunksRef = useRef<Blob[]>([]);
  const sysChunksRef = useRef<Blob[]>([]);

  // Helpers
  const getTextColorClass = () => preferences?.theme === "dark" ? "text-white" : "text-black";
  const getBgClass = () => preferences?.theme === "dark" ? "bg-white/10" : "bg-black/5";
  const getBorderClass = () => preferences?.theme === "dark" ? "border-white/20" : "border-black/20";

  // Pre-download Model (Just to check/cache, using dummy instanciation or preload API if available,
  // but HF transformers loads on first pipeline call. We can create a dummy pipeline or just inform the user)
  const handlePreDownload = async () => {
    setModelStatus("downloading");
    try {
      // Lazy load pipeline
      const { pipeline } = await import("@huggingface/transformers");

      const transcriber = await pipeline("automatic-speech-recognition", modelId, {
        progress_callback: (info: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
          if (info.status === "progress") {
             // info.progress is a percentage (0-100)
             setDownloadProgress(Math.round(info.progress));
          }
        },
      });

      // Cleanup transcriber just to free memory, it's cached in IDB now
      await transcriber.dispose();
      setModelStatus("ready");
    } catch (err) {
      console.error("Error pre-downloading model:", err);
      setModelStatus("idle");
      alert("Falha ao baixar o modelo. Verifique sua conexão.");
    }
  };

  // Start Recording
  const startRecording = async () => {
    try {
      // 1. Request Mic
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStreamRef.current = micStream;

      // 2. Request System Audio (DisplayMedia)
      // Note: User MUST check "Share system audio" in the popup
      const sysStream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
      sysStreamRef.current = sysStream;

      // Check if system audio was actually shared
      const audioTracks = sysStream.getAudioTracks();
      if (audioTracks.length === 0) {
        alert("Atenção: Você não compartilhou o áudio do sistema. Por favor, tente novamente e marque &apos;Compartilhar áudio do sistema&apos;.");
        stopStreams();
        return;
      }

      // We only need the audio, so we can stop the video track to save resources
      sysStream.getVideoTracks().forEach(track => track.stop());

      // 3. Setup Recorders
      micChunksRef.current = [];
      sysChunksRef.current = [];

      micRecorderRef.current = new MediaRecorder(micStream, { mimeType: 'audio/webm' });
      sysRecorderRef.current = new MediaRecorder(sysStream, { mimeType: 'audio/webm' });

      micRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) micChunksRef.current.push(e.data);
      };

      sysRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) sysChunksRef.current.push(e.data);
      };

      // 4. Start
      micRecorderRef.current.start(1000);
      sysRecorderRef.current.start(1000);

      setIsRecording(true);
      setStep("recording");
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Handle user stopping display share natively
      sysStream.getVideoTracks()[0]?.addEventListener('ended', stopRecording);
      sysStream.getAudioTracks()[0]?.addEventListener('ended', stopRecording);

    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Permissões negadas ou recurso indisponível.");
      stopStreams();
    }
  };

  const stopStreams = () => {
    if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
    if (sysStreamRef.current) sysStreamRef.current.getTracks().forEach(t => t.stop());
  };

  // Stop Recording
  const stopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    setStep("processing");

    // Wrap recorder stops in promises
    const stopPromise = (recorder: MediaRecorder | null) => {
      return new Promise<void>((resolve) => {
        if (!recorder || recorder.state === 'inactive') return resolve();
        recorder.onstop = () => resolve();
        recorder.stop();
      });
    };

    await Promise.all([
      stopPromise(micRecorderRef.current),
      stopPromise(sysRecorderRef.current)
    ]);

    stopStreams();

    // Create Blobs
    const micBlob = new Blob(micChunksRef.current, { type: 'audio/webm' });
    const sysBlob = new Blob(sysChunksRef.current, { type: 'audio/webm' });

    // Save to IDB
    const newId = uuidv4();
    const newTranscription: CallTranscription = {
      id: newId,
      date: Date.now(),
      speaker1Name: speaker1 || "Locutor 1",
      speaker2Name: speaker2 || "Locutor 2",
      language,
      audioBlob1: micBlob,
      audioBlob2: sysBlob,
    };

    await saveTranscription(newTranscription);

    // Redirect to Processing / Result view
    router.replace(`/call-transcriber/${newId}`);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className={`min-h-screen ${getTextColorClass()}`}>
      <Header title="Nova Gravação" backUrl="/call-transcriber" />

      <main className="pt-24 pb-24 px-4 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">

          {step === "config" && (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Speakers Config */}
              <div className={`p-6 rounded-2xl border backdrop-blur-md ${getBgClass()} ${getBorderClass()}`}>
                <h3 className="text-xl font-serif mb-4 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-orange-500" /> Identificação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm opacity-70 mb-1">Seu Nome (Microfone)</label>
                    <input
                      type="text"
                      value={speaker1}
                      onChange={(e) => setSpeaker1(e.target.value)}
                      className={`w-full p-3 rounded-xl bg-transparent border focus:border-orange-500 focus:outline-none transition-colors ${getBorderClass()}`}
                      placeholder="Ex: João"
                    />
                  </div>
                  <div>
                    <label className="block text-sm opacity-70 mb-1">Nome do Interlocutor (Sistema)</label>
                    <input
                      type="text"
                      value={speaker2}
                      onChange={(e) => setSpeaker2(e.target.value)}
                      className={`w-full p-3 rounded-xl bg-transparent border focus:border-orange-500 focus:outline-none transition-colors ${getBorderClass()}`}
                      placeholder="Ex: Cliente, Maria"
                    />
                  </div>
                </div>
              </div>

              {/* Language Config */}
              <div className={`p-6 rounded-2xl border backdrop-blur-md ${getBgClass()} ${getBorderClass()}`}>
                 <h3 className="text-xl font-serif mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" /> Idioma da Chamada
                </h3>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={`w-full p-3 rounded-xl bg-transparent border focus:border-orange-500 focus:outline-none appearance-none ${getBorderClass()}`}
                >
                  <option value="auto" className="bg-neutral-900 text-white">Automático (Detectar)</option>
                  <option value="pt" className="bg-neutral-900 text-white">Português</option>
                  <option value="en" className="bg-neutral-900 text-white">Inglês</option>
                  <option value="es" className="bg-neutral-900 text-white">Espanhol</option>
                </select>
              </div>

              {/* Model Config */}
              <div className={`p-6 rounded-2xl border backdrop-blur-md ${getBgClass()} ${getBorderClass()}`}>
                <h3 className="text-xl font-serif mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-orange-500" /> Qualidade da Transcrição
                </h3>
                <div className="space-y-3 mb-6">
                  {MODELS.map(model => (
                    <label
                      key={model.id}
                      className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${modelId === model.id ? 'border-orange-500 bg-orange-500/10' : getBorderClass()} hover:bg-white/5`}
                    >
                      <input
                        type="radio"
                        name="model"
                        value={model.id}
                        checked={modelId === model.id}
                        onChange={() => { setModelId(model.id); setModelStatus("idle"); }}
                        className="mt-1 mr-3 accent-orange-500 w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs opacity-60 bg-black/20 px-2 py-1 rounded-md">{model.size}</span>
                        </div>
                        <p className="text-sm opacity-70">{model.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="bg-black/20 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-medium mb-1">Download do Modelo (Opcional)</p>
                    <p className="text-xs opacity-70">Baixe antes para evitar esperas na hora de transcrever. Ocorrerá apenas na primeira vez.</p>
                  </div>

                  {modelStatus === "idle" && (
                    <button onClick={handlePreDownload} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                      <DownloadCloud className="w-5 h-5" />
                    </button>
                  )}
                  {modelStatus === "downloading" && (
                    <div className="text-sm font-bold text-orange-500">{downloadProgress}%</div>
                  )}
                  {modelStatus === "ready" && (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  )}
                </div>
              </div>

              {/* Start Action */}
              <button
                onClick={startRecording}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-medium text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-orange-500/20"
              >
                <Play className="w-5 h-5" /> Iniciar Captura de Áudio
              </button>
              <p className="text-center text-xs opacity-50 mt-4">
                O navegador pedirá permissão para compartilhar tela. Selecione &quot;Aba do Navegador&quot; ou &quot;Tela Cheia&quot; e **marque a opção &quot;Compartilhar áudio do sistema&quot;**.
              </p>
            </motion.div>
          )}

          {step === "recording" && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                <div className="w-32 h-32 bg-red-500/20 border-4 border-red-500 rounded-full flex items-center justify-center relative z-10">
                  <Mic className="w-12 h-12 text-red-500 animate-pulse" />
                </div>
              </div>

              <div className="text-5xl font-mono font-light mb-4 tabular-nums">
                {formatDuration(duration)}
              </div>
              <p className="text-lg opacity-70 mb-12">Gravando canais de áudio separadamente...</p>

              <button
                onClick={stopRecording}
                className="px-12 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-medium text-lg flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg shadow-red-500/20"
              >
                <Square className="w-5 h-5 fill-current" /> Parar Gravação
              </button>
            </motion.div>
          )}

          {step === "processing" && (
             <motion.div
               key="processing"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex flex-col items-center justify-center py-32 text-center"
             >
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6 mx-auto"></div>
                <h2 className="text-2xl font-serif mb-2">Processando Gravação</h2>
                <p className="opacity-70">Preparando arquivos de áudio, aguarde...</p>
             </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
