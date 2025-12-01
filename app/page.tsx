"use client";

import Link from "next/link";
import { Image } from "lucide-react";
import { useLanguage } from "./hooks/useLanguage";

export default function Home() {
  const { t } = useLanguage();

  const apps = [
    {
      id: "image-reducer",
      name: t.imageReducer.title,
      icon: <Image className="w-8 h-8 text-blue-200" />,
      // Glassmorphism style for the icon background
      color: "bg-white/5 backdrop-blur-xl border border-white/10 group-hover:bg-white/10 group-hover:border-white/20",
      href: "/image-reducer",
      notification: 0,
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center pt-32 px-4">
      <h1 className="text-3xl font-light tracking-wide mb-16 text-white text-center drop-shadow-lg">
        {t.hub.title}
      </h1>

      <div className="flex flex-wrap justify-center gap-8 w-full max-w-2xl">
        {apps.map((app) => (
          <Link key={app.id} href={app.href} className="flex flex-col items-center gap-4 group">
            <div
              className={`relative w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-blue-500/20 ${app.color}`}
            >
              {app.icon}
              {app.notification > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-neutral-900 shadow-md">
                  {app.notification}
                </div>
              )}
            </div>
            <div className="text-sm text-center font-medium text-gray-300 tracking-wide group-hover:text-white transition-colors duration-300">
              {app.name}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
