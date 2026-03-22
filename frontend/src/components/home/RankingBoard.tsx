"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchBookRankings, RANK_TAB_MAP } from "@/api/books";
import type { Book } from "@/types/home";

const RANK_TABS = ["완독순", "찜한순", "조회순"] as const;
type RankTab = (typeof RANK_TABS)[number];

export default function RankingBoard() {
  const router = useRouter();
  const [rankTab, setRankTab] = useState<RankTab>("완독순");

  // 🟢 실제 API — GET /api/books/rankings?type={rankTab}&period=ALL_TIME
  // rankTab 변경 시 queryKey가 바뀌어 자동 리패치
  const { data: books = [], isLoading } = useQuery<Book[]>({
    queryKey: ["bookRankings", rankTab],
    queryFn: () => fetchBookRankings(rankTab),
    staleTime: 5 * 60 * 1000,
  });

  const handleBookClick = (book: Book) => {
    router.push(`/books/${book.id}`);
  };

  // 로딩 스켈레톤 5개
  const skeleton = Array.from({ length: 5 });

  return (
    <section className="pt-12 border-t border-black">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">인기 도서 랭킹</h2>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="정렬 기준">
          {RANK_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={rankTab === tab}
              onClick={() => setRankTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                rankTab === tab
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 overflow-hidden">
        {isLoading
          ? skeleton.map((_, i) => (
              <div key={i} className="flex flex-col animate-pulse">
                <div className="w-full aspect-[2/3] bg-gray-100 mb-3" />
                <div className="h-4 bg-gray-100 rounded mb-2 w-3/4" />
                <div className="h-3 bg-gray-50 rounded w-1/2" />
              </div>
            ))
          : books.slice(0, 5).map((book, i) => (
              <div
                key={book.id}
                className="flex flex-col group cursor-pointer"
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
                  <div className="absolute top-2 left-2 w-7 h-7 bg-black text-white text-xs font-black flex items-center justify-center">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-bold text-base leading-tight mb-1 line-clamp-1">
                  {book.title}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-1">{book.author}</p>
              </div>
            ))}
      </div>
    </section>
  );
}
