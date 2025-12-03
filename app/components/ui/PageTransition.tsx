"use client";

import { motion } from "framer-motion";
import { cn } from "@/app/utils/cn";

export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} // Custom cubic bezier for that "premium" feel
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  );
}
