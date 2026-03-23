"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, ExternalLink, Heart, BookmarkPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/useAuthStore";
import type { BookDetail } from "@/types/book";

interface BookDetailHeroProps {
  book: BookDetail;
}

export default function BookDetailHero({ book }: BookDetailHeroProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [isWishlisted, setIsWishlisted] = useState(false);

  /** 로그인 필요 동작 — 비로그인 시 로그인 페이지로 이동 */
  const requireAuth = (action: () => void) => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    action();
  };

  const coverSrc = book.coverImageUrl
    ? book.coverImageUrl
    : `https://picsum.photos/seed/${book.seed ?? book.id}/800/1200`;

  return (
    <section className="flex flex-col lg:flex-row gap-8 lg:gap-16 mb-12">
      {/* ── 좌측: 책 표지 ── */}
      <div className="w-full lg:w-[40%] bg-gray-50 aspect-square lg:aspect-auto lg:h-[450px] flex items-center justify-center p-6 rounded-sm">
        <div className="w-full max-w-[240px] aspect-[2/3] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] relative group">
          <img
            src={coverSrc}
            alt={book.title}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
        </div>
      </div>

      {/* ── 우측: 도서 정보 ── */}
      <div className="flex-1 flex flex-col justify-center py-4">
        {/* 장르 · 평점 뱃지 */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
            {book.genre}
          </span>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <div className="flex items-center gap-1">
            <Star size={12} fill="#111" className="text-black" />
            <span className="text-xs font-black">{book.averageRating.toFixed(1)}</span>
          </div>
        </div>

        {/* 제목 · 저자 */}
        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3 leading-[1.1] break-keep">
          {book.title}
        </h2>
        <p className="text-lg text-gray-400 font-serif italic mb-6">
          {book.author}
        </p>

        {/* 책 소개 */}
        <div className="text-sm leading-relaxed text-gray-600 mb-8 max-w-xl break-keep font-medium">
          {book.description}
        </div>

        {/* 구매 링크 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <a
            href={book.purchaseUrl ?? "https://www.aladin.co.kr"}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border border-black bg-white text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-3 group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            <img
              src="https://www.aladin.co.kr/favicon.ico"
              alt="Aladin"
              className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all"
              referrerPolicy="no-referrer"
            />
            <span>알라딘에서 구매하기</span>
            <ExternalLink size={12} className="ml-1" />
          </a>
        </div>

        {/* 액션 버튼: 찜하기 · 완독 리스트 */}
        <div className="flex gap-3">
          {/* 찜하기 (Heart) */}
          <button
            onClick={() => requireAuth(() => setIsWishlisted((prev) => !prev))}
            aria-label={isWishlisted ? "찜 해제" : "찜하기"}
            className={cn(
              "w-14 h-14 border border-gray-200 flex items-center justify-center transition-all",
              isWishlisted
                ? "bg-red-50 border-red-200 text-red-500"
                : "hover:border-black"
            )}
          >
            <Heart size={24} fill={isWishlisted ? "currentColor" : "none"} />
          </button>

          {/* 완독 리스트에 추가 */}
          <button
            onClick={() =>
              requireAuth(() => {
                // TODO: 완독 리스트 API 연동
                console.log("완독 리스트에 추가:", book.id);
              })
            }
            className="flex-1 bg-[#4D41FF] text-white font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#3D31EF] transition-all shadow-lg shadow-[#4D41FF]/20"
          >
            <BookmarkPlus size={20} />
            완독 리스트에 추가
          </button>
        </div>
      </div>
    </section>
  );
}
