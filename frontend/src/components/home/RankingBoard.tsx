"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchBookRankings, RANK_TYPE_MAP } from "@/api/books";
import type { Book } from "@/types/home";

/** 기간 탭 */
const PERIOD_TABS = ["전체", "주간"] as const;
type PeriodTab = (typeof PERIOD_TABS)[number];

/** 정렬 타입 탭 */
const TYPE_TABS = ["완독순", "찜한순", "조회순"] as const;
type TypeTab = (typeof TYPE_TABS)[number];

const PERIOD_MAP: Record<PeriodTab, string> = {
  전체: "ALL_TIME",
  주간: "WEEKLY",
};

export default function RankingBoard() {
  const router = useRouter();
  const [periodTab, setPeriodTab] = useState<PeriodTab>("전체");   // 기본: 전체
  const [typeTab, setTypeTab] = useState<TypeTab>("완독순");         // 기본: 완독순
  const rankScrollRef = useRef<HTMLDivElement>(null);
  const [canRankScrollLeft, setCanRankScrollLeft] = useState(false);
  const [canRankScrollRight, setCanRankScrollRight] = useState(false);

  const updateRankScrollArrows = useCallback(() => {
    const el = rankScrollRef.current;
    if (!el) return;
    setCanRankScrollLeft(el.scrollLeft > 4);
    setCanRankScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  const slideRankScroll = (dir: "left" | "right") => {
    const el = rankScrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "left" ? -(el.clientWidth * 0.7) : el.clientWidth * 0.7,
      behavior: "smooth",
    });
  };

  // 🟢 GET /api/books/rankings?period=ALL_TIME|WEEKLY&type=COMPLETED|FAVORITE|VIEW
  // 두 탭 모두 변경 시 queryKey가 바뀌어 자동 리패치
  const { data: books = [], isLoading } = useQuery<Book[]>({
    queryKey: ["bookRankings", periodTab, typeTab],
    queryFn: () => fetchBookRankings(PERIOD_MAP[periodTab], RANK_TYPE_MAP[typeTab]),
    staleTime: 5 * 60 * 1000,
  });

  const handleBookClick = (book: Book) => {
    router.push(`/books/${book.slug}?source=ranking`);
  };

  const skeleton = Array.from({ length: 5 });

  useEffect(() => {
    const el = rankScrollRef.current;
    if (!el) return;
    updateRankScrollArrows();
    el.addEventListener("scroll", updateRankScrollArrows, { passive: true });
    window.addEventListener("resize", updateRankScrollArrows);
    return () => {
      el.removeEventListener("scroll", updateRankScrollArrows);
      window.removeEventListener("resize", updateRankScrollArrows);
    };
  }, [books, isLoading, updateRankScrollArrows]);

  useEffect(() => {
    const el = rankScrollRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    queueMicrotask(updateRankScrollArrows);
  }, [periodTab, typeTab, isLoading, updateRankScrollArrows]);

  return (
    <section className="pt-12 border-t border-black">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        {/* 타이틀 + 기간 탭 (전체|주간) */}
        <div className="flex items-center gap-4">
          <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase italic text-black">
            TRENDING ON AL-MAENG
          </h2>

          <div className="flex items-center" role="tablist" aria-label="기간 선택">
            {PERIOD_TABS.map((tab, i) => (
              <span key={tab} className="flex items-center">
                <button
                  type="button"
                  role="tab"
                  aria-selected={periodTab === tab}
                  onClick={() => setPeriodTab(tab)}
                  className={`text-xs md:text-sm font-bold transition-colors px-1 ${
                    periodTab === tab
                      ? "text-black"
                      : "text-gray-300 hover:text-gray-500"
                  }`}
                >
                  {tab}
                </button>
                {i < PERIOD_TABS.length - 1 && (
                  <span className="text-gray-200 mx-1 select-none">|</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* 정렬 탭 (완독순|찜한순|조회순) */}
        <div className="flex gap-2" role="tablist" aria-label="정렬 기준">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={typeTab === tab}
              onClick={() => setTypeTab(tab)}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold transition-colors ${
                typeTab === tab
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div
          ref={rankScrollRef}
          className="flex md:grid md:grid-cols-5 gap-4 md:gap-6 overflow-x-auto md:overflow-visible pb-1 md:pb-0 snap-x snap-mandatory md:snap-none -mx-2 px-2 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {isLoading
            ? skeleton.map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col animate-pulse shrink-0 w-[min(31vw,118px)] sm:w-[min(36vw,150px)] md:w-auto snap-start"
                >
                  <div className="w-full aspect-[2/3] bg-gray-100 mb-3" />
                  <div className="h-4 bg-gray-100 rounded mb-2 w-3/4" />
                  <div className="h-3 bg-gray-50 rounded w-1/2" />
                </div>
              ))
            : books.slice(0, 5).map((book, i) => (
                <div
                  key={book.id}
                  className="flex flex-col group cursor-pointer shrink-0 w-[min(31vw,118px)] sm:w-[min(36vw,150px)] md:w-auto snap-start"
                  onClick={() => handleBookClick(book)}
                >
                  <div className="w-full aspect-[2/3] bg-gray-100 mb-3 overflow-hidden border border-black/5 relative">
                    <img
                      src={
                        book.coverImageUrl ||
                        `https://picsum.photos/seed/${book.id}/400/600`
                      }
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    {/* 순위 뱃지 */}
                    <div className="absolute top-2 left-2 w-6 h-6 md:w-7 md:h-7 bg-black text-white text-[10px] md:text-xs font-black flex items-center justify-center">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-bold text-sm md:text-base leading-tight mb-1 line-clamp-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-1">{book.author}</p>
                </div>
              ))}
        </div>

        {canRankScrollLeft && (
          <button
            type="button"
            aria-label="이전 랭킹 도서 보기"
            onClick={() => slideRankScroll("left")}
            className="absolute left-0 top-0 bottom-1 z-10 md:hidden flex items-center pl-1 pr-6 bg-gradient-to-r from-white via-white/70 to-transparent hover:from-white/90 transition-opacity"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-black/10 shadow-md hover:bg-black hover:text-white transition-colors">
              <ChevronLeft size={18} aria-hidden="true" />
            </span>
          </button>
        )}
        {canRankScrollRight && (
          <button
            type="button"
            aria-label="다음 랭킹 도서 보기"
            onClick={() => slideRankScroll("right")}
            className="absolute right-0 top-0 bottom-1 z-10 md:hidden flex items-center pr-1 pl-6 bg-gradient-to-l from-white via-white/70 to-transparent hover:from-white/90 transition-opacity"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-black/10 shadow-md hover:bg-black hover:text-white transition-colors">
              <ChevronRight size={18} aria-hidden="true" />
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
