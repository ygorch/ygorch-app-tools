import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, className = '', onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-lg hover:bg-white/10 transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}
