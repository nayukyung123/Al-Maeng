"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchReviews } from "@/api/bookDetail";
import ReviewInput from "./ReviewInput";
import ReviewList from "./ReviewList";
import type { Review } from "@/types/book";

interface ReviewSectionProps {
  slug: string;
  /** 도서 상세에서 전달받은 총 리뷰 수 (Mock 값) */
  reviewCount: number;
}

export default function ReviewSection({
  slug,
  reviewCount,
}: ReviewSectionProps) {
  /* ── 리뷰 목록 조회 ── */
  const {
    data: reviews = [],
    isLoading,
    isError,
  } = useQuery<Review[]>({
    queryKey: ["reviews", slug],
    queryFn: () => fetchReviews(slug),
  });

  return (
    <section className="max-w-4xl mx-auto">
      {/* 섹션 헤더 */}
      <h3 className="text-3xl font-black mb-12 flex items-center gap-3">
        Readers&apos; Notes{" "}
        <span className="text-[#4D41FF] font-mono">
          {reviewCount.toLocaleString()}
        </span>
      </h3>

      {/* 리뷰 입력 박스 */}
      <ReviewInput slug={slug} />

      {/* 리뷰 목록 */}
      {isLoading && (
        <div className="space-y-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-6 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-3 bg-gray-100 rounded w-1/4" />
                <div className="h-3 bg-gray-100 rounded w-1/6" />
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p className="text-red-400 text-sm font-medium text-center py-12">
          리뷰를 불러오는 중 오류가 발생했습니다.
        </p>
      )}

      {!isLoading && !isError && (
        <ReviewList reviews={reviews} slug={slug} />
      )}
    </section>
  );
}
