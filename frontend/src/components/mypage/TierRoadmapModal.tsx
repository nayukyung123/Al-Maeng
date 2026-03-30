"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIER_ROADMAP, getTierRoadmapSpinePercent } from "@/lib/tierRoadmap";
import {
  getTierBadgeSolidClass,
  getTierDisplayLabel,
  getTierKoreanName,
} from "@/lib/tierProgressGradient";

interface TierRoadmapModalProps {
  open: boolean;
  onClose: () => void;
  completedCount: number;
  currentTierName: string | null;
}

/**
 * Rank Progression 안내 (마이페이지 Info)
 */
export default function TierRoadmapModal({
  open,
  onClose,
  completedCount,
  currentTierName,
}: TierRoadmapModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const currentCode = currentTierName
    ? getTierDisplayLabel(currentTierName)
    : "";
  const linePct = getTierRoadmapSpinePercent(currentCode, completedCount);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-0">
          <motion.div
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tier-roadmap-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="w-full max-w-md bg-white border-2 border-black rounded-none overflow-hidden relative flex flex-col max-h-[85vh] mt-auto md:mt-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-white shrink-0 z-20">
              <h3
                id="tier-roadmap-title"
                className="text-xl font-black uppercase tracking-tighter"
              >
                Rank Progression
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1 hover:bg-gray-100 transition-colors rounded-full"
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto overscroll-contain relative bg-white flex-1">
              <div className="relative ml-2">
                <div
                  className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-gray-200"
                  aria-hidden
                />
                <div
                  className="absolute left-[7px] top-4 w-0.5 bg-black transition-all duration-1000"
                  style={{ height: `${linePct}%` }}
                  aria-hidden
                />

                <div className="space-y-0">
                  {TIER_ROADMAP.map((tier) => {
                    const isCurrent = tier.code === currentCode;
                    const isPassed = completedCount >= tier.minBooks;
                    const textCls = getTierBadgeSolidClass(tier.code) ?? "text-gray-800";
                    const nameKo = getTierKoreanName(tier.code);

                    return (
                      <div
                        key={tier.code}
                        className={cn(
                          "relative pl-8 py-3.5 transition-all duration-300",
                          isCurrent ? "opacity-100 z-10" : isPassed ? "opacity-100" : "opacity-40"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute left-[3px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-all duration-500",
                            isCurrent
                              ? "bg-black ring-2 ring-offset-2 ring-black scale-110"
                              : isPassed
                                ? "bg-black"
                                : "bg-white border-2 border-gray-300"
                          )}
                          aria-hidden
                        />

                        <div
                          className={cn(
                            "flex items-center justify-between transition-all duration-300",
                            isCurrent
                              ? "bg-white border-2 border-black p-3 -mx-3 -my-3"
                              : "border-b border-gray-100 pb-3.5 -mb-3.5"
                          )}
                        >
                          <div className="flex flex-col text-left min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <h4
                                className={cn(
                                  "font-black text-lg tracking-tight",
                                  isPassed ? textCls : "text-gray-500"
                                )}
                              >
                                {nameKo}
                              </h4>
                              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
                                [{tier.code}]
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-mono mt-0.5">
                              {String(tier.minBooks).padStart(3, "0")} BOOKS
                            </p>
                          </div>
                          <div className="flex items-center shrink-0 ml-2">
                            {!isPassed ? (
                              <Lock size={14} className="text-gray-400" aria-hidden />
                            ) : isCurrent ? (
                              <span className="bg-black text-white text-[9px] font-black px-2 py-1 uppercase tracking-widest rounded-sm">
                                NOW
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
