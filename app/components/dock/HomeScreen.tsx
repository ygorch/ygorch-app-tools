
"use client";

import { useLanguage } from "@/app/hooks/useLanguage";
import { getApps } from "@/app/utils/apps";
import { AppIcon } from "./AppIcon";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { useState } from "react";
import { SettingsModal } from "../SettingsModal";
import { usePreferences } from "@/app/hooks/usePreferences";
import { getTextColor } from "@/app/utils/styles";

export function HomeScreen() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { preferences } = usePreferences();
  const apps = getApps(t);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Check which app is active based on the URL
  const activeAppId = apps.find(app => pathname.startsWith(app.href))?.id;

  const textColor = preferences ? getTextColor(preferences.backgroundColor) : 'text-white';

  return (
    <main className="flex min-h-screen flex-col items-center pt-32 px-4 fixed inset-0 overflow-y-auto z-0">
      <button
        onClick={() => setIsSettingsOpen(true)}
        className={`fixed top-6 right-6 p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all z-20 ${activeAppId ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <Settings size={24} className={textColor} />
      </button>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <h1 className={`text-5xl font-serif tracking-wide mb-16 text-center drop-shadow-lg transition-all duration-300 ${textColor}`}
          style={{ opacity: activeAppId ? 0 : 1 }}>
        {t.hub.title}
      </h1>

      <div className="flex flex-wrap justify-center gap-8 w-full max-w-2xl">
        {apps.map((app) => {
           // We use the raw translation key mapping here.
           // Since we can't easily map dynamic strings in TS without explicit types,
           // we assume `t[app.translationKey].title` or similar exists.
           // Based on `page.tsx`: t.imageReducer.title

           // @ts-ignore
           const appName = t[app.translationKey]?.title || app.id;

           return (
            <AppIcon
                key={app.id}
                app={app}
                name={appName}
                isActive={activeAppId === app.id}
                onClick={() => {
                    // Logic handled by Link in AppIcon + Layout Shell
                }}
            />
           );
        })}
      </div>
    </main>
  );
}
