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
 * 완독으로 티어가 올랐을 때만 표시 — 목업: 흰 카드 브루탈리스트 승급 알림
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
            aria-labelledby="tier-promotion-code"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-md bg-white border-2 border-black overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 z-20 text-black hover:bg-gray-100 p-1 rounded-full transition-colors"
              aria-label="모달 닫기"
            >
              <X size={18} />
            </button>

            <div className="relative p-6 pt-10 flex flex-col items-center text-center">
              <div className={cn("absolute inset-0 opacity-10", gradientClass)} aria-hidden />
              <div
                className="absolute top-0 left-0 w-full h-full opacity-5 mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"
                aria-hidden
              />

              <div className="relative z-10 w-full">
                <div className="flex items-center justify-center gap-1.5 mb-4">
                  <div className="h-0.5 w-6 bg-black" />
                  <p className="text-[9px] font-mono font-black text-black uppercase tracking-[0.25em]">
                    Level Up
                  </p>
                  <div className="h-0.5 w-6 bg-black" />
                </div>

                <h2
                  id="tier-promotion-code"
                  className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-0.5 leading-tight px-1"
                >
                  <span className={cn("bg-clip-text text-transparent", gradientClass)}>
                    {codeLabel}
                  </span>
                </h2>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-6">
                  {koLabel}
                </p>

                <div className="w-24 h-24 mx-auto mb-6 relative">
                  <div
                    className={cn(
                      "absolute inset-0 rounded-full opacity-20 blur-lg animate-[spin_12s_linear_infinite]",
                      gradientClass
                    )}
                    aria-hidden
                  />
                  <div className="absolute inset-1.5 rounded-full bg-white flex items-center justify-center border-2 border-black">
                    <span className={cn("text-3xl font-black bg-clip-text text-transparent", gradientClass)}>
                      {codeInitial}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 mb-6">
                  <p className="text-gray-600 text-xs font-medium break-keep">
                    누적 독서량{" "}
                    <span className="text-black font-black">{completedCount}권</span> 달성
                  </p>
                  <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">
                    새로운 독서의 경지에 오르셨습니다.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-black text-white font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors border-2 border-black active:translate-y-px"
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
