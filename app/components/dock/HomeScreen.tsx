
"use client";

import { useLanguage } from "@/app/hooks/useLanguage";
import { getApps } from "@/app/utils/apps";
import { AppIcon } from "./AppIcon";
import { usePathname } from "next/navigation";

export function HomeScreen() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const apps = getApps(t);

  // Check which app is active based on the URL
  const activeAppId = apps.find(app => pathname.startsWith(app.href))?.id;

  return (
    <main className="flex min-h-screen flex-col items-center pt-32 px-4 fixed inset-0 overflow-y-auto z-0">
      <h1 className="text-3xl font-light tracking-wide mb-16 text-white text-center drop-shadow-lg transition-opacity duration-300"
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
