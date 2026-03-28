"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getTierDisplayLabel,
  getTierKoreanName,
  getTierProgressGradientClass,
} from "@/lib/tierProgressGradient";

interface TierPromotionModalProps {
  open: boolean;
  tierName: string;
  /** 누적 완독 권수 (프로필 API `completedCount`) */
  completedCount: number;
  onClose: () => void;
}

/**
 * 완독으로 티어가 올랐을 때만 표시 — 목업: 다크 매거진 스타일 승급 알림
 */
export default function TierPromotionModal({
  open,
  tierName,
  completedCount,
  onClose,
}: TierPromotionModalProps) {
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

  const codeLabel = tierName.trim() ? getTierDisplayLabel(tierName) : "—";
  const koLabel = tierName.trim() ? getTierKoreanName(tierName) : "—";
  const gradientClass = getTierProgressGradientClass(tierName || null);
  const codeInitial = codeLabel.charAt(0).toUpperCase() || "?";

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tier-promotion-code"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-sm bg-[#050505] border border-gray-800 overflow-hidden shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-20 text-gray-400 hover:text-white transition-colors"
              aria-label="모달 닫기"
            >
              <X size={20} />
            </button>

            <div className="relative p-8 pt-12 flex flex-col items-center text-center">
              <div className={cn("absolute inset-0 opacity-20", gradientClass)} aria-hidden />
              <div
                className="absolute top-0 left-0 w-full h-full opacity-10 mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"
                aria-hidden
              />

              <div className="relative z-10 w-full">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="h-px w-8 bg-gray-700" />
                  <p className="text-[9px] font-mono text-gray-400 uppercase tracking-[0.3em]">
                    Level Up
                  </p>
                  <div className="h-px w-8 bg-gray-700" />
                </div>

                <h2
                  id="tier-promotion-code"
                  className="text-5xl font-black text-white uppercase tracking-tighter mb-1 leading-none"
                >
                  <span className={cn("bg-clip-text text-transparent", gradientClass)}>
                    {codeLabel}
                  </span>
                </h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-10">
                  {koLabel}
                </p>

                <div className="w-32 h-32 mx-auto mb-10 relative">
                  <div
                    className={cn(
                      "absolute inset-0 rounded-full opacity-30 blur-xl animate-[spin_12s_linear_infinite]",
                      gradientClass
                    )}
                    aria-hidden
                  />
                  <div className="absolute inset-2 rounded-full bg-black flex items-center justify-center border border-gray-800 shadow-inner">
                    <span className={cn("text-5xl font-black bg-clip-text text-transparent", gradientClass)}>
                      {codeInitial}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-10">
                  <p className="text-gray-300 text-sm font-medium break-keep">
                    누적 독서량{" "}
                    <span className="text-white font-black">{completedCount}권</span> 달성
                  </p>
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest">
                    새로운 독서의 경지에 오르셨습니다.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-4 bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-colors"
                >
                  계속 읽기
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
