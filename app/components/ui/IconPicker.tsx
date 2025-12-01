import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (iconName: string) => void;
}

const ICON_LIST = [
  'Gift', 'ShoppingBag', 'Heart', 'Star', 'Bookmark',
  'Smartphone', 'Laptop', 'Headphones', 'Camera', 'Watch',
  'Shirt', 'Footprints', 'Glasses', 'Home', 'Coffee',
  'Plane', 'Car', 'Bike', 'Music', 'Book'
];

export function IconPicker({ selectedIcon, onSelect }: IconPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
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
            className={`p-2 rounded-lg flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-blue-600 text-white shadow-lg scale-110'
                : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon size={20} />
          </button>
        );
      })}
    </div>
  );
}
