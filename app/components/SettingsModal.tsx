
"use client";

import { usePreferences } from "@/app/hooks/usePreferences";
import { PATTERNS, SOLID_COLORS } from "@/app/utils/styles";
import { Modal } from "./ui/Modal";
import { Upload, Image as ImageIcon, PaintBucket, Palette } from "lucide-react";
import imageCompression from "browser-image-compression";
import { useState } from "react";

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { preferences, updatePreferences } = usePreferences();
  const [activeTab, setActiveTab] = useState<'solid' | 'doodle' | 'image'>('solid');

  if (!preferences) return null;

  const handleColorSelect = (color: string) => {
    updatePreferences({ backgroundColor: color, backgroundType: 'solid' });
  };

  const handlePatternSelect = (patternName: string) => {
    updatePreferences({ backgroundPattern: patternName, backgroundType: 'doodle' });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      updatePreferences({ backgroundImage: compressedFile, backgroundType: 'image' });
    } catch (error) {
      console.error("Error processing background image", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customization">
      <div className="space-y-6">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
          <span className="text-white font-medium">Theme Mode</span>
          <div className="flex bg-black/30 p-1 rounded-lg">
            <button
              onClick={() => updatePreferences({ theme: 'dark' })}
              className={`px-4 py-1.5 rounded-md text-sm transition-colors ${preferences.theme === 'dark' ? 'bg-neutral-700 text-white' : 'text-neutral-400'}`}
            >
              Dark
            </button>
            <button
              onClick={() => updatePreferences({ theme: 'light' })}
              className={`px-4 py-1.5 rounded-md text-sm transition-colors ${preferences.theme === 'light' ? 'bg-white text-black' : 'text-neutral-400'}`}
            >
              Light
            </button>
          </div>
        </div>

        {/* Background Type Tabs */}
        <div>
            <label className="text-sm text-neutral-400 mb-3 block">Background Style</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
                <button onClick={() => { setActiveTab('solid'); updatePreferences({ backgroundType: 'solid' }); }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors ${activeTab === 'solid' ? 'bg-white/10 border-white/30 text-white' : 'border-transparent text-neutral-500 hover:bg-white/5'}`}>
                    <PaintBucket size={20} />
                    <span className="text-xs">Solid</span>
                </button>
                <button onClick={() => { setActiveTab('doodle'); updatePreferences({ backgroundType: 'doodle' }); }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors ${activeTab === 'doodle' ? 'bg-white/10 border-white/30 text-white' : 'border-transparent text-neutral-500 hover:bg-white/5'}`}>
                    <Palette size={20} />
                    <span className="text-xs">Patterns</span>
                </button>
                <button onClick={() => { setActiveTab('image'); updatePreferences({ backgroundType: 'image' }); }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors ${activeTab === 'image' ? 'bg-white/10 border-white/30 text-white' : 'border-transparent text-neutral-500 hover:bg-white/5'}`}>
                    <ImageIcon size={20} />
                    <span className="text-xs">Image</span>
                </button>
            </div>

            {/* Content per Tab */}
            <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                {activeTab === 'solid' && (
                    <div className="grid grid-cols-5 gap-3">
                        {SOLID_COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => handleColorSelect(c)}
                                className={`w-10 h-10 rounded-full border-2 ${preferences.backgroundColor === c ? 'border-white scale-110' : 'border-transparent hover:border-white/50'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                )}

                {activeTab === 'doodle' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-5 gap-3 mb-4">
                             {/* Color Picker for Pattern Background */}
                            {SOLID_COLORS.slice(0, 5).map(c => (
                                <button
                                    key={c}
                                    onClick={() => updatePreferences({ backgroundColor: c })}
                                    className={`w-8 h-8 rounded-full border-2 ${preferences.backgroundColor === c ? 'border-white' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                             {PATTERNS.map(p => (
                                 <button
                                    key={p.name}
                                    onClick={() => handlePatternSelect(p.name)}
                                    className={`h-20 rounded-lg border overflow-hidden relative ${preferences.backgroundPattern === p.name ? 'border-white' : 'border-white/10'}`}
                                    style={{
                                        backgroundColor: preferences.backgroundColor,
                                        backgroundImage: p.css,
                                        backgroundSize: p.size,
                                        '--pattern-color': 'rgba(255,255,255,0.1)'
                                    } as any}
                                 >
                                    <span className="absolute bottom-1 right-2 text-[10px] text-white/50 uppercase">{p.name}</span>
                                 </button>
                             ))}
                        </div>
                    </div>
                )}

                {activeTab === 'image' && (
                    <div className="text-center py-6">
                        <label className="cursor-pointer inline-flex flex-col items-center gap-3 p-6 border-2 border-dashed border-neutral-700 rounded-xl hover:bg-white/5 transition-colors">
                            <Upload size={24} className="text-neutral-400" />
                            <span className="text-sm text-neutral-300">Upload Background Image</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                        {preferences.backgroundImage && (
                            <div className="mt-4 text-xs text-green-400">Image loaded</div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </Modal>
  );
}
