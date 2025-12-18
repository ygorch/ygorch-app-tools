import React from 'react';

interface ColorPickerProps {
  selectedColor: string;
  onSelect: (colorClass: string) => void;
}

const COLORS = [
  { name: 'Red', class: 'bg-red-500' },
  { name: 'Orange', class: 'bg-orange-500' },
  { name: 'Amber', class: 'bg-amber-500' },
  { name: 'Yellow', class: 'bg-yellow-500' },
  { name: 'Lime', class: 'bg-lime-500' },
  { name: 'Green', class: 'bg-green-500' },
  { name: 'Emerald', class: 'bg-emerald-500' },
  { name: 'Teal', class: 'bg-teal-500' },
  { name: 'Cyan', class: 'bg-cyan-500' },
  { name: 'Sky', class: 'bg-sky-500' },
  { name: 'Indigo', class: 'bg-indigo-500' },
  { name: 'Violet', class: 'bg-violet-500' },
  { name: 'Purple', class: 'bg-purple-500' },
  { name: 'Fuchsia', class: 'bg-fuchsia-500' },
  { name: 'Pink', class: 'bg-pink-500' },
  { name: 'Rose', class: 'bg-rose-500' },
  { name: 'Slate', class: 'bg-slate-500' },
];

export function ColorPicker({ selectedColor, onSelect }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((color) => {
        const isSelected = selectedColor === color.class;
        return (
          <button
            key={color.name}
            type="button"
            onClick={() => onSelect(color.class)}
            className={`w-8 h-8 rounded-full border-2 transition-transform ${
              isSelected ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
            } ${color.class}`}
            aria-label={color.name}
          />
        );
      })}
    </div>
  );
}
