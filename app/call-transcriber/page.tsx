"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mic, Plus, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

import { usePreferences } from "../hooks/usePreferences";
import { Header } from "../components/ui/Header";
import { getAllTranscriptions, deleteTranscription, CallTranscription } from "../utils/transcriberDb";

export default function CallTranscriberHome() {
  const { preferences } = usePreferences();
  const [transcriptions, setTranscriptions] = useState<CallTranscription[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTranscriptions = async () => {
    try {
      const data = await getAllTranscriptions();
      // Sort by newest first
      setTranscriptions(data.sort((a, b) => b.date - a.date));
    } catch (error) {
      console.error("Failed to load transcriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTranscriptions();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Deseja realmente excluir esta transcrição?")) {
      await deleteTranscription(id);
      loadTranscriptions();
    }
  };

  const getTextColorClass = () => {
    return preferences?.theme === "dark" ? "text-white" : "text-black";
  };

  const getSubTextColorClass = () => {
    return preferences?.theme === "dark" ? "text-white/60" : "text-black/60";
  };

  return (
    <div className={`min-h-screen ${getTextColorClass()}`}>
      <Header title="Call Transcriber" backUrl="/" />

      <main className="pt-20 md:pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-serif font-medium`}>
            Histórico de Chamadas
          </h2>
          <Link
            href="/call-transcriber/record"
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Gravação
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : transcriptions.length === 0 ? (
          <div className={`text-center py-16 ${getSubTextColorClass()}`}>
            <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Nenhuma chamada gravada ainda</p>
            <p className="text-sm">Clique em &quot;Nova Gravação&quot; para começar.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {transcriptions.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                >
                  <Link
                    href={`/call-transcriber/${t.id}`}
                    className="block p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group backdrop-blur-md"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className={`w-4 h-4 ${getSubTextColorClass()}`} />
                          <span className={`text-sm ${getSubTextColorClass()}`}>
                            {format(t.date, "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <h3 className="font-medium text-lg mb-1">
                          {t.title ? t.title : <>{t.speaker1Name} <span className="text-orange-500 mx-2">vs</span> {t.speaker2Name}</>}
                        </h3>
                        <div className="flex gap-2">
                           <span className="text-xs px-2 py-1 rounded-md bg-white/10">
                              Idioma: {t.language === 'auto' ? 'Automático' : t.language.toUpperCase()}
                           </span>
                           {t.mergedTranscriptionJson ? (
                               <span className="text-xs px-2 py-1 rounded-md bg-green-500/20 text-green-400">
                                   Transcrito
                               </span>
                           ) : (
                               <span className="text-xs px-2 py-1 rounded-md bg-orange-500/20 text-orange-400">
                                   Apenas Áudio
                               </span>
                           )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDelete(t.id, e)}
                        className={`p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all ${getSubTextColorClass()}`}
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
