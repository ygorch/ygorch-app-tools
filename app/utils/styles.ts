
import React from 'react';

export const PATTERNS = [
  { name: 'dots', css: 'radial-gradient(var(--pattern-color) 1px, transparent 1px)', size: '20px 20px' },
  { name: 'grid', css: 'linear-gradient(var(--pattern-color) 1px, transparent 1px), linear-gradient(90deg, var(--pattern-color) 1px, transparent 1px)', size: '20px 20px' },
  { name: 'lines', css: 'repeating-linear-gradient(45deg, var(--pattern-color) 0, var(--pattern-color) 1px, transparent 0, transparent 50%)', size: '10px 10px' },
  { name: 'zigzag', css: 'linear-gradient(135deg, var(--pattern-color) 25%, transparent 25%), linear-gradient(225deg, var(--pattern-color) 25%, transparent 25%), linear-gradient(45deg, var(--pattern-color) 25%, transparent 25%), linear-gradient(315deg, var(--pattern-color) 25%, transparent 25%)', size: '20px 20px' },
  { name: 'triangles', css: 'conic-gradient(from 150deg at 50% 33%, var(--pattern-color) 60deg, transparent 0)', size: '20px 20px' },
];

export const SOLID_COLORS = [
  '#0a0a0a', // Dark Neutral
  '#171717', // Neutral 900
  '#1e1b4b', // Indigo 950
  '#312e81', // Indigo 900
  '#4c1d95', // Violet 900
  '#881337', // Rose 900
  '#f8fafc', // Slate 50 (Light)
  '#f0f9ff', // Sky 50 (Light)
  '#fff1f2', // Rose 50 (Light)
];

// Helper to get text color based on background brightness
export function getTextColor(hex: string) {
    // Simple check for light colors
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? 'text-black' : 'text-white';
}
