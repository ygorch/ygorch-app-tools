
import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./hooks/useLanguage";
import { PreferencesProvider } from "./hooks/usePreferences";
import { TransitionShell } from "./components/TransitionShell";
import { Analytics } from "@vercel/analytics/next";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ygor's Tools",
  description: "A central hub for useful tools.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${instrumentSerif.variable}`}>
      <body className="antialiased font-sans">
        <LanguageProvider>
          <PreferencesProvider>
            <TransitionShell>
              {children}
            </TransitionShell>
          </PreferencesProvider>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
