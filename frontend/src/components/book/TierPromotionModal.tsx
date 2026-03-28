"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, X } from "lucide-react";
import { getTierDisplayLabel } from "@/lib/tierProgressGradient";

interface TierPromotionModalProps {
  open: boolean;
  tierName: string;
  onClose: () => void;
}

/**
 * 완독으로 티어가 올랐을 때만 표시되는 축하 모달 (승급 전용)
 */
export default function TierPromotionModal({
  open,
  tierName,
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

  const label = tierName.trim() ? getTierDisplayLabel(tierName) : "—";

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="닫기"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tier-promotion-title"
            className="relative z-10 w-full max-w-md bg-white shadow-2xl border border-black/10 overflow-hidden"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-[#0033FF] via-[#4D41FF] to-[#0033FF]" />

            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 p-2 text-gray-400 hover:text-black transition-colors"
              aria-label="모달 닫기"
            >
              <X size={18} />
            </button>

            <div className="px-8 pt-10 pb-8 text-center">
              <motion.div
                className="inline-flex items-center justify-center mb-6"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 14 }}
              >
                <div className="relative">
                  <Trophy
                    className="w-16 h-16 text-[#0033FF]"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <motion.span
                    className="absolute -top-1 -right-1"
                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.12, 1] }}
                    transition={{
                      type: "tween",
                      repeat: Infinity,
                      duration: 2.2,
                      ease: "easeInOut",
                    }}
                  >
                    <Sparkles className="w-7 h-7 text-amber-400" aria-hidden />
                  </motion.span>
                </div>
              </motion.div>

              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#4D41FF] mb-2">
                Tier Up
              </p>
              <h2
                id="tier-promotion-title"
                className="text-2xl md:text-3xl font-black tracking-tight text-black mb-2"
              >
                축하합니다!
              </h2>
              <p className="text-sm text-gray-600 font-medium mb-6 break-keep">
                새로운 티어에 도달했어요.
              </p>

              <div className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white rounded-sm">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">
                  New tier
                </span>
                <span className="text-lg font-black tracking-tight">{label}</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="mt-10 w-full py-3.5 bg-[#0033FF] text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#0028CC] transition-colors"
              >
                확인
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
