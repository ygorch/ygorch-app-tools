
import React from 'react';

export const PATTERNS = [
  { name: 'dots', css: 'radial-gradient(var(--pattern-color) 1px, transparent 1px)', size: '20px 20px' },
  { name: 'grid', css: 'linear-gradient(var(--pattern-color) 1px, transparent 1px), linear-gradient(90deg, var(--pattern-color) 1px, transparent 1px)', size: '20px 20px' },
  { name: 'lines', css: 'repeating-linear-gradient(45deg, var(--pattern-color) 0, var(--pattern-color) 1px, transparent 0, transparent 50%)', size: '10px 10px' },
  { name: 'zigzag', css: 'linear-gradient(135deg, var(--pattern-color) 25%, transparent 25%), linear-gradient(225deg, var(--pattern-color) 25%, transparent 25%), linear-gradient(45deg, var(--pattern-color) 25%, transparent 25%), linear-gradient(315deg, var(--pattern-color) 25%, transparent 25%)', size: '20px 20px' },
  { name: 'triangles', css: 'conic-gradient(from 150deg at 50% 33%, var(--pattern-color) 60deg, transparent 0)', size: '20px 20px' },
  // New Patterns
  { name: 'checker', css: 'repeating-linear-gradient(45deg, var(--pattern-color) 25%, transparent 25%, transparent 75%, var(--pattern-color) 75%, var(--pattern-color)), repeating-linear-gradient(45deg, var(--pattern-color) 25%, transparent 25%, transparent 75%, var(--pattern-color) 75%, var(--pattern-color))', size: '20px 20px' },
  { name: 'diagonal-stripe', css: 'repeating-linear-gradient(45deg, var(--pattern-color), var(--pattern-color) 10px, transparent 10px, transparent 20px)', size: '20px 20px' },
  { name: 'vertical-stripe', css: 'repeating-linear-gradient(90deg, var(--pattern-color), var(--pattern-color) 10px, transparent 10px, transparent 20px)', size: '20px 20px' },
  { name: 'circles', css: 'radial-gradient(circle at 10px 10px, var(--pattern-color) 2px, transparent 0)', size: '20px 20px' },
  { name: 'squares', css: 'linear-gradient(45deg, var(--pattern-color) 25%, transparent 25%, transparent 75%, var(--pattern-color) 75%, var(--pattern-color))', size: '20px 20px' },
  { name: 'cross', css: 'radial-gradient(circle, transparent 20%, var(--pattern-color) 20%, var(--pattern-color) 80%, transparent 80%, transparent), radial-gradient(circle, transparent 20%, var(--pattern-color) 20%, var(--pattern-color) 80%, transparent 80%, transparent) 25px 25px', size: '50px 50px' },
  { name: 'waves', css: 'radial-gradient(circle at 100% 50%, transparent 20%, var(--pattern-color) 21%, var(--pattern-color) 34%, transparent 35%, transparent), radial-gradient(circle at 0% 50%, transparent 20%, var(--pattern-color) 21%, var(--pattern-color) 34%, transparent 35%, transparent) 0 -50px', size: '30px 100px' },
];

export const SOLID_COLORS = [
  // Dark Neutrals
  '#0a0a0a', '#171717', '#262626', '#404040', '#525252',
  // Light Neutrals
  '#fafafa', '#f5f5f5', '#e5e5e5', '#d4d4d4', '#a3a3a3',
  // Reds
  '#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d',
  // Oranges
  '#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12',
  // Yellows
  '#fefce8', '#fef9c3', '#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12',
  // Greens
  '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d',
  // Emerald
  '#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857', '#065f46', '#064e3b',
  // Teals
  '#f0fdfa', '#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a',
  // Cyans
  '#ecfeff', '#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63',
  // Sky
  '#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e',
  // Blues
  '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a',
  // Indigo
  '#eef2ff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81',
  // Violet
  '#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95',
  // Purple
  '#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87',
  // Fuchsia
  '#fdf4ff', '#fae8ff', '#f0abfc', '#e879f9', '#d946ef', '#c026d3', '#a21caf', '#86198f', '#701a75', '#4a044e',
  // Pink
  '#fdf2f8', '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843',
  // Rose
  '#fff1f2', '#ffe4e6', '#fecdd3', '#fda4af', '#fb7185', '#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337',
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
