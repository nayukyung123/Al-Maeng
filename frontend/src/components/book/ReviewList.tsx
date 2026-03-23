"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Edit2, Trash2, AlertCircle, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/useAuthStore";
import { deleteReview } from "@/api/bookDetail";
import type { Review } from "@/types/book";

interface ReviewListProps {
  reviews: Review[];
  slug: string;
  onEditRequest: (review: Review) => void;
}

export default function ReviewList({
  reviews,
  slug,
  onEditRequest,
}: ReviewListProps) {
  const queryClient = useQueryClient();
  const { isLoggedIn, user } = useAuthStore();

  /** 스포일러 리뷰 중 내용을 공개한 ID 집합 */
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const toggleSpoilerReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* ── 리뷰 삭제 Mutation ── */
  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", slug] });
    },
  });

  const handleDelete = (reviewId: string) => {
    if (!window.confirm("리뷰를 삭제할까요?")) return;
    deleteMutation.mutate(reviewId);
  };

  if (reviews.length === 0) {
    return (
      <p className="text-gray-400 text-sm font-medium text-center py-16">
        아직 작성된 리뷰가 없습니다. 첫 번째 리뷰를 남겨보세요!
      </p>
    );
  }

  return (
    <div className="space-y-12">
      {reviews.map((review, i) => {
        const isRevealed = revealedIds.has(review.id);
        const isOwner = isLoggedIn && user?.id === review.userId;

        const profileSrc = review.profileImageUrl
          ? review.profileImageUrl
          : `https://picsum.photos/seed/user${review.userId ?? i}/200/200`;

        /** 날짜 포매팅 */
        const formattedDate = new Date(review.createdAt).toLocaleDateString(
          "ko-KR",
          { year: "numeric", month: "2-digit", day: "2-digit" }
        );

        return (
          <div key={review.id} className="flex gap-6 group">
            {/* 프로필 아바타 */}
            <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-black/5">
              <img
                src={profileSrc}
                alt={review.nickname}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex-1">
              {/* 닉네임 · 날짜 · 편집 버튼 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-black text-sm">{review.nickname}</span>
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                    {formattedDate}
                  </span>
                </div>

                {/* 수정·삭제 버튼 — 본인 리뷰에만 표시, hover 시 나타남 */}
                {isOwner && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditRequest(review)}
                      aria-label="리뷰 수정"
                      className="p-2 text-gray-400 hover:text-black transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      disabled={deleteMutation.isPending}
                      aria-label="리뷰 삭제"
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* 별점 */}
              <div className="flex text-[#4D41FF] mb-4 gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={12}
                    fill={star <= review.rating ? "currentColor" : "none"}
                    strokeWidth={2}
                  />
                ))}
              </div>

              {/* 리뷰 본문 (스포일러 처리 포함) */}
              <div className="relative">
                <p
                  className={cn(
                    "text-gray-600 text-base leading-relaxed break-keep font-medium transition-all duration-500",
                    review.isSpoiler && !isRevealed && "blur-md select-none"
                  )}
                >
                  {review.content}
                </p>

                {/* 스포일러 오버레이 */}
                {review.isSpoiler && !isRevealed && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-lg">
                    <div className="flex items-center gap-2 text-red-600 font-bold text-sm mb-3">
                      <AlertCircle size={16} />
                      스포일러가 있는 리뷰입니다
                    </div>
                    <button
                      onClick={() => toggleSpoilerReveal(review.id)}
                      className="px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#4D41FF] transition-all"
                    >
                      내용 보기
                    </button>
                  </div>
                )}

                {/* 스포일러 숨기기 버튼 */}
                {review.isSpoiler && isRevealed && (
                  <button
                    onClick={() => toggleSpoilerReveal(review.id)}
                    className="mt-4 text-[10px] font-bold text-gray-400 hover:text-black flex items-center gap-1 uppercase tracking-widest"
                  >
                    <EyeOff size={12} /> 스포일러 숨기기
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
