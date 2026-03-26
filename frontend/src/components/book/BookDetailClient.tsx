"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { fetchBookDetail, logBookView } from "@/api/bookDetail";
import BookDetailHero from "./BookDetailHero";
import RecommendationList from "./RecommendationList";
import ReviewSection from "./ReviewSection";
import type { BookDetail } from "@/types/book";

interface BookDetailClientProps {
  slug: string;
}

export default function BookDetailClient({ slug }: BookDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loggedRef = useRef(false);

  // 페이지 진입 또는 도서 전환(Slug 변경) 시 스크롤을 맨 위로 초기화
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);

  /* ── 도서 상세 조회 ── */
  const {
    data: book,
    isLoading,
    isError,
  } = useQuery<BookDetail>({
    queryKey: ["book-detail", slug],
    queryFn: () => fetchBookDetail(slug),
    staleTime: 10 * 60 * 1000,
  });

  const source = searchParams.get("source") ?? "none";

  /* ── 도서 진입 시 조회 로그 전송 (1회만) ── */
  useEffect(() => {
    if (!book?.id || loggedRef.current) return;
    loggedRef.current = true;
    logBookView(book.id, source).catch(() => {});
  }, [book?.id, source]);

  /* ── 로딩 스켈레톤 ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white animate-pulse">
        <div className="max-w-6xl mx-auto pt-12 pb-24 px-6 md:px-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mb-12">
            <div className="w-full lg:w-[40%] lg:h-[450px] bg-gray-100 rounded-sm" />
            <div className="flex-1 space-y-4 py-4">
              <div className="h-3 bg-gray-100 rounded w-1/6" />
              <div className="h-10 bg-gray-100 rounded w-2/3" />
              <div className="h-5 bg-gray-100 rounded w-1/4" />
              <div className="space-y-2 mt-6">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
                <div className="h-3 bg-gray-100 rounded w-4/6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── 에러 상태 ── */
  if (isError || !book) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-400 text-lg font-medium">
            도서 정보를 불러오지 못했습니다.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-[#4D41FF] transition-all"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white animate-in slide-in-from-bottom duration-500">
      {/* ── 뒤로가기 버튼 ── */}
      <button
        onClick={() => router.back()}
        aria-label="뒤로가기"
        className="fixed top-8 right-8 z-[110] p-2 bg-white/80 backdrop-blur-sm rounded-full border border-black/10 hover:bg-black hover:text-white transition-all shadow-lg"
      >
        <X size={32} />
      </button>

      <div className="max-w-6xl mx-auto pt-12 pb-24 px-6 md:px-12">
        {/* ── 1. 도서 정보 히어로 ── */}
        <BookDetailHero book={book} source={source} />

        <hr className="border-gray-100 mb-12" />

        {/* ── 2. 유사 도서 추천 ── */}
        <RecommendationList slug={slug} />

        <hr className="border-gray-100 mb-20" />

        {/* ── 3. 리뷰 섹션 ── */}
        <ReviewSection slug={slug} />
      </div>
    </div>
  );
}
