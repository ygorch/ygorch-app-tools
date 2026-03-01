import { Image, Gift, Smartphone, FileText, Mic } from "lucide-react";

export interface AppDefinition {
  id: string;
  icon: React.ElementType; // Lucide icon component
  href: string;
  color: string;
  translationKey: 'imageReducer' | 'wishlist' | 'deeplinkOpener' | 'pasteBin' | 'callTranscriber'; // Key to look up in translations
  notification?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export const getApps = (t: any): AppDefinition[] => [
  {
    id: "image-reducer",
    translationKey: "imageReducer",
    icon: Image,
    color: "bg-white/5 backdrop-blur-xl border border-white/10 group-hover:bg-white/10 group-hover:border-white/20",
    href: "/ireducer",
    notification: 0,
  },
  {
    id: "wishlist",
    translationKey: "wishlist",
    icon: Gift,
    color: "bg-white/5 backdrop-blur-xl border border-white/10 group-hover:bg-white/10 group-hover:border-white/20",
    href: "/wishlist",
    notification: 0,
  },
  {
    id: "deeplink-opener",
    translationKey: "deeplinkOpener",
    icon: Smartphone,
    color: "bg-white/5 backdrop-blur-xl border border-white/10 group-hover:bg-white/10 group-hover:border-white/20",
    href: "/deeplink",
    notification: 0,
  },
  {
    id: "paste-bin",
    translationKey: "pasteBin",
    icon: FileText,
    color: "bg-white/5 backdrop-blur-xl border border-white/10 group-hover:bg-white/10 group-hover:border-white/20",
    href: "/pbin",
    notification: 0,
  },
  {
    id: "call-transcriber",
    translationKey: "callTranscriber",
    icon: Mic,
    color: "bg-white/5 backdrop-blur-xl border border-white/10 group-hover:bg-white/10 group-hover:border-white/20",
    href: "/call-transcriber",
    notification: 0,
  },
];
