"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchContentRecommendations } from "@/api/recommendations";
import type { ContentRecommendationItem } from "@/types/home";

interface ContentCurationProps {
  /** HomeClient가 관리 — 배너 클릭과 동기화 */
  curationIndex: number;
  onCurationChange: (index: number) => void;
}

export default function ContentCuration({
  curationIndex,
  onCurationChange,
}: ContentCurationProps) {
  const router = useRouter();

  const { data: curations = [] } = useQuery<ContentRecommendationItem[]>({
    queryKey: ["contentRecommendations"],
    queryFn: fetchContentRecommendations,
    staleTime: 10 * 60 * 1000,
  });

  if (curations.length === 0) return null;

  const current = curations[curationIndex % curations.length];

  const prevCuration = () =>
    onCurationChange(
      (curationIndex - 1 + curations.length) % curations.length
    );
  const nextCuration = () =>
    onCurationChange((curationIndex + 1) % curations.length);

  const handleBookClick = (slug: string) => {
    router.push(`/books/${slug}`);
  };

  // 콘텐츠 타입 한글 레이블
  const typeLabel =
    current.content.type === "TV" ? "TV 시리즈" : "영화";

  return (
    <section id="section3" className="pt-12 border-t border-black">
      <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-12 uppercase italic">
        Extended Universe
      </h2>
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

          <div className="flex-1 aspect-[2/3] bg-black relative overflow-hidden">
            {current.content.posterUrl ? (
              <img
                src={current.content.posterUrl}
                alt={current.content.title}
                className="w-full h-full object-cover opacity-80 transition-opacity duration-500"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-white/40 text-sm font-medium px-4 text-center">
                  {current.content.title}
                </span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 p-4 md:p-6 text-white z-10 w-full bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-xs font-mono tracking-widest mb-2 text-[#0033FF]">
                {typeLabel}
              </p>
              <h3 className="text-2xl md:text-3xl font-bold line-clamp-2">
                {current.content.title}
              </h3>
            </div>
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

        {/* 설명 + 추천 도서 */}
        <div className="w-full md:w-2/3 flex flex-col justify-center gap-10">
          {current.content.description && (
            <p className="text-xl md:text-2xl font-medium leading-relaxed break-keep text-gray-800">
              {current.content.description}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {current.recommendedBooks.map((book) => (
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
    </section>
  );
}
