import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (iconName: string) => void;
}

const ICON_LIST = [
  'Gift', 'ShoppingBag', 'Heart', 'Star', 'Bookmark', 'Tag',
  'Smartphone', 'Laptop', 'Headphones', 'Camera', 'Watch',
  'Shirt', 'Footprints', 'Glasses', 'Home', 'Coffee',
  'Plane', 'Car', 'Bike', 'Music', 'Book',
  'Gamepad', 'Dumbbell', 'Utensils', 'Briefcase', 'GraduationCap',
  'Plane', 'Palmtree', 'Mountain', 'Tent', 'Rocket',
  'Wallet', 'CreditCard', 'PiggyBank', 'DollarSign', 'Coins'
];

const EMOJI_LIST = [
  '🎁', '🛍️', '💖', '⭐', '🔖', '🏷️',
  '📱', '💻', '🎧', '📷', '⌚',
  '👕', '👟', '🕶️', '🏠', '☕',
  '✈️', '🚗', '🚲', '🎵', '📚',
  '🎮', '🏋️', '🍴', '💼', '🎓',
  '🏝️', '⛰️', '⛺', '🚀',
  '👛', '💳', '🐷', '💵', '💰',
  '🎉', '🎂', '🎄', '🎃', '💍'
];

export function IconPicker({ selectedIcon, onSelect }: IconPickerProps) {
  const [tab, setTab] = useState<'icons' | 'emojis'>('icons');

  return (
    <div>
        <div className="flex gap-2 mb-4">
            <button
                type="button"
                onClick={() => setTab('icons')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === 'icons'
                    ? 'bg-neutral-700 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                }`}
            >
                Icons
            </button>
            <button
                type="button"
                onClick={() => setTab('emojis')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === 'emojis'
                    ? 'bg-neutral-700 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                }`}
            >
                Emojis
            </button>
        </div>

        {tab === 'icons' ? (
            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
            {ICON_LIST.map((iconName) => {
                // @ts-expect-error - Dynamic icon lookup
                const Icon = LucideIcons[iconName];
                if (!Icon) return null;

                const isSelected = selectedIcon === iconName;

                return (
                <button
                    key={iconName}
                    type="button"
                    onClick={() => onSelect(iconName)}
                    className={`p-2 rounded-lg flex items-center justify-center transition-all aspect-square ${
                    isSelected
                        ? 'bg-blue-600 text-white shadow-lg scale-110 ring-2 ring-blue-400'
                        : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                    }`}
                    title={iconName}
                >
                    <Icon size={20} />
                </button>
                );
            })}
            </div>
        ) : (
            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                {EMOJI_LIST.map((emoji) => {
                    const isSelected = selectedIcon === emoji;
                    return (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => onSelect(emoji)}
                            className={`p-2 rounded-lg flex items-center justify-center transition-all text-xl aspect-square ${
                            isSelected
                                ? 'bg-blue-600 text-white shadow-lg scale-110 ring-2 ring-blue-400'
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {emoji}
                        </button>
                    )
                })}
            </div>
        )}
    </div>
  );
}
