"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/app/utils/cn";
import { motion } from "framer-motion";

interface HeaderProps {
  title?: string;
  backUrl?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Header({ title, backUrl = "/", className, children }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center h-16 px-6",
        "bg-black/40 backdrop-blur-xl border-b border-white/5",
        className
      )}
    >
      <div className="flex items-center w-full max-w-6xl mx-auto relative justify-between">
        <div className="flex items-center">
          <Link
            href={backUrl}
            className="flex items-center text-neutral-400 hover:text-white transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Home</span>
          </Link>
        </div>

        {title && (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <span className="text-xl font-serif tracking-wide text-white/90">{title}</span>
            </div>
        )}

        <div className="flex items-center">
            {children}
        </div>
      </div>
    </motion.header>
  );
}
