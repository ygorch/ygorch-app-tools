import React from 'react';
import { usePreferences } from '@/app/hooks/usePreferences';
import { getTextColor } from '@/app/utils/styles';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const { preferences } = usePreferences();
  // Default to dark if preferences not loaded yet, or calculate based on bg color
  const isDark = preferences ? getTextColor(preferences.backgroundColor) === 'text-white' : true;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`
        ${isDark ? 'bg-neutral-900/90 border-white/10' : 'bg-white/90 border-black/10'}
        border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300
      `}>
        <div className={`
          p-4 border-b flex justify-between items-center
          ${isDark ? 'border-white/10' : 'border-black/10'}
        `}>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{title}</h2>
          <button
            onClick={onClose}
            className={`transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
