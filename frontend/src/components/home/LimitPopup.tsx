"use client";

import { useRouter } from "next/navigation";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LimitPopupProps {
  isOpen: boolean;
  onClose: () => void;
  /** 백엔드 popupMessage — null이면 기본 문구 사용 */
  message?: string | null;
}

export default function LimitPopup({ isOpen, onClose, message }: LimitPopupProps) {
  const router = useRouter();

  const handleNavigateToDiscover = () => {
    onClose();
    router.push("/discover");
  };

  const displayMessage =
    message ?? "취향에 맞는 책을 찾기 어려우신가요?";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* 팝업 본문 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-md p-8 md:p-10 border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="팝업 닫기"
              className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} aria-hidden="true" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#0033FF] text-white rounded-full flex items-center justify-center mb-6">
                <Sparkles size={32} aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-black mb-4 break-keep">
                {displayMessage}
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed break-keep">
                AI가 분석한{" "}
                <span className="text-[#0033FF] font-bold">맞춤형 추천 서비스</span>를
                이용해보시는 건 어떨까요?
              </p>
              <button
                type="button"
                onClick={handleNavigateToDiscover}
                className="w-full bg-black text-white py-4 font-black tracking-widest uppercase hover:bg-[#0033FF] transition-colors"
              >
                맞춤 추천 받기
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 text-sm text-gray-400 font-bold hover:text-black transition-colors"
              >
                나중에 하기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
