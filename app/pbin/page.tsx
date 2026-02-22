'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/hooks/useLanguage';
import { generateId } from '@/app/utils/id-generator';
import { getHistory } from '@/app/lib/pastebin-db';
import { Plus, Search, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function PasteBinHome() {
  const { t } = useLanguage();
  const router = useRouter();
  const [code, setCode] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    getHistory().then((items) => {
      // Sort by date descending
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sorted = items.sort((a: any, b: any) => b.lastAccess - a.lastAccess);
      setHistory(sorted);
    });
  }, []);

  const handleNewSession = () => {
    const id = generateId();
    router.push(`/pbin/${id}`);
  };

  const handleOpenSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length > 0) {
      router.push(`/pbin/${code.trim()}`);
    }
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24 px-4 max-w-4xl mx-auto pb-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-serif mb-4 text-white">
          {t.pasteBin?.title || 'Paste Bin'}
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto mb-8">
          <button
            onClick={handleNewSession}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors cursor-pointer"
          >
            <Plus size={20} />
            {t.pasteBin?.newSession || 'New Session'}
          </button>
        </div>

        <div className="max-w-xs mx-auto">
            <form onSubmit={handleOpenSession} className="w-full relative">
                <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t.pasteBin?.enterCode || 'Enter code'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition-colors pl-10 text-center"
                maxLength={5}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <button
                    type="submit"
                    disabled={!code}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 p-1.5 rounded-lg hover:bg-white/20 disabled:opacity-0 transition-opacity cursor-pointer"
                >
                    <ExternalLink size={16} />
                </button>
            </form>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-xl font-medium text-white/70 flex items-center gap-2">
            <Clock size={20} />
            {t.pasteBin?.history || 'History'}
        </h2>

        {history.length === 0 ? (
            <p className="text-white/30 text-center py-8 bg-white/5 rounded-xl border border-white/5">
                {t.pasteBin?.noHistory || 'No history yet'}
            </p>
        ) : (
            <div className="grid gap-3">
                {history.map((item) => (
                    <Link
                        key={item.id}
                        href={`/pbin/${item.id}`}
                        className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 p-4 rounded-xl transition-all group"
                    >
                        <div>
                            <div className="font-medium text-white group-hover:text-orange-400 transition-colors">
                                {item.title || item.id}
                            </div>
                            <div className="text-xs text-white/40 font-mono mt-1">
                                /${item.id} • {new Date(item.lastAccess).toLocaleDateString()} {new Date(item.lastAccess).toLocaleTimeString()}
                            </div>
                        </div>
                        <ExternalLink size={18} className="text-white/20 group-hover:text-white/70" />
                    </Link>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
