"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Send, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/useAuthStore";
import { createReview, updateReview } from "@/api/bookDetail";
import type { Review } from "@/types/book";

interface ReviewInputProps {
  slug: string;
  /** 수정 중인 리뷰 — null 이면 새 리뷰 작성 모드 */
  editingReview: Review | null;
  onCancelEdit: () => void;
}

export default function ReviewInput({
  slug,
  editingReview,
  onCancelEdit,
}: ReviewInputProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn, user } = useAuthStore();

  const inputRef = useRef<HTMLDivElement>(null);

  /* ── 폼 로컬 상태 ── */
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [isSpoilerInput, setIsSpoilerInput] = useState(false);

  /** editingReview 변경 시 폼 동기화 + 스크롤 이동 */
  useEffect(() => {
    if (editingReview) {
      setComment(editingReview.content);
      setRating(editingReview.rating);
      setIsSpoilerInput(editingReview.isSpoiler);
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setComment("");
      setRating(0);
      setIsSpoilerInput(false);
    }
  }, [editingReview]);

  /* ── 캐시 무효화 헬퍼 ── */
  const invalidateReviews = () =>
    queryClient.invalidateQueries({ queryKey: ["reviews", slug] });

  /* ── 리뷰 작성 Mutation ── */
  const createMutation = useMutation({
    mutationFn: () =>
      createReview(slug, { content: comment, rating, isSpoiler: isSpoilerInput }),
    onSuccess: () => {
      invalidateReviews();
      setComment("");
      setRating(0);
      setIsSpoilerInput(false);
    },
  });

  /* ── 리뷰 수정 Mutation ── */
  const updateMutation = useMutation({
    mutationFn: () =>
      updateReview(editingReview!.id, {
        content: comment,
        rating,
        isSpoiler: isSpoilerInput,
      }),
    onSuccess: () => {
      invalidateReviews();
      onCancelEdit();
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  /** 제출 핸들러 */
  const handleSubmit = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (!comment.trim() || rating === 0) return;

    if (editingReview) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  /** 프로필 이미지 */
  const profileSrc = user?.profileImageUrl
    ? user.profileImageUrl
    : `https://picsum.photos/seed/${user?.id ?? "myprofile"}/200/200`;

  return (
    <div
      ref={inputRef}
      id="comment-input"
      className="bg-white border border-gray-100 p-8 mb-16 flex gap-6 shadow-sm relative scroll-mt-8 overflow-hidden"
    >
      {/* ── 비로그인 오버레이 ── */}
      {!isLoggedIn && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 backdrop-blur-sm bg-white/60">
          <p className="text-lg font-black tracking-tight">
            로그인 후 이용하실 수 있습니다
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-8 py-3 bg-black text-white text-sm font-black uppercase tracking-widest hover:bg-[#4D41FF] transition-all"
          >
            로그인 시작하기
          </button>
        </div>
      )}

      {/* 수정 모드 배지 */}
      {editingReview && (
        <div className="absolute -top-4 left-8 bg-black text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest">
          수정 중
        </div>
      )}

      {/* 프로필 아바타 */}
      <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-black/5">
        <img
          src={profileSrc}
          alt="내 프로필"
          className="w-full h-full object-cover grayscale"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="flex-1 space-y-6">
        {/* 별점 · 스포일러 토글 */}
        <div className="flex justify-between items-center">
          {/* 별점 */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                onClick={() => setRating(i)}
                aria-label={`${i}점`}
                className={cn(
                  "transition-all duration-200",
                  i <= rating
                    ? "text-[#4D41FF] scale-110"
                    : "text-gray-200 hover:text-gray-300"
                )}
              >
                <Star
                  size={28}
                  fill={i <= rating ? "currentColor" : "none"}
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>

          {/* 스포일러 토글 */}
          <button
            onClick={() => setIsSpoilerInput((prev) => !prev)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[11px] font-bold",
              isSpoilerInput
                ? "bg-red-50 border-red-200 text-red-600"
                : "bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-300"
            )}
          >
            <AlertCircle size={14} />
            스포일러가 있습니다
          </button>
        </div>

        {/* 텍스트 입력 */}
        <div className="relative">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="이 책에 대한 당신의 문장을 남겨주세요."
            disabled={isPending}
            className="w-full text-lg font-medium outline-none placeholder:text-gray-200 resize-none py-2 pr-12 border-b border-gray-100 focus:border-[#4D41FF] transition-all min-h-[40px] disabled:opacity-50"
            rows={1}
          />
          <button
            onClick={handleSubmit}
            disabled={isPending || !comment.trim() || rating === 0}
            aria-label="리뷰 제출"
            className="absolute right-0 bottom-2 text-black hover:text-[#4D41FF] transition-all p-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={24} />
          </button>
        </div>

        {/* 수정 취소 */}
        {editingReview && (
          <button
            onClick={onCancelEdit}
            className="text-[10px] font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest"
          >
            수정 취소
          </button>
        )}
      </div>
    </div>
  );
}
