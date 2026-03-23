"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchContentRecommendations } from "@/api/recommendations";
import type { Banner, CurationBook } from "@/types/home";

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

  // 🟡 Mock API — GET /api/recommendations/contents
  const { data: curations = [] } = useQuery<Banner[]>({
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

  const handleBookClick = (book: CurationBook) => {
    router.push(`/books/${book.slug}`);
  };

  return (
    <section id="section3" className="pt-12 border-t border-black">
      <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-12 uppercase italic">
        Extended Universe
      </h2>
      <div className="flex flex-col md:flex-row gap-12 md:gap-24">
        {/* 영화 포스터 + 네비게이션 */}
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
            <img
              src={`https://picsum.photos/seed/${current.movieSeed}/800/1200`}
              alt={current.movie}
              className="w-full h-full object-cover opacity-80 transition-opacity duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-0 left-0 p-4 md:p-6 text-white z-10">
              <p className="text-xs font-mono tracking-widest mb-2 text-[#0033FF]">MOVIE</p>
              <h3 className="text-2xl md:text-3xl font-bold">{current.movie}</h3>
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

        {/* 인용구 + 추천 도서 */}
        <div className="w-full md:w-2/3 flex flex-col justify-center gap-10">
          <div>
            <p
              className="text-xl md:text-2xl font-medium leading-relaxed break-keep"
              dangerouslySetInnerHTML={{ __html: current.quote }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {current.books.map((book, i) => (
              <div
                key={i}
                className="group cursor-pointer"
                onClick={() => handleBookClick(book)}
              >
                <div className="aspect-[2/3] bg-gray-100 mb-4 overflow-hidden">
                  <img
                    src={`https://picsum.photos/seed/${book.seed}/400/600`}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h4 className="font-bold text-lg mb-2">{book.title}</h4>
                <p className="text-sm text-gray-600 leading-snug">{book.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
