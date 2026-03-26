"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchContentRecommendations } from "@/api/recommendations";
import type { ContentRecommendationItem } from "@/types/home";

interface ContentCurationProps {
  /** 배너 클릭 시 HomeClient가 전달하는 contentId — null이면 첫 번째 항목 표시 */
  selectedContentId: number | null;
}

export default function ContentCuration({ selectedContentId }: ContentCurationProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: curations = [], isLoading } = useQuery<ContentRecommendationItem[]>({
    queryKey: ["contentRecommendations"],
    queryFn: fetchContentRecommendations,
    staleTime: 10 * 60 * 1000,
  });

  // 배너 클릭 시 해당 contentId와 일치하는 큐레이션으로 이동
  useEffect(() => {
    if (selectedContentId == null || curations.length === 0) return;
    const idx = curations.findIndex((c) => c.content.id === selectedContentId);
    if (idx >= 0) setCurrentIndex(idx);
  }, [selectedContentId, curations]);

  const current = curations[currentIndex] ?? null;

  const prevCuration = () =>
    setCurrentIndex((prev) => (prev - 1 + curations.length) % curations.length);
  const nextCuration = () =>
    setCurrentIndex((prev) => (prev + 1) % curations.length);

  const handleBookClick = (slug: string) => {
    router.push(`/books/${slug}`);
  };

  return (
    <section id="section3" className="pt-12 border-t border-black">
      <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-12 uppercase italic">
        Extended Universe
      </h2>

      {/* 로딩 스켈레톤 */}
      {isLoading && (
        <div className="flex flex-col md:flex-row gap-12 md:gap-24 animate-pulse">
          <div className="w-full md:w-1/3 shrink-0">
            <div className="aspect-[2/3] bg-gray-100 rounded-sm" />
          </div>
          <div className="w-full md:w-2/3 flex flex-col justify-center gap-8">
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 rounded w-2/3" />
              <div className="h-5 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="grid grid-cols-3 gap-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[2/3] bg-gray-100 rounded-sm" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 데이터 정상 표시 */}
      {!isLoading && current && (
        <div className="flex flex-col md:flex-row gap-12 md:gap-24">
          {/* 영상 포스터 + 네비게이션 */}
          <div className="w-full md:w-1/3 shrink-0 flex items-center gap-4">
            <button
              type="button"
              onClick={prevCuration}
              aria-label="이전 큐레이션"
              className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-gray-100 text-black rounded-full flex items-center justify-center hover:bg-[#0033FF] hover:text-white transition-all"
            >
              <ChevronLeft size={24} aria-hidden="true" />
            </button>

            <div className="flex-1 aspect-[2/3] bg-black relative overflow-hidden border border-black/5">
              {current.content.posterUrl ? (
                <img
                  src={current.content.posterUrl}
                  alt={current.content.title}
                  className="w-full h-full object-cover opacity-90 transition-opacity duration-500"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <span className="text-white/40 text-sm font-medium px-4 text-center">
                    {current.content.title}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={nextCuration}
              aria-label="다음 큐레이션"
              className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-gray-100 text-black rounded-full flex items-center justify-center hover:bg-[#0033FF] hover:text-white transition-all"
            >
              <ChevronRight size={24} aria-hidden="true" />
            </button>
          </div>

          {/* 타이틀 멘트 + 추천 도서 */}
          <div className="w-full md:w-2/3 flex flex-col justify-center gap-10">
            <div className="flex flex-col gap-4">
              <h3 className="text-4xl md:text-5xl font-black break-keep">
                <span className="relative inline-block">
                  <span className="relative z-10">{current.content.title}</span>
                  <span className="absolute bottom-1 left-0 w-full h-3 md:h-4 bg-[#0033FF]/20 z-0" />
                </span>
              </h3>
              <p className="text-lg md:text-xl text-gray-600 font-medium break-keep mt-2">
                이 작품을 재미있게 보셨다면,{" "}
                <span className="text-black font-bold">이런 책들은 어떠신가요?</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {current.recommendedBooks.slice(0, 3).map((book) => (
                <div
                  key={book.id}
                  className="group cursor-pointer"
                  onClick={() => handleBookClick(book.slug)}
                >
                  <div className="aspect-[2/3] bg-gray-100 mb-4 overflow-hidden">
                    {book.coverImageUrl ? (
                      <img
                        src={book.coverImageUrl}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center p-3">
                        <span className="text-xs text-gray-400 text-center line-clamp-4">
                          {book.title}
                        </span>
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-base mb-1 line-clamp-2 group-hover:text-[#0033FF] transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-sm text-gray-500">{book.author}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* API 응답은 왔지만 데이터가 없는 경우 */}
      {!isLoading && !current && (
        <p className="text-gray-400 text-sm font-medium py-12 text-center">
          추천 컨텐츠를 불러올 수 없습니다.
        </p>
      )}
    </section>
  );
}
