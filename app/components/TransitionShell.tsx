
"use client";

import { usePathname } from "next/navigation";
import { HomeScreen } from "./dock/HomeScreen";
import { AnimatePresence, motion } from "framer-motion";
import { getApps } from "@/app/utils/apps";
import { useLanguage } from "@/app/hooks/useLanguage";
import { useEffect, useState } from "react";

export function TransitionShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const apps = getApps(t);

  // Identify active app
  const activeApp = apps.find((app) => pathname.startsWith(app.href));
  const isHome = pathname === "/";

  // Prevent hydration mismatch by ensuring we only animate after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Defer the setMounted to avoid synchronous setState warning and ensure we are client-side
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return <div className="bg-neutral-950 min-h-screen">{children}</div>;

  return (
    <div className="relative min-h-screen bg-neutral-950 overflow-hidden">
      {/*
         1. The Home Screen is ALWAYS rendered in the background.
         It manages its own state of "fading out" icons via the prop passed down.
      */}
      <HomeScreen />

      {/*
         2. The Content (App) expands on top.
      */}
      <AnimatePresence mode="popLayout">
        {!isHome && activeApp && (
          <motion.div
            layoutId={`app-icon-bg-${activeApp.id}`}
            className="absolute inset-0 z-50 bg-neutral-950 overflow-y-auto"
            initial={{ borderRadius: 24 }}
            animate={{ borderRadius: 0 }}
            exit={{ borderRadius: 24, opacity: 0, transition: { duration: 0.2 } }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
            }}
          >
             {/* Optional: Add a Close button if the app doesn't have one,
                 though ideally the app has its own navigation.
                 For now, we just render the children (the page content).
                 We wrap children in a fade-in to smooth the content appearance
                 after the container expands.
             */}
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.1 }}
               className="min-h-screen"
             >
                {/*
                  We inject a back button logic or just let the page handle it?
                  The user said "returning to the previous screen".
                  We can add a subtle "Home" button if needed, but browser back works.
                */}
                <div className="relative">
                     {/*
                        Global Back/Close Button for the App Mode
                        Positioned fixed or sticky to ensure user can always exit
                        if the app UI is missing navigation.
                     */}
                     {/* <button
                        onClick={() => router.push('/')}
                        className="fixed top-4 right-4 z-[60] p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors backdrop-blur-md"
                     >
                        <X size={20} />
                     </button> */}

                    {children}
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
