
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { AppDefinition } from "@/app/utils/apps";
import { usePreferences } from "@/app/hooks/usePreferences";
import { getTextColor } from "@/app/utils/styles";

interface AppIconProps {
  app: AppDefinition;
  name: string;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export function AppIcon({ app, name, isActive, onClick }: AppIconProps) {
  const Icon = app.icon;
  const { preferences } = usePreferences();
  const textColor = preferences ? getTextColor(preferences.backgroundColor) : 'text-gray-300';

  return (
    <Link
      href={app.href}
      onClick={onClick}
      className={`flex flex-col items-center gap-4 group cursor-pointer ${isActive ? 'pointer-events-none' : ''}`}
    >
      <div className="relative w-24 h-24">
        {/* Animated Background/Container */}
        <motion.div
          layoutId={`app-icon-bg-${app.id}`}
          className={`absolute inset-0 rounded-3xl shadow-lg transition-colors duration-300 ${app.color} flex items-center justify-center`}
          initial={{ borderRadius: 24 }}
          style={{ borderRadius: 24 }}
          animate={{
             opacity: isActive ? 0 : 1,
             scale: isActive ? 1.2 : 1,
             borderRadius: 24
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
             {/* Icon */}
            <motion.div
                layoutId={`app-icon-symbol-${app.id}`}
                className="text-white"
            >
                <Icon className={`w-10 h-10 ${app.id === 'image-reducer' ? 'text-orange-200' : 'text-pink-200'}`} />
            </motion.div>

            {/* Notification Badge */}
            {app.notification !== undefined && app.notification > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-neutral-900 shadow-md">
                {app.notification}
                </div>
            )}
        </motion.div>
      </div>

      {/* Label */}
      <motion.div
        animate={{ opacity: isActive ? 0 : 1 }}
        className={`text-lg text-center font-serif tracking-wide transition-colors duration-300 ${textColor} group-hover:opacity-80`}
      >
        {name}
      </motion.div>
    </Link>
  );
}
