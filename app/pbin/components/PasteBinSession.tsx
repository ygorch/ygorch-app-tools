'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/app/lib/supabase';
import { useLanguage } from '@/app/hooks/useLanguage';
import Editor from './Editor';
import { addHistory } from '@/app/lib/pastebin-db';
import { Save, Share2, ArrowLeft, Loader2, Check, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PasteBinSession({ id }: { id: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateLocalHistory = useCallback(async (id: string, content: any) => {
    let title = id;
    // Try to extract title from first paragraph
    try {
        if (content?.content?.[0]?.content?.[0]?.text) {
            title = content.content[0].content[0].text.substring(0, 30);
        }
    } catch (_) {
      // ignore
    }
    await addHistory(id, title);
  }, []);

  // Load data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured() || !supabase) {
        setError('Supabase is not configured. Saving is disabled.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
            .from('paste_bins')
            .select('content, updated_at')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
            console.error('Error fetching paste:', error);
            setError('Error loading session.');
        } else if (data) {
            setContent(data.content);
            setLastSaved(new Date(data.updated_at));
            // Update history
            updateLocalHistory(id, data.content);
        } else {
            // Not found, treat as new (empty). Will be created on first save.
            setContent({});
        }
      } catch (err) {
        console.error('Unexpected error loading paste:', err);
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, updateLocalHistory]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const save = useCallback(async (newContent: any) => {
    if (!isSupabaseConfigured() || !supabase) {
        setError('Cannot save: Configuration missing.');
        return;
    }

    setSaving(true);
    setError(null);

    try {
        const { error } = await supabase
            .from('paste_bins')
            .upsert({
                id,
                content: newContent,
                updated_at: new Date().toISOString()
            });

        if (!error) {
            setLastSaved(new Date());
            setDirty(false);
            updateLocalHistory(id, newContent);
        } else {
            console.error('Error saving:', error);
            setError('Failed to save changes.');
        }
    } catch (err) {
        console.error('Unexpected error saving:', err);
        setError('Unexpected error while saving.');
    } finally {
        setSaving(false);
    }
  }, [id, updateLocalHistory]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (newContent: any) => {
    setContent(newContent);
    setDirty(true);

    // Debounce save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
        save(newContent);
    }, 5000); // 5 seconds
  };

  const handleManualSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    save(content);
  }, [content, save]);

  // Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            handleManualSave();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({
            title: 'Paste Bin',
            text: `Check out this paste: ${id}`,
            url,
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(url);
        alert(t.pasteBin?.linkCopied || 'Link copied!');
    }
  };

  const handleDelete = async () => {
      if (!isSupabaseConfigured() || !supabase) return;

      if (confirm('Are you sure you want to delete this session?')) {
          await supabase.from('paste_bins').delete().eq('id', id);
          router.push('/pbin');
      }
  };

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-screen text-white">
              <Loader2 className="animate-spin" />
          </div>
      );
  }

  return (
    <div className="min-h-screen pt-20 md:pt-24 px-4 max-w-5xl mx-auto pb-12">
        <header className="flex items-center justify-between mb-6 sticky top-0 z-20 bg-[#111111]/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-white/5">
            <div className="flex items-center gap-4">
                <Link href="/pbin" className="p-2 hover:bg-white/10 rounded-lg text-white/70 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-white font-mono tracking-wider">{id}</h1>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                        {error ? (
                            <span className="flex items-center gap-1 text-red-400">
                                <AlertTriangle size={10} /> {error}
                            </span>
                        ) : saving ? (
                            <span className="flex items-center gap-1 text-orange-400">
                                <Loader2 size={10} className="animate-spin" /> {t.pasteBin?.saving || 'Saving...'}
                            </span>
                        ) : dirty ? (
                            <span className="text-yellow-500">• Unsaved changes</span>
                        ) : lastSaved ? (
                            <span className="flex items-center gap-1 text-green-400">
                                <Check size={10} /> {t.pasteBin?.saved || 'Saved'}
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={handleManualSave}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/70 transition-colors hidden sm:block disabled:opacity-50"
                    title="Save (Ctrl+S)"
                    disabled={!!error}
                >
                    <Save size={20} />
                </button>
                <button
                    onClick={handleShare}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/70 transition-colors"
                    title={t.pasteBin?.share || 'Share'}
                >
                    <Share2 size={20} />
                </button>
                <button
                    onClick={handleDelete}
                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors ml-2 disabled:opacity-50"
                    title={t.pasteBin?.delete || 'Delete'}
                    disabled={!!error}
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </header>

        <div className="bg-[#1a1a1a] rounded-xl border border-white/5 min-h-[60vh] shadow-2xl overflow-hidden">
            <Editor content={content} onChange={handleChange} />
        </div>
    </div>
  );
}
