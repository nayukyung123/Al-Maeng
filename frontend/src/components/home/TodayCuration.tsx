"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Shuffle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import Link from "next/link";
import { fetchTodayRecommendations } from "@/api/recommendations";
import { ALL_BOOKS } from "@/data/books";
import useAuthStore from "@/store/useAuthStore";
import LimitPopup from "./LimitPopup";
import type { Book } from "@/types/home";

interface TodayCurationProps {
  /** HomeClient에서 내려주는 ref — 스크롤 감지용 */
  sectionRef?: React.RefObject<HTMLDivElement | null>;
}

export default function TodayCuration({ sectionRef }: TodayCurationProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 이 컴포넌트가 마운트된 시각을 기록 — 캐시 데이터와 실제 fetch 구분에 사용
  const mountedAtRef = useRef(Date.now());

  const { data, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["todayRecommendations"],
    queryFn: fetchTodayRecommendations,
    enabled: isLoggedIn,
    // staleTime을 Infinity로 설정해 포커스/마운트 시 자동 재호출 방지
    // (백엔드가 호출마다 refreshCount를 증가시키므로 명시적 refetch만 허용)
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // 팝업은 마운트 이후 실제로 새로 받아온 응답에서만 열기
  // dataUpdatedAt이 mountedAt보다 이전이면 캐시 데이터이므로 무시
  useEffect(() => {
    if (data?.showPopup && dataUpdatedAt > mountedAtRef.current) {
      setShowLimitPopup(true);
    }
  }, [data, dataUpdatedAt]);

  // 비로그인 시 블러 뒤에 보여줄 플레이스홀더
  const placeholderBooks = useMemo(() => ALL_BOOKS.slice(0, 5) as Book[], []);

  const displayBooks: Book[] = isLoggedIn
    ? (data?.books ?? [])
    : placeholderBooks;

  const refreshCount = data?.refreshCount ?? 0;
  const isFallback = data?.isFallback ?? false;

  const handleRefreshClick = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleBookClick = (book: Book) => {
    router.push(`/books/${book.slug}`);
  };

  return (
    <section ref={sectionRef}>
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-baseline gap-4 flex-wrap">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-black">
            Today&apos;s Curation
          </h2>
          {isFallback ? (
            /* 맞춤 추천 데이터 없음 → 인기 도서 폴백 배지 */
            <span className="flex items-center gap-1 text-sm font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-0.5 rounded-full">
              <Shuffle size={13} aria-hidden="true" />
              인기 도서
            </span>
          ) : (
            <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              THIS IS FOR YOU
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleRefreshClick}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-black hover:text-white transition-all rounded-full border border-black/5 text-sm font-bold group disabled:opacity-50 disabled:pointer-events-none"
          aria-label={`새로고침 (${refreshCount}회)`}
        >
          <RotateCcw
            size={16}
            aria-hidden="true"
            className={`transition-transform duration-500 ${
              isRefreshing
                ? "animate-spin"
                : refreshCount > 0
                ? "group-hover:rotate-180"
                : ""
            }`}
          />
          <span>새로고침 ({refreshCount}회)</span>
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
          {displayBooks.map((book, i) => (
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

      {/* 팝업: 백엔드 popupMessage를 그대로 전달 */}
      <LimitPopup
        isOpen={showLimitPopup}
        onClose={() => setShowLimitPopup(false)}
        message={data?.popupMessage}
      />
    </section>
  );
}
