"use client";

import { motion, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface AuthGateProps {
  isVisible: boolean;
  onClose: () => void;
}

/**
 * 로그인이 필요한 시점에 표시되는 글래스모피즘 팝업
 * 로그인 버튼 클릭 시 /login 페이지로 이동
 */
export default function AuthGate({ isVisible, onClose }: AuthGateProps) {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-white/10 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white w-full max-w-md p-12 border border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center"
          >
            {/* 자물쇠 아이콘 */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#0033FF] rounded-full flex items-center justify-center text-white shadow-lg">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-6 mt-4">
              TASTE FINDING
            </h2>

            <p className="text-sm text-gray-600 leading-relaxed mb-10 break-keep">
              당신의 취향을 분석하고 딱 맞는 책을 추천해드려요.
              <br />
              영화나 드라마 취향을 입력하고 나만의 텍스트 세계를 발견해보세요.
            </p>

            <button
              onClick={handleLogin}
              className="w-full bg-black text-white py-4 flex items-center justify-center gap-3 font-black text-sm tracking-widest uppercase hover:bg-[#0033FF] transition-colors"
            >
              로그인하고 결과 보기 <ArrowRight size={18} />
            </button>

            <button
              onClick={onClose}
              className="mt-6 text-xs font-bold text-gray-400 hover:text-black transition-colors"
            >
              돌아가기
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
