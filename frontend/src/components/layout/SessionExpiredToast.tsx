"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogIn, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * axios 인터셉터가 dispatch하는 "auth:session-expired" CustomEvent를 수신해
 * 서비스 스타일의 토스트를 표시하고 /login 으로 이동합니다.
 *
 * layout.tsx에 전역으로 마운트합니다.
 */
export default function SessionExpiredToast() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleSessionExpired = () => {
      setVisible(true);

      // 3초 후 자동으로 /login 이동
      timerRef.current = setTimeout(() => {
        setVisible(false);
        router.push("/login");
      }, 3000);
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [router]);

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
    router.push("/login");
  };

  return (
    <div
      className={cn(
        "fixed top-8 left-1/2 z-[200] flex w-full max-w-sm -translate-x-1/2 flex-col overflow-hidden rounded-lg border border-gray-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)] transition-all duration-300",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-3 pointer-events-none"
      )}
    >
      {/* 상단 포인트 바 */}
      <div className="h-1 w-full bg-black" />

      <div className="flex items-start gap-3 px-5 py-4">
        <LogIn size={17} className="shrink-0 mt-0.5 text-black" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black leading-snug tracking-tight">
            세션이 만료되었습니다
          </p>
          <p className="text-xs text-gray-400 font-medium mt-0.5 break-keep">
            다시 로그인해주세요. 잠시 후 로그인 페이지로 이동합니다.
          </p>
        </div>
        <button
          onClick={handleClose}
          aria-label="닫기"
          className="text-gray-300 hover:text-black transition-colors shrink-0"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
