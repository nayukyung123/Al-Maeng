"use client";

import { motion } from "motion/react";

type Variant = "newUser" | "hasCompletedBooks";

interface EmptyTicketStateProps {
  variant: Variant;
  primaryLabel: string;
  onPrimaryAction: () => void;
}

export function EmptyTicketState({
  variant,
  primaryLabel,
  onPrimaryAction,
}: EmptyTicketStateProps) {
  const copy =
    variant === "newUser"
      ? {
          title: "아직 아카이브된 티켓이 없어요.",
          desc: "당신을 울린 첫 번째 책을 찾아볼까요?",
        }
      : {
          title: "완독한 도서가 티켓을 기다리고 있어요!",
          desc: "나만의 감성을 담아 첫 티켓을 발급해보세요.",
        };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center px-6 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 260 }}
        className="w-full max-w-2xl pointer-events-auto"
      >
        <div className="relative bg-white border-2 border-dashed border-black/20 rounded-2xl p-10 md:p-14 shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

          <div className="relative flex flex-col items-center text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#0033FF]">
              Empty Archive
            </p>
            <h3 className="mt-4 text-2xl md:text-3xl font-black tracking-tight">
              {copy.title}
            </h3>
            <p className="mt-3 text-sm md:text-base text-gray-500 font-medium break-keep">
              {copy.desc}
            </p>

            <button
              type="button"
              onClick={onPrimaryAction}
              className="mt-10 w-full md:w-auto px-10 py-4 bg-black text-white text-xs md:text-sm font-black uppercase tracking-widest hover:bg-[#0033FF] transition-colors rounded-full"
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

