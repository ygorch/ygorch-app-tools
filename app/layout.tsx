
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./hooks/useLanguage";
import { TransitionShell } from "./components/TransitionShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ygor's Tools",
  description: "A central hub for useful tools.",
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
          <TransitionShell>
            {children}
          </TransitionShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
