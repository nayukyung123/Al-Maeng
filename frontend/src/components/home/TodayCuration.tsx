"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import Link from "next/link";
import { fetchTodayRecommendations } from "@/api/recommendations";
import useAuthStore from "@/store/useAuthStore";
import LimitPopup from "./LimitPopup";
import type { Book } from "@/types/home";

const MAX_REFRESH = 10;

interface TodayCurationProps {
  /** HomeClient에서 내려주는 ref — 스크롤 감지용 */
  sectionRef?: React.RefObject<HTMLDivElement | null>;
}

export default function TodayCuration({ sectionRef }: TodayCurationProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [refreshCount, setRefreshCount] = useState(0);
  const [showLimitPopup, setShowLimitPopup] = useState(false);

  // 🟡 Mock API (인증 필요, enabled: isLoggedIn)
  const { data: books = [], refetch } = useQuery<Book[]>({
    queryKey: ["todayRecommendations"],
    queryFn: fetchTodayRecommendations,
    enabled: isLoggedIn,
    staleTime: 0, // 새로고침 때마다 재호출
  });

  const handleRefresh = async () => {
    if (refreshCount >= MAX_REFRESH) {
      setShowLimitPopup(true);
      return;
    }
    await refetch();
    setRefreshCount((prev) => prev + 1);
  };

  const handleRefreshClick = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    handleRefresh();
  };

  const handleBookClick = (book: Book) => {
    router.push(`/books/${book.id}`);
  };

  return (
    <section ref={sectionRef}>
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-baseline gap-4">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-black">
            Today&apos;s Curation
          </h2>
          <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            THIS IS FOR YOU
          </span>
        </div>
        <button
          type="button"
          onClick={handleRefreshClick}
          className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-black hover:text-white transition-all rounded-full border border-black/5 text-sm font-bold group"
          aria-label={`새로고침 (${refreshCount}/${MAX_REFRESH})`}
        >
          <RotateCcw
            size={16}
            aria-hidden="true"
            className={`transition-transform duration-500 ${
              refreshCount > 0 ? "group-hover:rotate-180" : ""
            }`}
          />
          <span>새로고침 ({refreshCount}/{MAX_REFRESH})</span>
        </button>
      </div>

      {/* 도서 목록 */}
      <div className="relative">
        <div
          className={`flex gap-6 overflow-x-auto pb-4 snap-x transition-all duration-700 ${
            !isLoggedIn ? "blur-md pointer-events-none select-none" : ""
          }`}
          style={{ scrollbarWidth: "none" }}
        >
          {books.map((book, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={`${book.id}-${refreshCount}`}
              className="snap-start shrink-0 w-[160px] md:w-[200px] group cursor-pointer"
              onClick={() => handleBookClick(book)}
            >
              <div className="w-full aspect-[2/3] bg-gray-100 mb-4 overflow-hidden border border-black/5 relative">
                <img
                  src={
                    book.coverImageUrl ||
                    `https://picsum.photos/seed/${book.seed || book.id}/400/600`
                  }
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-1 group-hover:text-[#0033FF] transition-colors">
                {book.title}
              </h3>
              <p className="text-sm text-gray-500">{book.author}</p>
            </motion.div>
          ))}
        </div>

        {/* 비로그인 블러 오버레이 */}
        {!isLoggedIn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/10">
            <div className="bg-white/80 backdrop-blur-md border border-black/5 p-8 md:p-12 text-center shadow-2xl rounded-sm">
              <p className="text-xl md:text-2xl font-black mb-6 break-keep">
                로그인 후 이용하실 수 있습니다
              </p>
              <Link
                href="/login"
                className="inline-block bg-black text-white px-8 py-3 font-black tracking-widest uppercase hover:bg-[#0033FF] transition-colors text-sm"
              >
                로그인 시작하기
              </Link>
            </div>
          </div>
        )}
      </div>

      <LimitPopup
        isOpen={showLimitPopup}
        onClose={() => setShowLimitPopup(false)}
      />
    </section>
  );
}
