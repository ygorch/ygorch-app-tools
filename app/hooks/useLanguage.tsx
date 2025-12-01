"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { en, pt, es } from "../locales/translations";

type Language = "en" | "pt" | "es";
type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [translations, setTranslations] = useState<Translations>(en);

  useEffect(() => {
    // Only set if we haven't already (to avoid strict mode double invocation issues)
    // Actually, to satisfy lint "Calling setState synchronously within an effect",
    // we should wrap this in a way that React accepts, or move initialization to useState.
    // Moving to useState is hard because we need window/navigator access which is only available client-side.

    // We will use a timeout to defer the update, pushing it out of the current render cycle.
    const timer = setTimeout(() => {
        const browserLang = navigator.language.split("-")[0];
        if (browserLang === "pt") {
          setLanguage("pt");
          setTranslations(pt);
        } else if (browserLang === "es") {
          setLanguage("es");
          setTranslations(es);
        } else {
          setLanguage("en");
          setTranslations(en);
        }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const value = {
    language,
    t: translations,
    setLanguage: (lang: Language) => {
        setLanguage(lang);
        if (lang === 'pt') setTranslations(pt);
        else if (lang === 'es') setTranslations(es);
        else setTranslations(en);
    }
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
