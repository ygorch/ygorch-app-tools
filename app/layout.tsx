
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./hooks/useLanguage";
import { PreferencesProvider } from "./hooks/usePreferences";
import { TransitionShell } from "./components/TransitionShell";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <PreferencesProvider>
            <TransitionShell>
              {children}
            </TransitionShell>
          </PreferencesProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
