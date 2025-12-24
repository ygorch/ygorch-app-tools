"use client";

import { Download, Trash2 } from "lucide-react";
import { useObjectUrl } from "../hooks/useObjectUrl";
import { useLanguage } from "../hooks/useLanguage";
import { getTextColor } from "../utils/styles";

interface HistoryItemProps {
  item: {
    id: string;
    timestamp: number;
    originalName: string;
    processedBlob: Blob;
    type: 'resize' | 'compress';
    details: string;
  };
  onDelete: (id: string) => void;
  isDark: boolean;
  styles: {
    glassPanel: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
  };
}

export function HistoryItem({ item, onDelete, isDark, styles }: HistoryItemProps) {
  const url = useObjectUrl(item.processedBlob);

  return (
    <div className={`p-4 rounded-xl flex items-center gap-4 group transition-all duration-300 border ${styles.glassPanel} hover:bg-white/5`}>
      <div className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border ${styles.border} bg-black/5`}>
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate transition-colors ${styles.textPrimary}`}>{item.originalName}</p>
        <p className={`text-xs ${styles.textSecondary}`}>
          {new Date(item.timestamp).toLocaleDateString()} • {item.type === 'resize' ? 'Resize' : 'Compress'}: {item.details}
        </p>
        <p className={`text-xs mt-1 ${styles.textSecondary}`}>{(item.processedBlob.size / 1024).toFixed(0)} KB</p>
      </div>
      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {url && (
            <a
              href={url}
              download={`history-${item.originalName}`}
              className="p-2 text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>
        )}
        <button
          onClick={() => onDelete(item.id)}
          className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
