"use client";

import Link from "next/link";
import { Image, Wallet, GraduationCap, Coins, Globe, Network, Plus } from "lucide-react";
import { useLanguage } from "./hooks/useLanguage";

export default function Home() {
  const { t } = useLanguage();

  const apps = [
    {
      id: "image-reducer",
      name: t.imageReducer.title,
      icon: <Image className="w-8 h-8 text-white" />,
      color: "bg-blue-500",
      href: "/image-reducer",
      notification: 1,
    },
    // Placeholders based on screenshot to match layout feel
    {
      id: "world-card",
      name: "World Card",
      icon: <Wallet className="w-8 h-8 text-gray-600" />,
      color: "bg-gray-200",
      href: "#",
    },
    {
      id: "learn",
      name: "Learn",
      icon: <GraduationCap className="w-8 h-8 text-white" />,
      color: "bg-purple-500",
      href: "#",
    },
    {
      id: "add-money",
      name: "Add Money",
      icon: <Coins className="w-8 h-8 text-green-600" />,
      color: "bg-white border-2 border-dotted border-gray-300",
      href: "#",
    },
    {
      id: "worldcoin",
      name: "Worldcoin",
      icon: <Globe className="w-8 h-8 text-white" />,
      color: "bg-black",
      href: "#",
    },
    {
      id: "network",
      name: "Network",
      icon: <Network className="w-8 h-8 text-gray-600" />,
      color: "bg-gray-100",
      href: "#",
    },
    {
      id: "get-more",
      name: "Get more",
      icon: <Plus className="w-8 h-8 text-gray-600" />,
      color: "bg-gray-100",
      href: "#",
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center pt-20 px-4 bg-white">
      <h1 className="text-2xl font-bold mb-10 text-black">{t.hub.title}</h1>

      <div className="grid grid-cols-4 gap-6 w-full max-w-md">
        {apps.map((app) => (
          <Link key={app.id} href={app.href} className="flex flex-col items-center gap-2 group">
            <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 ${app.color}`}>
              {app.icon}
              {app.notification && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {app.notification}
                </div>
              )}
            </div>
            <div className="text-xs text-center font-medium text-gray-700">
              {app.name}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
